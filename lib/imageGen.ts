import sharpLib from "sharp";
import type { OverlayOptions } from "sharp";
import type { ComicCharacterDTO, ComicBackgroundDTO } from "@/types";
import { uploadToSupabase, makeFileName } from "@/lib/storage";

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || "";
const TOGETHER_API_URL = "https://api.together.xyz/v1/images/generations";

const MODEL_TEXT_TO_IMAGE = "black-forest-labs/FLUX.1.1-pro";
const MODEL_IMAGE_TO_IMAGE = "black-forest-labs/FLUX.1-kontext-pro";

// ─── Together generate ────────────────────────────────────────────────────────
interface TogetherGenerateParams {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
  referenceImageUrl?: string;
}

async function togetherGenerate(
  params: TogetherGenerateParams,
  attempt = 0,
): Promise<string> {
  if (!TOGETHER_API_KEY) throw new Error("Thiếu TOGETHER_API_KEY");

  const useI2I = !!params.referenceImageUrl;
  const body: Record<string, unknown> = {
    model: useI2I ? MODEL_IMAGE_TO_IMAGE : MODEL_TEXT_TO_IMAGE,
    prompt: params.prompt,
    width: params.width ?? 768,
    height: params.height ?? 512,
    steps: useI2I ? 28 : 20,
    n: 1,
    disable_safety_checker: false,
  };
  if (params.seed !== undefined) body.seed = params.seed;
  if (useI2I) body.image_url = params.referenceImageUrl;

  const res = await fetch(TOGETHER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOGETHER_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  // Retry tối đa 3 lần cho 503 (server quá tải) và 429 (rate limit)
  if ((res.status === 503 || res.status === 429) && attempt < 3) {
    const delay = [3000, 6000, 12000][attempt]; // 3s, 6s, 12s
    console.warn(
      `[togetherGenerate] ${res.status} — retry ${attempt + 1}/3 sau ${delay}ms`,
    );
    await new Promise(r => setTimeout(r, delay));
    return togetherGenerate(params, attempt + 1);
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Together API ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  const url: string = data.data?.[0]?.url ?? "";
  if (!url) throw new Error("Together không trả về URL ảnh");
  return url;
}

function pollinationsUrl(prompt: string, seed = 42, w = 768, h = 512): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&seed=${seed}`;
}

function hashSeed(input: string): number {
  return (
    Math.abs(input.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 9999
  );
}

// ─── Fetch image → Buffer ─────────────────────────────────────────────────────
async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

// ─── Composite: bg + characters → single landscape image ─────────────────────
// Layout: background (896×512) + nhân vật thu nhỏ ghép vào trái/phải
// Kết quả dùng làm reference cho FLUX Kontext để giữ nhất quán nhân vật
async function buildCompositeReference(
  bgBuf: Buffer,
  charBufs: Buffer[],
): Promise<Buffer> {
  const W = 896,
    H = 512;

  // Resize background về đúng kích thước panel
  const bgResized = await sharpLib(bgBuf)
    .resize(W, H, { fit: "cover", position: "center" })
    .png()
    .toBuffer();

  if (charBufs.length === 0) return bgResized;

  // Chiều cao nhân vật = 60% chiều cao panel, giữ tỉ lệ
  const charTargetH = Math.round(H * 0.6);

  // Vị trí X của từng nhân vật (% từ trái)
  // 1 nhân vật: giữa-trái (25%)
  // 2 nhân vật: trái (12%) và phải (58%)
  // 3+ nhân vật: chia đều
  const xPositions =
    charBufs.length === 1
      ? [Math.round(W * 0.2)]
      : charBufs.length === 2
        ? [Math.round(W * 0.08), Math.round(W * 0.55)]
        : charBufs.map((_, i) => Math.round(W * (0.05 + i * 0.28)));

  // Resize và composite từng nhân vật — có xóa nền trắng
  const composites: OverlayOptions[] = [];
  for (let i = 0; i < Math.min(charBufs.length, 3); i++) {
    try {
      const meta = await sharpLib(charBufs[i]).metadata();
      const origW = meta.width ?? 512;
      const origH = meta.height ?? 768;
      const charW = Math.round(charTargetH * (origW / origH));

      // Resize rồi xóa nền trắng/gần trắng (threshold 235)
      const { data, info } = await sharpLib(charBufs[i])
        .resize(charW, charTargetH, { fit: "fill" })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const pixels = Buffer.from(data);
      const ch = info.channels; // 4 = RGBA
      for (let p = 0; p < pixels.length; p += ch) {
        if (pixels[p] > 235 && pixels[p + 1] > 235 && pixels[p + 2] > 235) {
          pixels[p + 3] = 0; // xóa pixel nền trắng
        }
      }

      const charTransparent = await sharpLib(pixels, {
        raw: { width: charW, height: charTargetH, channels: 4 },
      })
        .png()
        .toBuffer();

      const left = xPositions[i];
      const top = H - charTargetH - 10;

      composites.push({ input: charTransparent, left, top, blend: "over" });
    } catch (e) {
      console.warn(`[composite] char ${i} resize failed:`, e);
    }
  }

  if (composites.length === 0) return bgResized;

  const result = await sharpLib(bgResized)
    .composite(composites)
    .png()
    .toBuffer();

  return result;
}

// ─── generateCharacterSheet ───────────────────────────────────────────────────
export async function generateCharacterSheet(opts: {
  name: string;
  appearancePrompt: string;
  costumePrompt: string;
  ethnicCulture: string;
  gender: string;
  role: string;
  referenceImageUrl?: string | null;
}): Promise<string> {
  const {
    appearancePrompt,
    costumePrompt,
    ethnicCulture,
    gender,
    role,
    referenceImageUrl,
  } = opts;

  const roleLabel =
    role === "child"
      ? "child character"
      : role === "elder"
        ? "elderly character"
        : "adult character";
  const genderLabel =
    gender === "female" ? "female character" : "male character";

  const prompt = referenceImageUrl
    ? `Create a new original children's book character in a 2D anime style. Use the uploaded image only as a costume reference. The traditional clothing should closely match the reference image, preserving the garment structure, fabric layers, embroidery patterns, woven motifs, colors, accessories, jewelry, belts, scarves, headwear and every decorative detail visible in the costume. Keep the costume as faithful to the reference image as possible, and do not redesign, simplify, modernize or invent any new clothing elements. Generate a completely different person from the reference image. Do not copy the face, hairstyle, body shape, skin tone, age or pose. The character should be ${appearancePrompt}, a ${roleLabel}, and a ${genderLabel}. The costume should faithfully reproduce the traditional clothing shown in the reference image, representing the authentic cultural style of the ${ethnicCulture} people. Show the character standing naturally in a front view, full body, centered on a plain white background. Render the illustration as a high-quality children's book character sheet in a Japanese anime style inspired by Studio Ghibli, using clean vector-like outlines, flat cel shading, bright harmonious colors and a friendly facial expression.`
    : `Create a new original children's book character in a 2D anime style. The character should be ${appearancePrompt}, a ${roleLabel}, and a ${genderLabel}. Dress the character in authentic ${ethnicCulture} traditional clothing described as ${costumePrompt}. Show the character standing naturally in a front view, full body, centered on a plain white background. Render the illustration as a high-quality children's book character sheet in a Japanese anime style inspired by Studio Ghibli, using clean vector-like outlines, flat cel shading, bright harmonious colors and a friendly facial expression.`;

  const seed = hashSeed(opts.name);

  try {
    return await togetherGenerate({
      prompt,
      width: 512,
      height: 768,
      seed,
      referenceImageUrl: referenceImageUrl || undefined,
    });
  } catch (err) {
    console.error("[imageGen] generateCharacterSheet failed:", err);
    return pollinationsUrl(prompt, seed, 512, 768);
  }
}

// ─── generateBackgroundImage ──────────────────────────────────────────────────
export async function generateBackgroundImage(opts: {
  prompt: string;
  nameEn: string;
  referenceImageUrl?: string | null;
}): Promise<string> {
  const fullPrompt = opts.referenceImageUrl
    ? [
        "Create a clean children's book illustration background.",
        "Use the reference image only as an environment reference.",
        "Preserve the architecture, terrain, vegetation and atmosphere.",
        "Ignore all people, vehicles, animals, text, watermark, logos, advertisements, signs and temporary objects.",
        opts.prompt,
        "flat illustration",
        "warm colors",
        "wide landscape",
        "no characters",
        "no people",
        "high quality background",
      ]
        .filter(Boolean)
        .join(", ")
    : [
        opts.prompt,
        "children book illustration style, flat design, vibrant warm colors",
        "wide landscape, no people, no characters",
        "no text, no watermark, high quality background",
      ]
        .filter(Boolean)
        .join(", ");

  const seed = hashSeed(opts.nameEn);

  try {
    return await togetherGenerate({
      prompt: fullPrompt,
      width: 896,
      height: 512,
      seed,
      referenceImageUrl: opts.referenceImageUrl || undefined,
    });
  } catch (err) {
    console.error("[imageGen] generateBackgroundImage failed:", err);
    return pollinationsUrl(fullPrompt, seed, 896, 512);
  }
}

// ─── generateComicPanel ───────────────────────────────────────────────────────
// Pipeline mới:
//   1. Fetch background image + character images
//   2. Sharp composite: bg landscape + characters ghép vào trái/phải
//   3. Upload composite lên Supabase
//   4. FLUX Kontext image-to-image: dùng composite làm reference, refine style anime
//   5. Upload result → return URL
export async function generateComicPanel(opts: {
  background: ComicBackgroundDTO;
  characters: ComicCharacterDTO[];
  action: string;
  ethnicCulture: string;
  panelSeed?: number;
}): Promise<string> {
  const { background, characters, action, ethnicCulture, panelSeed } = opts;
  const seed = panelSeed ?? 42;

  // Zoom variation dựa trên seed — mỗi panel có góc nhìn khác nhau dù cùng background
  const zoomVariations = [
    "wide establishing shot, characters small in scene",
    "medium shot, characters at mid-distance",
    "closer medium shot, characters clearly visible",
    "slightly zoomed in on characters in foreground",
    "wide shot showing full background context",
    "medium-wide shot, balanced composition",
  ];
  const zoomHint = zoomVariations[seed % zoomVariations.length];

  // Prompt mô tả style để FLUX Kontext refine composite thành anime
  const charBlock = characters.length
    ? characters
        .map(c =>
          [c.appearancePrompt, c.costumePrompt].filter(Boolean).join(", "),
        )
        .join("; ")
    : "";

  const stylePrompt = [
    "Transform into anime style 2D illustration, Studio Ghibli inspired, flat cartoon, cel shading, vibrant warm colors",
    zoomHint,
    "Keep the characters in their exact positions — left side and right side of the scene",
    "Keep the background environment and its layout",
    "Enhance colors and add anime-style outlines to all characters and background",
    charBlock ? `Characters: ${charBlock}` : "",
    action,
    `${ethnicCulture} ethnic minority Tay Nguyen Vietnam`,
    "safe for children, no text, no watermark, wide landscape scene",
  ]
    .filter(Boolean)
    .join(". ");

  const textPrompt = [
    "anime style 2D illustration, Studio Ghibli inspired, flat cartoon, cel shading, vibrant warm colors",
    zoomHint,
    background.prompt || `${ethnicCulture} highland village`,
    charBlock ? `Characters: ${charBlock}` : "",
    action,
    `${ethnicCulture} ethnic minority Tay Nguyen Vietnam`,
    "safe for children, no text, no watermark, landscape orientation, wide scene",
  ]
    .filter(Boolean)
    .join(". ");

  // ── Bước 1: Thử composite pipeline ────────────────────────────────────────
  try {
    // Fetch background
    const bgUrl = background.imageUrl || background.referenceImageUrl;
    const bgBuf = bgUrl ? await fetchBuffer(bgUrl) : null;

    if (!bgBuf) {
      // Không có ảnh background → fallback text-to-image
      console.warn("[panel] No background image, using text-to-image");
      return await togetherGenerate({
        prompt: textPrompt,
        width: 896,
        height: 512,
        seed,
      });
    }

    // Fetch character images
    const charBufs: Buffer[] = [];
    for (const c of characters.slice(0, 3)) {
      const charUrl = c.characterImageUrl || c.referenceImageUrl;
      if (charUrl) {
        const buf = await fetchBuffer(charUrl);
        if (buf) charBufs.push(buf);
      }
    }

    if (charBufs.length === 0) {
      // Không có ảnh nhân vật → text-to-image với prompt đầy đủ
      console.warn("[panel] No character images, using text-to-image");
      return await togetherGenerate({
        prompt: textPrompt,
        width: 896,
        height: 512,
        seed,
      });
    }

    // ── Bước 2: Tạo composite ────────────────────────────────────────────────
    const compositeBuf = await buildCompositeReference(bgBuf, charBufs);

    // ── Bước 3: Upload composite lên Supabase ────────────────────────────────
    const compositeFileName = makeFileName("panels/composite", "png");
    const compositeUrl = await uploadToSupabase({
      buffer: compositeBuf,
      fileName: compositeFileName,
      contentType: "image/png",
    });

    // ── Bước 4: FLUX Kontext refine composite → anime style ──────────────────
    const finalUrl = await togetherGenerate({
      prompt: stylePrompt,
      width: 896,
      height: 512,
      seed,
      referenceImageUrl: compositeUrl,
    });

    return finalUrl;
  } catch (err) {
    console.error(
      "[imageGen] generateComicPanel composite failed, fallback to text-to-image:",
      err,
    );
    // Fallback: text-to-image thuần nếu composite pipeline thất bại
    try {
      return await togetherGenerate({
        prompt: textPrompt,
        width: 896,
        height: 512,
        seed,
      });
    } catch (err2) {
      console.error(
        "[imageGen] generateComicPanel text-to-image also failed:",
        err2,
      );
      return pollinationsUrl(textPrompt, seed, 896, 512);
    }
  }
}

// ─── buildPanelPrompt (dùng để preview, không gọi API) ───────────────────────
export async function buildPanelPrompt(opts: {
  background: ComicBackgroundDTO;
  characters: ComicCharacterDTO[];
  action: string;
  ethnicCulture: string;
}): Promise<string> {
  const { background, characters, action, ethnicCulture } = opts;
  const charDesc = characters
    .map(c => `${c.appearancePrompt}, ${c.costumePrompt}`)
    .join("; ");
  return [
    background.prompt || `${ethnicCulture} highland village scene`,
    charDesc,
    action,
    "children book illustration style, flat design, vibrant warm colors",
    `${ethnicCulture} ethnic minority culture, Tay Nguyen highlands`,
    "safe for children, no text, no watermark, high quality",
  ]
    .filter(Boolean)
    .join(", ");
}
