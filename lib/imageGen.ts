import sharpLib from "sharp";
import type { OverlayOptions } from "sharp";
import type { ComicCharacterDTO, ComicBackgroundDTO } from "@/types";
import { uploadToSupabase, deleteFromSupabase, makeFileName } from "@/lib/storage";

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
    if (err.includes("third_party_data_sharing_blocked"))
      throw new Error(
        "TOGETHER_BLOCKED: Together.ai chưa bật 'third-party data sharing' cho tài khoản nên không dùng được model FLUX. Vào Together > Settings > Privacy để bật.",
      );
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
async function fetchBuffer(url: string, timeoutMs = 15000): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

// ─── Tách nền nhân vật (flood-fill từ viền, giữ phần trắng bên trong trang phục) ─
export interface Cutout {
  buf: Buffer; // PNG RGBA, đã crop sát nhân vật
  w: number;
  h: number;
}

/**
 * Tách nhân vật khỏi nền trắng của character sheet.
 * - Chỉ xóa vùng "gần trắng" NỐI VỚI VIỀN ẢNH (không xóa nhầm áo trắng/sáng ở bên trong)
 * - Bỏ các mảnh rời nhỏ (watermark, chữ, vệt bẩn)
 * - Gỡ viền trắng (halo) và làm mềm mép alpha
 * - Crop sát bounding box để canh chiều cao/chân chính xác
 */
export async function cutoutCharacter(src: Buffer): Promise<Cutout | null> {
  const { data, info } = await sharpLib(src)
    .rotate()
    .flatten({ background: "#ffffff" })
    .resize({ height: 640, fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width,
    H = info.height,
    N = W * H;

  const lum = (p: number) =>
    0.299 * data[p * 3] + 0.587 * data[p * 3 + 1] + 0.114 * data[p * 3 + 2];
  const bgLike = (p: number) => {
    const r = data[p * 3],
      g = data[p * 3 + 1],
      b = data[p * 3 + 2];
    return (
      r > 212 &&
      g > 212 &&
      b > 212 &&
      Math.max(r, g, b) - Math.min(r, g, b) < 30
    );
  };

  // 1) flood-fill nền từ viền
  const bg = new Uint8Array(N);
  const stack = new Int32Array(N);
  let sp = 0;
  const push = (p: number) => {
    if (!bg[p] && bgLike(p)) {
      bg[p] = 1;
      stack[sp++] = p;
    }
  };
  for (let x = 0; x < W; x++) {
    push(x);
    push((H - 1) * W + x);
  }
  for (let y = 0; y < H; y++) {
    push(y * W);
    push(y * W + W - 1);
  }
  while (sp > 0) {
    const p = stack[--sp];
    const x = p % W;
    if (x > 0) push(p - 1);
    if (x < W - 1) push(p + 1);
    if (p >= W) push(p - W);
    if (p < N - W) push(p + W);
  }

  // 2) giữ thành phần liên thông lớn nhất + các mảnh >= 3% (tay, dép, tóc rời)
  const label = new Int32Array(N);
  const sizes: number[] = [0];
  let nComp = 0;
  for (let i = 0; i < N; i++) {
    if (bg[i] || label[i]) continue;
    nComp++;
    let size = 0;
    sp = 0;
    stack[sp++] = i;
    label[i] = nComp;
    while (sp > 0) {
      const p = stack[--sp];
      size++;
      const x = p % W;
      const nb = [
        x > 0 ? p - 1 : -1,
        x < W - 1 ? p + 1 : -1,
        p >= W ? p - W : -1,
        p < N - W ? p + W : -1,
      ];
      for (const q of nb) {
        if (q >= 0 && !bg[q] && !label[q]) {
          label[q] = nComp;
          stack[sp++] = q;
        }
      }
    }
    sizes.push(size);
  }
  if (nComp === 0) return null;
  const maxSize = Math.max(...sizes);
  const keep = sizes.map(s => s >= maxSize * 0.03);
  const alpha = new Uint8Array(N);
  for (let i = 0; i < N; i++) alpha[i] = !bg[i] && keep[label[i]] ? 255 : 0;

  // 3) gỡ halo trắng ở mép (2 lượt)
  for (let pass = 0; pass < 2; pass++) {
    const kill: number[] = [];
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const p = y * W + x;
        if (!alpha[p]) continue;
        const edge =
          !alpha[p - 1] || !alpha[p + 1] || !alpha[p - W] || !alpha[p + W];
        if (edge && lum(p) > 205) kill.push(p);
      }
    }
    for (const p of kill) alpha[p] = 0;
  }

  // 4) bounding box
  let x0 = W,
    y0 = H,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (alpha[y * W + x]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return null;

  // 5) làm mềm alpha (blur nhẹ) rồi ghép RGBA
  const blurred = await sharpLib(Buffer.from(alpha), {
    raw: { width: W, height: H, channels: 1 },
  })
    .blur(0.8)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const softAlpha = blurred.data;
  const aStride = blurred.info.channels; // sharp có thể trả >1 kênh; chỉ lấy kênh đầu
  const rgba = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    rgba[i * 4] = data[i * 3];
    rgba[i * 4 + 1] = data[i * 3 + 1];
    rgba[i * 4 + 2] = data[i * 3 + 2];
    rgba[i * 4 + 3] = softAlpha[i * aStride];
  }
  const cw = x1 - x0 + 1,
    ch = y1 - y0 + 1;
  const png = await sharpLib(rgba, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: x0, top: y0, width: cw, height: ch })
    .png()
    .toBuffer();
  return { buf: png, w: cw, h: ch };
}

