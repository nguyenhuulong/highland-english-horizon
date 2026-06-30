import type { ComicCharacterDTO, ComicBackgroundDTO } from "@/types";

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || "";
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || "";

// ─── Together.ai FLUX.1-schnell-Free ─────────────────────────────────────────
// Dùng để gen character sheet & background (không cần image conditioning)

async function togetherGenerate(opts: {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
}): Promise<string> {
  const res = await fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOGETHER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "black-forest-labs/FLUX.1-schnell-Free",
      prompt: opts.prompt,
      width: opts.width ?? 768,
      height: opts.height ?? 512,
      steps: 4,
      n: 1,
      seed: opts.seed,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Together API ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  const url: string = data.data?.[0]?.url ?? "";
  if (!url) throw new Error("Together returned no image URL");
  return url;
}

// ─── Replicate FLUX-dev (image conditioning) ──────────────────────────────────
// Dùng để gen panel có reference ảnh nhân vật → nhất quán style

async function replicateFluxDev(opts: {
  prompt: string;
  width?: number;
  height?: number;
  imageUrl?: string; // reference image URL cho image conditioning
  strength?: number; // 0–1, mức độ ảnh hưởng của reference (0.75 là hợp lý)
  seed?: number;
}): Promise<string> {
  const input: Record<string, unknown> = {
    prompt: opts.prompt,
    width: opts.width ?? 768,
    height: opts.height ?? 512,
    num_inference_steps: 28,
    guidance_scale: 3.5,
    negative_prompt:
      "realistic photo, photograph, 3d render, ugly, deformed, blurry, adult content, violence, watermark, text, logo",
  };

  if (opts.seed !== undefined) input.seed = opts.seed;

  // Image conditioning — FLUX-dev hỗ trợ qua field `image` + `strength`
  if (opts.imageUrl) {
    input.image = opts.imageUrl;
    input.strength = opts.strength ?? 0.75;
  }

  // Gọi API theo kiểu "prefer: wait" để không phải poll (timeout 60s)
  const createRes = await fetch(
    "https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        Prefer: "wait=60",
      },
      body: JSON.stringify({ input }),
    },
  );

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Replicate ${createRes.status}: ${err.slice(0, 200)}`);
  }

  const pred = await createRes.json();

  // Nếu "wait" trả về thẳng kết quả
  if (pred.status === "succeeded") {
    const out = Array.isArray(pred.output) ? pred.output[0] : pred.output;
    if (out) return out as string;
  }

  // Nếu vẫn processing → poll
  const id: string = pred.id;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const pollRes = await fetch(
      `https://api.replicate.com/v1/predictions/${id}`,
      { headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` } },
    );
    const p = await pollRes.json();
    if (p.status === "succeeded") {
      const out = Array.isArray(p.output) ? p.output[0] : p.output;
      return out as string;
    }
    if (p.status === "failed" || p.status === "canceled") {
      throw new Error(`Replicate prediction ${p.status}: ${p.error ?? ""}`);
    }
  }
  throw new Error("Replicate timeout after 60s");
}

// ─── Pollinations fallback (miễn phí, không cần key) ─────────────────────────

function pollinationsUrl(prompt: string, seed = 42, w = 768, h = 512): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&seed=${seed}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Sinh ảnh character sheet 2D — full body, white bg, không cần reference
 * Dùng Together FLUX-schnell (nhanh, miễn phí)
 */
export async function generateCharacterSheet(opts: {
  name: string;
  appearancePrompt: string;
  costumePrompt: string;
  ethnicCulture: string;
  gender: string;
  role: string;
}): Promise<string> {
  const { appearancePrompt, costumePrompt, ethnicCulture, gender, role } = opts;

  const prompt = [
    "2D cartoon character design, full body front view, white background",
    appearancePrompt,
    costumePrompt,
    `${ethnicCulture} ethnic minority traditional costume`,
    "children book illustration style, flat design, vibrant colors, clean outlines",
    role === "child"
      ? "child character"
      : role === "elder"
        ? "elderly character"
        : "adult character",
    gender === "female" ? "female character" : "male character",
    "no background scenery, centered standing pose, high quality character sheet",
  ].join(", ");

  const seed =
    Math.abs(opts.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) %
    9999;

  try {
    if (TOGETHER_API_KEY) {
      return await togetherGenerate({ prompt, width: 512, height: 768, seed });
    }
    return pollinationsUrl(prompt, seed, 512, 768);
  } catch (err) {
    console.error("[imageGen] generateCharacterSheet failed:", err);
    return pollinationsUrl(prompt, seed, 512, 768);
  }
}

/**
 * Sinh ảnh background — landscape, không có nhân vật
 * Dùng Together FLUX-schnell
 */
export async function generateBackgroundImage(opts: {
  prompt: string;
  nameEn: string;
  ethnicCulture?: string;
}): Promise<string> {
  const fullPrompt = [
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

  const seed =
    Math.abs(opts.nameEn.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) %
    9999;

  try {
    if (TOGETHER_API_KEY) {
      return await togetherGenerate({
        prompt: fullPrompt,
        width: 896,
        height: 512,
        seed,
      });
    }
    return pollinationsUrl(fullPrompt, seed, 896, 512);
  } catch (err) {
    console.error("[imageGen] generateBackgroundImage failed:", err);
    return pollinationsUrl(fullPrompt, seed, 896, 512);
  }
}

/**
 * Sinh ảnh panel truyện — ghép nhân vật vào bối cảnh
 * Dùng Replicate FLUX-dev với image conditioning nếu nhân vật có characterImageUrl
 * Fallback về Together nếu không có Replicate key
 */
export async function generateComicPanel(opts: {
  background: ComicBackgroundDTO;
  characters: ComicCharacterDTO[];
  action: string;
  ethnicCulture: string;
  panelSeed?: number;
}): Promise<string> {
  const { background, characters, action, ethnicCulture, panelSeed } = opts;

  // Build mô tả nhân vật
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

  // Tìm nhân vật đầu tiên có character sheet để dùng làm image conditioning
  const referenceChar = characters.find(c => c.characterImageUrl);
  const seed = panelSeed ?? 42;

  try {
    if (REPLICATE_API_TOKEN && referenceChar?.characterImageUrl) {
      // Có reference image → dùng FLUX-dev với image conditioning
      return await replicateFluxDev({
        prompt,
        width: 896,
        height: 512,
        imageUrl: referenceChar.characterImageUrl,
        strength: 0.75,
        seed,
      });
    }

    if (REPLICATE_API_TOKEN) {
      // Có Replicate key nhưng không có reference image
      return await replicateFluxDev({ prompt, width: 896, height: 512, seed });
    }

    if (TOGETHER_API_KEY) {
      return await togetherGenerate({ prompt, width: 896, height: 512, seed });
    }

    return pollinationsUrl(prompt, seed, 896, 512);
  } catch (err) {
    console.error("[imageGen] generateComicPanel failed:", err);
    // Fallback chain
    try {
      if (TOGETHER_API_KEY)
        return await togetherGenerate({
          prompt,
          width: 896,
          height: 512,
          seed,
        });
    } catch {
      // ignore
    }
    return pollinationsUrl(prompt, seed, 896, 512);
  }
}

// Re-export for legacy compatibility
export async function generatePanelImage(params: {
  panelPrompt: string;
  width?: number;
  height?: number;
  seed?: number;
}): Promise<string> {
  try {
    if (TOGETHER_API_KEY) {
      return await togetherGenerate({
        prompt: params.panelPrompt,
        width: params.width,
        height: params.height,
        seed: params.seed,
      });
    }
    return pollinationsUrl(
      params.panelPrompt,
      params.seed ?? 42,
      params.width ?? 768,
      params.height ?? 512,
    );
  } catch {
    return pollinationsUrl(
      params.panelPrompt,
      params.seed ?? 42,
      params.width ?? 768,
      params.height ?? 512,
    );
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
