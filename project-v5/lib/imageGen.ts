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
    steps: useImageToImage ? 28 : 4,
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
    ? [
        // ===== Identity =====
        "Create a new original 2D children's book character.",
        "Do NOT recreate the person in the reference image.",
        appearancePrompt,
        roleLabel,
        genderLabel,

        // ===== Costume =====
        "Use the reference image ONLY to extract the traditional costume.",
        costumePrompt,
        `${ethnicCulture} ethnic minority traditional costume.`,
        "Preserve only the clothing style, embroidery, weaving patterns, colors, accessories and ornaments.",
        "Do not copy the human model or pose.",

        // ===== Ignore reference =====
        "Ignore face, hairstyle, body shape, skin tone, age, pose, lighting, camera angle, background, watermark, logo, text, price tags, shop elements and all unrelated objects from the reference image.",

        // ===== Style =====
        "Front view.",
        "Standing naturally.",
        "Full body.",
        "Centered composition.",
        "White background.",
        "Flat children's book illustration.",
        "Clean vector-like outlines.",
        "Bright harmonious colors.",
        "Friendly facial expression.",
        "Consistent character sheet.",
        "High quality.",
      ].join(", ")
    : [
        "Create a 2D cartoon children's book character.",
        appearancePrompt,
        costumePrompt,
        `${ethnicCulture} ethnic minority traditional costume`,
        roleLabel,
        genderLabel,
        "standing naturally",
        "front view",
        "full body",
        "centered",
        "white background",
        "flat children's book illustration",
        "clean outline",
        "bright colors",
        "high quality character sheet",
      ].join(", ");

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
    "real person",
    "human model",
    "fashion model",
    "mannequin",

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
  ethnicCulture?: string;
  referenceImageUrl?: string | null;
}): Promise<string> {
  const fullPrompt = opts.referenceImageUrl
    ? [
        "Create a clean children's book illustration background.",
        "Use the reference image only as an environment reference.",
        "Preserve the architecture, terrain, vegetation and atmosphere.",
        "Ignore all people, vehicles, animals, text, watermark, logos, advertisements, signs and temporary objects.",
        opts.prompt,
        opts.ethnicCulture
          ? `${opts.ethnicCulture} ethnic minority Tay Nguyen Highlands`
          : "",
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
        opts.ethnicCulture
          ? `${opts.ethnicCulture} ethnic minority Tay Nguyen highlands`
          : "",
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

  const charDesc = characters
    .map(c => `${c.appearancePrompt}, ${c.costumePrompt}`)
    .join("; ");

  const prompt = [
    background.prompt || `${ethnicCulture} highland village scene`,
    charDesc,
    action,
    "children book illustration style, flat design, vibrant warm colors",
    `${ethnicCulture} ethnic minority culture, Tay Nguyen highlands`,
    "safe for children, no text, no watermark, high quality comic panel",
  ]
    .filter(Boolean)
    .join(", ");

  const referenceChar = characters.find(c => c.characterImageUrl);
  const seed = panelSeed ?? 42;

  try {
    return await togetherGenerate({
      prompt,
      width: 896,
      height: 512,
      seed,
      referenceImageUrl: referenceChar?.characterImageUrl || undefined,
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