// ─── Bố cục panel ─────────────────────────────────────────────────────────────
export const PANEL_W = 896;
export const PANEL_H = 512;

// Chiều cao nhân vật theo vai trò (tỉ lệ so với chiều cao panel)
const ROLE_HEIGHT: Record<string, number> = {
  child: 0.52,
  adult: 0.66,
  elder: 0.6,
};

interface Placed {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Mỗi panel một "cú máy" khác nhau để tránh nhàm: [zoom nền, cỡ nhân vật, lệch ngang nền 0..1]
const SHOTS: { bgZoom: number; charScale: number; bgPan: number; label: string }[] = [
  { bgZoom: 1.0, charScale: 0.85, bgPan: 0.5, label: "wide establishing shot" },
  { bgZoom: 1.15, charScale: 1.0, bgPan: 0.25, label: "medium shot" },
  { bgZoom: 1.3, charScale: 1.2, bgPan: 0.75, label: "closer medium shot" },
  { bgZoom: 1.1, charScale: 0.95, bgPan: 0.6, label: "medium-wide shot" },
  { bgZoom: 1.4, charScale: 1.3, bgPan: 0.35, label: "close shot" },
  { bgZoom: 1.0, charScale: 0.9, bgPan: 0.15, label: "wide shot" },
];

export function pickShot(panelIndex: number) {
  return SHOTS[panelIndex % SHOTS.length];
}

async function prepareBackground(bgBuf: Buffer, shot: ReturnType<typeof pickShot>) {
  const zw = Math.round(PANEL_W * shot.bgZoom);
  const zh = Math.round(PANEL_H * shot.bgZoom);
  const scaled = await sharpLib(bgBuf)
    .resize(zw, zh, { fit: "cover", position: "center" })
    .toBuffer();
  const left = Math.round((zw - PANEL_W) * shot.bgPan);
  const top = Math.round((zh - PANEL_H) * 0.6);
  return sharpLib(scaled)
    .extract({ left, top, width: PANEL_W, height: PANEL_H })
    .png()
    .toBuffer();
}

/**
 * Ghép nền + nhân vật đã tách nền: đúng tỉ lệ theo vai trò, có bóng đổ dưới chân,
 * hòa nhẹ độ sáng với nền. Trả về ảnh + khung (bbox) từng nhân vật để kiểm tra sau.
 */
export async function buildComposite(
  bgBuf: Buffer,
  chars: { cutout: Cutout; role: string }[],
  shot: ReturnType<typeof pickShot>,
): Promise<{ buf: Buffer; boxes: Placed[] }> {
  const bg = await prepareBackground(bgBuf, shot);
  const n = chars.length;
  if (n === 0) return { buf: bg, boxes: [] };

  // độ sáng nền ở nửa dưới → chỉnh nhẹ nhân vật cho hòa
  const stats = await sharpLib(bg)
    .extract({ left: 0, top: Math.round(PANEL_H * 0.5), width: PANEL_W, height: Math.round(PANEL_H * 0.5) })
    .stats();
  const bgLum =
    (0.299 * stats.channels[0].mean + 0.587 * stats.channels[1].mean + 0.114 * stats.channels[2].mean) / 255;
  const brightness = Math.min(1.04, Math.max(0.9, 0.86 + bgLum * 0.22));

  const bgTint = {
    r: Math.round(stats.channels[0].mean),
    g: Math.round(stats.channels[1].mean),
    b: Math.round(stats.channels[2].mean),
  };
  const centers = n === 1 ? [0.32] : n === 2 ? [0.3, 0.68] : [0.2, 0.5, 0.8];
  const comps: OverlayOptions[] = [];
  const shadows: OverlayOptions[] = [];
  const boxes: Placed[] = [];

  for (let i = 0; i < Math.min(n, 3); i++) {
    const { cutout, role } = chars[i];
    let h = Math.round(PANEL_H * (ROLE_HEIGHT[role] ?? 0.62) * shot.charScale);
    h = Math.min(h, Math.round(PANEL_H * 0.92));
    const w = Math.round(h * (cutout.w / cutout.h));
    const resized = await sharpLib(cutout.buf)
      .resize(w, h, { fit: "fill" })
      .modulate({ brightness, saturation: 0.97 })
      .ensureAlpha()
      .png()
      .toBuffer();
    // phủ nhẹ (~14%) màu môi trường của nền lên nhân vật (chỉ trong vùng nhân vật) cho đỡ "dán"
    const rawPiece = await sharpLib(resized).ensureAlpha().raw().toBuffer();
    const tintRaw = Buffer.alloc(w * h * 4);
    for (let q = 0; q < w * h; q++) {
      tintRaw[q * 4] = bgTint.r;
      tintRaw[q * 4 + 1] = bgTint.g;
      tintRaw[q * 4 + 2] = bgTint.b;
      tintRaw[q * 4 + 3] = Math.round(rawPiece[q * 4 + 3] * 0.14);
    }
    const tintLayer = await sharpLib(tintRaw, { raw: { width: w, height: h, channels: 4 } })
      .png()
      .toBuffer();
    const piece = await sharpLib(resized)
      .composite([{ input: tintLayer, blend: "over" }])
      .png()
      .toBuffer();
    const left = Math.max(0, Math.min(PANEL_W - w, Math.round(PANEL_W * centers[i] - w / 2)));
    const footY = PANEL_H - 14 - (i % 2 === 1 ? 6 : 0);
    const top = Math.max(0, footY - h);

    // bóng đổ hình elip mờ dưới chân
    const sw = Math.round(w * 0.9),
      sh = Math.max(14, Math.round(h * 0.07));
    const shadow = await sharpLib(
      Buffer.from(
        `<svg width="${sw}" height="${sh}" xmlns="http://www.w3.org/2000/svg"><ellipse cx="${sw / 2}" cy="${sh / 2}" rx="${sw / 2 - 2}" ry="${sh / 2 - 2}" fill="black" fill-opacity="0.32"/></svg>`,
      ),
    )
      .blur(4)
      .png()
      .toBuffer();
    shadows.push({
      input: shadow,
      left: Math.max(0, Math.min(PANEL_W - sw, left + Math.round((w - sw) / 2))),
      top: Math.min(PANEL_H - sh, footY - Math.round(sh * 0.6)),
    });
    comps.push({ input: piece, left, top, blend: "over" });
    boxes.push({ x: left, y: top, w, h });
  }

  const buf = await sharpLib(bg)
    .composite([...shadows, ...comps])
    .png()
    .toBuffer();
  return { buf, boxes };
}

/** Độ lệch màu trung bình (0-255) giữa 2 ảnh trong các khung nhân vật → phát hiện nhân vật bị xóa/vẽ lại. */
export async function regionDifference(
  a: Buffer,
  b: Buffer,
  boxes: Placed[],
): Promise<number> {
  const SW = 224,
    SH = 128;
  const toRaw = (x: Buffer) =>
    sharpLib(x).resize(SW, SH, { fit: "fill" }).removeAlpha().raw().toBuffer();
  const [ra, rb] = await Promise.all([toRaw(a), toRaw(b)]);
  const fx = SW / PANEL_W,
    fy = SH / PANEL_H;
  let worst = 0;
  for (const bx of boxes) {
    const x0 = Math.max(0, Math.floor(bx.x * fx)),
      x1 = Math.min(SW, Math.ceil((bx.x + bx.w) * fx));
    const y0 = Math.max(0, Math.floor(bx.y * fy)),
      y1 = Math.min(SH, Math.ceil((bx.y + bx.h) * fy));
    let sum = 0,
      cnt = 0;
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const p = (y * SW + x) * 3;
        sum += Math.abs(ra[p] - rb[p]) + Math.abs(ra[p + 1] - rb[p + 1]) + Math.abs(ra[p + 2] - rb[p + 2]);
        cnt += 3;
      }
    if (cnt) worst = Math.max(worst, sum / cnt);
  }
  return worst;
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
    ? `Create a new original children's book character in a 2D anime style. Use the uploaded image only as a costume reference. The traditional clothing should closely match the reference image, preserving the garment structure, fabric layers, embroidery patterns, woven motifs, colors, accessories, jewelry, belts, scarves, headwear and every decorative detail visible in the costume. Keep the costume as faithful to the reference image as possible, and do not redesign, simplify, modernize or invent any new clothing elements. Generate a completely different person from the reference image. Do not copy the face, hairstyle, body shape, skin tone, age or pose. The character should be ${appearancePrompt}, a ${roleLabel}, and a ${genderLabel}. The costume should faithfully reproduce the traditional clothing shown in the reference image, representing the authentic cultural style of the ${ethnicCulture} people. Show the character standing naturally in a front view, full body, centered on a plain white background. Render the illustration as a high-quality children's book character sheet in a Japanese anime style inspired by Studio Ghibli, using clean vector-like outlines, flat cel shading, bright harmonious colors and a friendly facial expression. Pure white background, no text, no watermark, no logo, no signature, no shadow on the ground.`
    : `Create a new original children's book character in a 2D anime style. The character should be ${appearancePrompt}, a ${roleLabel}, and a ${genderLabel}. Dress the character in authentic ${ethnicCulture} traditional clothing described as ${costumePrompt}. Show the character standing naturally in a front view, full body, centered on a plain white background. Render the illustration as a high-quality children's book character sheet in a Japanese anime style inspired by Studio Ghibli, using clean vector-like outlines, flat cel shading, bright harmonious colors and a friendly facial expression. Pure white background, no text, no watermark, no logo, no signature, no shadow on the ground.`;

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
        "no text, no watermark, no Chinese or Japanese style buildings, no lanterns, Central Highlands of Vietnam setting",
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
// Pipeline:
//   1. Tải nền + ảnh nhân vật, tách nền nhân vật (flood-fill), ghép composite đúng tỉ lệ + bóng
//   2. FLUX Kontext CHỈ để hòa ánh sáng/màu (chỉ dẫn bảo toàn nhân vật), không "vẽ lại"
//   3. Kiểm tra: nhân vật còn nguyên trong ảnh kết quả? Nếu không → thử lại 1 lần với seed khác
//   4. Vẫn hỏng → dùng chính composite (nhân vật luôn có mặt) và đánh dấu degraded
//   5. Không bao giờ rơi im lặng về text→image khi có ảnh nhân vật; mọi suy giảm đều trả cờ `degraded`
export interface PanelResult {
  url: string;
  mode: "kontext" | "composite" | "text2img" | "pollinations";
  degraded: boolean;
  note?: string;
  attempts: number;
  diff?: number;
}

// Ngưỡng độ lệch vùng nhân vật (0-255). Hiệu chỉnh bằng thí nghiệm (scripts/test-panel.ts).
export const CHARACTER_DIFF_THRESHOLD = 34;

async function storeJpeg(buf: Buffer, fileName: string): Promise<string> {
  const jpg = await sharpLib(buf).jpeg({ quality: 88 }).toBuffer();
  return uploadToSupabase({ buffer: jpg, fileName, contentType: "image/jpeg" });
}

export async function generateComicPanel(opts: {
  background: ComicBackgroundDTO;
  characters: ComicCharacterDTO[];
  action: string;
  ethnicCulture: string;
  panelSeed?: number;
  panelIndex?: number;
  fileName: string; // nơi lưu ảnh cuối trên Supabase, vd "lessons/<id>/panel-1/xxx.jpg"
  skipKontext?: boolean; // chỉ dùng cho test/preview
}): Promise<PanelResult> {
  const { background, characters, action, ethnicCulture, fileName } = opts;
  const seed = opts.panelSeed ?? 42;
  const idx = opts.panelIndex ?? seed % 6;
  const shot = pickShot(idx);

  const textPrompt = [
    "anime style 2D illustration, Studio Ghibli inspired, flat cartoon, cel shading, vibrant warm colors",
    shot.label,
    background.prompt || `${ethnicCulture} highland village`,
    characters.length
      ? `Characters: ${characters.map(c => [c.appearancePrompt, c.costumePrompt].filter(Boolean).join(", ")).join("; ")}`
      : "",
    action,
    `${ethnicCulture} ethnic minority, Central Highlands of Vietnam`,
    "safe for children, no text, no watermark, no Chinese or Japanese architecture, wide scene",
  ]
    .filter(Boolean)
    .join(". ");

  const text2img = async (note: string): Promise<PanelResult> => {
    try {
      const u = await togetherGenerate({ prompt: textPrompt, width: PANEL_W, height: PANEL_H, seed });
      const buf = await fetchBuffer(u, 30000);
      const url = buf ? await storeJpeg(buf, fileName).catch(() => u) : u;
      return { url, mode: "text2img", degraded: true, note, attempts: 1 };
    } catch (e) {
      console.error("[panel] text2img failed:", e);
      return {
        url: pollinationsUrl(textPrompt, seed, PANEL_W, PANEL_H),
        mode: "pollinations",
        degraded: true,
        note: `${note}; AI tạo ảnh lỗi`,
        attempts: 1,
      };
    }
  };

  const bgUrl = background.imageUrl || background.referenceImageUrl;
  const bgBuf = bgUrl ? await fetchBuffer(bgUrl) : null;
  if (!bgBuf) return text2img("Thiếu ảnh nền, ảnh được vẽ từ mô tả");

  // Tách nền các nhân vật có ảnh
  const cuts: { cutout: Cutout; role: string; name: string }[] = [];
  const missing: string[] = [];
  for (const c of characters.slice(0, 3)) {
    const u = c.characterImageUrl || c.referenceImageUrl;
    const b = u ? await fetchBuffer(u) : null;
    const cut = b ? await cutoutCharacter(b).catch(() => null) : null;
    if (cut) cuts.push({ cutout: cut, role: c.role, name: c.name });
    else missing.push(c.name);
  }
  if (cuts.length === 0 && characters.length > 0)
    return text2img("Không có ảnh nhân vật, ảnh được vẽ từ mô tả");

  const { buf: composite, boxes } = await buildComposite(bgBuf, cuts, shot);
  const missNote = missing.length ? `Thiếu ảnh nhân vật: ${missing.join(", ")}` : undefined;

  // Không có nhân vật hoặc chỉ cần ảnh ghép
  if (opts.skipKontext || cuts.length === 0) {
    const url = await storeJpeg(composite, fileName);
    return { url, mode: "composite", degraded: !!missNote, note: missNote, attempts: 0 };
  }

  // Kontext chỉ nhận URL → upload tạm composite, xong xóa
  const tmpName = makeFileName("panels/tmp", "png");
  let tmpUrl: string;
  try {
    tmpUrl = await uploadToSupabase({ buffer: composite, fileName: tmpName, contentType: "image/png" });
  } catch (e) {
    console.error("[panel] upload composite failed:", e);
    const url = await storeJpeg(composite, fileName);
    return { url, mode: "composite", degraded: true, note: "Không upload được ảnh tạm, dùng ảnh ghép", attempts: 0 };
  }

  const keep =
    "Keep every character EXACTLY as drawn: same faces, hair, skin tone, outfit, colors and patterns, same size and position. " +
    "Do not add, remove, redraw or replace any person. Do not change the background layout.";
  const prompts = [
    `Polish this children's book illustration so the characters sit naturally in the scene: unify lighting and color harmony, soften edges, add gentle ground contact shadows. ${keep} Scene context: ${action}. Style: Studio Ghibli inspired 2D anime, flat cel shading. No text, no watermark, no logos, no calligraphy.`,
    `Lightly harmonize lighting between the characters and the background only. ${keep} Change nothing else. No text, no watermark.`,
  ];

  let lastDiff: number | undefined;
  let attempts = 0;
  let blocked = "";
  try {
    for (let a = 0; a < 2; a++) {
      attempts++;
      try {
        const u = await togetherGenerate({
          prompt: prompts[a],
          width: PANEL_W,
          height: PANEL_H,
          seed: seed + a * 101,
          referenceImageUrl: tmpUrl,
        });
        const out = await fetchBuffer(u, 30000);
        if (!out) continue;
        const diff = await regionDifference(composite, out, boxes);
        lastDiff = diff;
        if (diff <= CHARACTER_DIFF_THRESHOLD) {
          const url = await storeJpeg(out, fileName);
          return { url, mode: "kontext", degraded: !!missNote, note: missNote, attempts, diff };
        }
        console.warn(`[panel] nhân vật bị thay đổi (diff=${diff.toFixed(1)}), lần ${a + 1}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn("[panel] Kontext lỗi:", msg);
        if (msg.startsWith("TOGETHER_BLOCKED")) {
          blocked = msg.replace("TOGETHER_BLOCKED: ", "");
          break; // thử lại cũng vô ích
        }
      }
    }
  } finally {
    deleteFromSupabase(tmpName).catch(() => {});
  }

  const url = await storeJpeg(composite, fileName);
  return {
    url,
    mode: "composite",
    degraded: true,
    note:
      blocked ||
      "AI làm mượt ảnh không giữ được nhân vật, đang dùng ảnh ghép. Có thể nhấn Vẽ lại.",
    attempts,
    diff: lastDiff,
  };
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
