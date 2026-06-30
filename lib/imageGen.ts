import type { ComicCharacterDTO, ComicBackgroundDTO } from "@/types";

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || "";
const TOGETHER_API_URL = "https://api.together.xyz/v1/images/generations";

const MODEL_TEXT_TO_IMAGE = "black-forest-labs/FLUX.1-schnell-Free";
const MODEL_IMAGE_TO_IMAGE = "black-forest-labs/FLUX.1-kontext-dev";

interface TogetherGenerateParams {
  prompt: string;
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
    width: params.width ?? 768,
    height: params.height ?? 512,
    steps: useImageToImage ? 28 : 4,
    n: 1,
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
        "Redraw this exact traditional costume as a 2D cartoon character design",
        "full body front view, white background",
        appearancePrompt,
        `${ethnicCulture} ethnic minority traditional costume, keep the costume colors and patterns from the reference image`,
        "children book illustration style, flat design, vibrant colors, clean outlines",
        roleLabel,
        genderLabel,
        "no background scenery, centered standing pose, high quality character sheet",
      ].join(", ")
    : [
        "2D cartoon character design, full body front view, white background",
        appearancePrompt,
        costumePrompt,
        `${ethnicCulture} ethnic minority traditional costume`,
        "children book illustration style, flat design, vibrant colors, clean outlines",
        roleLabel,
        genderLabel,
        "no background scenery, centered standing pose, high quality character sheet",
      ].join(", ");

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

export async function generateBackgroundImage(opts: {
  prompt: string;
  nameEn: string;
  ethnicCulture?: string;
  referenceImageUrl?: string | null;
}): Promise<string> {
  const fullPrompt = opts.referenceImageUrl
    ? [
        "Redraw this scene as a children's book illustration background",
        opts.prompt,
        opts.ethnicCulture
          ? `${opts.ethnicCulture} ethnic minority Tay Nguyen highlands`
          : "",
        "flat design, vibrant warm colors, wide landscape, no people, no characters",
        "no text, no watermark, high quality background",
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
