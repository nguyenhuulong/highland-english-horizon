import type { ComicCharacterDTO, ComicBackgroundDTO } from "@/types";

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || "";
const TOGETHER_API_URL = "https://api.together.xyz/v1/images/generations";

const MODEL_TEXT_TO_IMAGE = "black-forest-labs/FLUX.1.1-pro";
const MODEL_IMAGE_TO_IMAGE = "black-forest-labs/FLUX.1-kontext-pro";

interface TogetherGenerateParams {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  seed?: number;
  referenceImageUrl?: string;
}

async function togetherGenerate(
  params: TogetherGenerateParams,
): Promise<string> {
  if (!TOGETHER_API_KEY) {
    throw new Error("Thiếu TOGETHER_API_KEY trong biến môi trường");
  }

  const useImageToImage = !!params.referenceImageUrl;
  const body: Record<string, unknown> = {
    model: useImageToImage ? MODEL_IMAGE_TO_IMAGE : MODEL_TEXT_TO_IMAGE,
    prompt: params.prompt,
    negative_prompt: params.negativePrompt,
    width: params.width ?? 768,
    height: params.height ?? 512,
    steps: useImageToImage ? 40 : 4,
    n: 1,
    disable_safety_checker: false,
  };
  if (params.seed !== undefined) body.seed = params.seed;
  if (useImageToImage) body.image_url = params.referenceImageUrl;

  const res = await fetch(TOGETHER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOGETHER_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

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
    ? `
Create a new original children's book character in a 2D anime style. Use the uploaded image only as a costume reference. The traditional clothing should closely match the reference image, preserving the garment structure, fabric layers, embroidery patterns, woven motifs, colors, accessories, jewelry, belts, scarves, headwear and every decorative detail visible in the costume. Keep the costume as faithful to the reference image as possible, and do not redesign, simplify, modernize or invent any new clothing elements. Generate a completely different person from the reference image. Do not copy the face, hairstyle, body shape, skin tone, age or pose. The character should be ${appearancePrompt}, a ${roleLabel}, and a ${genderLabel}. The costume should faithfully reproduce the traditional clothing shown in the reference image, representing the authentic cultural style of the ${ethnicCulture} people. Show the character standing naturally in a front view, full body, centered on a plain white background. Render the illustration as a high-quality children's book character sheet in a Japanese anime style inspired by Studio Ghibli, using clean vector-like outlines, flat cel shading, bright harmonious colors and a friendly facial expression.
`.trim()
    : `
Create a new original children's book character in a 2D anime style. The character should be ${appearancePrompt}, a ${roleLabel}, and a ${genderLabel}. Dress the character in authentic ${ethnicCulture} traditional clothing described as ${costumePrompt}. Show the character standing naturally in a front view, full body, centered on a plain white background. Render the illustration as a high-quality children's book character sheet in a Japanese anime style inspired by Studio Ghibli, using clean vector-like outlines, flat cel shading, bright harmonious colors and a friendly facial expression.
`.trim();

  const seed = hashSeed(opts.name);

  const negativePrompt = [
    // text
    "watermark",
    "logo",
    "signature",
    "caption",
    "subtitle",
    "brand",
    "shop",
    "store",
    "advertisement",
    "advertising",
    "price tag",
    "barcode",
    "QR code",
    "label",
    "text",

    // photo
    "photograph",
    "photo",
    "realistic",
    "3D render",
    "CGI",
    "hyperrealistic",
    "photorealistic",
    "portrait photography",
    "DSLR photo",
    "skin pores",
    "real person",

    // background
    "background scenery",
    "room",
    "street",
    "forest background",
    "studio background",

    // composition
    "cropped",
    "close up",
    "half body",
    "multiple people",
    "duplicate character",

    // anatomy
    "extra arms",
    "extra legs",
    "extra fingers",
    "missing fingers",
    "deformed hands",
    "bad anatomy",

    // quality
    "low quality",
    "blurry",
    "noisy",
    "artifact",
    "distorted",
  ].join(", ");

  try {
    return await togetherGenerate({
      prompt,
      negativePrompt,
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

export async function generateComicPanel(opts: {
  background: ComicBackgroundDTO;
  characters: ComicCharacterDTO[];
  action: string;
  ethnicCulture: string;
  panelSeed?: number;
}): Promise<string> {
  const { background, characters, action, ethnicCulture, panelSeed } = opts;

  // Mô tả nhân vật chi tiết để tăng nhất quán
  const charDescriptions = characters.map(c => {
    const parts = [c.appearancePrompt, c.costumePrompt].filter(Boolean);
    return parts.join(", ");
  });
  const charBlock = charDescriptions.length
    ? `Characters: ${charDescriptions.join("; ")}`
    : "";

  const bgPrompt = background.prompt || `${ethnicCulture} highland village`;

  const prompt = [
    // Phong cách nhất quán
    "anime style 2D illustration, Studio Ghibli inspired, flat cartoon, cel shading, vibrant warm colors, NOT photorealistic, NOT realistic",
    // Bối cảnh
    bgPrompt,
    // Nhân vật
    charBlock,
    // Hành động
    action,
    // Văn hóa
    `${ethnicCulture} ethnic minority Tay Nguyen Vietnam`,
    // Chất lượng
    "safe for children, no text, no watermark, landscape orientation, wide scene",
  ]
    .filter(Boolean)
    .join(". ");

  const negativePrompt = [
    "portrait orientation",
    "vertical image",
    "photo",
    "realistic",
    "3D render",
    "CGI",
    "hyperrealistic",
    "photorealistic",
    "portrait photography",
    "text",
    "watermark",
    "logo",
    "multiple panels",
    "comic grid",
    "ugly",
    "deformed",
    "extra limbs",
  ].join(", ");

  // KHÔNG dùng characterImageUrl làm reference vì:
  // 1. characterImageUrl là ảnh dọc 512×768 → FLUX Kontext tạo ảnh dọc theo
  // 2. Gây mất nhất quán nhân vật qua các panel vì style bị override
  // Thay vào đó mô tả nhân vật chi tiết trong prompt (charBlock ở trên)
  const seed = panelSeed ?? 42;

  try {
    return await togetherGenerate({
      prompt,
      negativePrompt,
      width: 896,
      height: 512,
      seed,
    });
  } catch (err) {
    console.error("[imageGen] generateComicPanel failed:", err);
    return pollinationsUrl(prompt, seed, 896, 512);
  }
}

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
