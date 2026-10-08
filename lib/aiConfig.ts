// Cấu hình LLM tại MỘT nơi. Fail-fast với thông báo rõ khi base URL/model/key lệch nhau.
// Không bao giờ đưa giá trị key vào thông báo lỗi.

export interface AIConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
  provider: "together" | "groq" | "other";
}

export function getAIConfig(): AIConfig {
  const baseUrl = (
    process.env.AI_BASE_URL || "https://api.together.xyz/v1"
  ).replace(/\/+$/, "");
  const model =
    process.env.AI_MODEL || "meta-llama/Llama-3.3-70B-Instruct-Turbo";
  const apiKey = process.env.AI_API_KEY || process.env.TOGETHER_API_KEY || "";

  const provider = /together/i.test(baseUrl)
    ? "together"
    : /groq/i.test(baseUrl)
      ? "groq"
      : "other";

  return { baseUrl, model, apiKey, provider };
}

/** Trả về chuỗi lỗi nếu cấu hình sai, hoặc null nếu hợp lệ. */
export function checkAIConfig(cfg: AIConfig = getAIConfig()): string | null {
  const isLocal = /localhost|127\.0\.0\.1/.test(cfg.baseUrl);
  if (!cfg.apiKey && !isLocal)
    return "Thiếu AI_API_KEY (hoặc TOGETHER_API_KEY) trong biến môi trường.";
  if (cfg.provider === "together" && !cfg.model.includes("/"))
    return `AI_BASE_URL là Together nhưng AI_MODEL "${cfg.model}" không đúng định dạng Together (ví dụ meta-llama/Llama-3.3-70B-Instruct-Turbo). Có thể Vercel còn giá trị cũ của Groq — sửa env rồi Redeploy.`;
  if (cfg.provider === "groq" && cfg.model.includes("Turbo"))
    return `AI_BASE_URL là Groq nhưng AI_MODEL "${cfg.model}" là model của Together. Kiểm tra env.`;
  return null;
}

export interface ChatOptions {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
}

/** Gọi chat/completions một lần; chỉ đọc body một lần. */
export async function chat(opts: ChatOptions): Promise<string> {
  const cfg = getAIConfig();
  const problem = checkAIConfig(cfg);
  if (problem) throw new Error(problem);

  const body: Record<string, unknown> = {
    model: cfg.model,
    temperature: opts.temperature ?? 0.6,
    max_tokens: opts.maxTokens ?? 6000,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  };
  if (opts.json) body.response_format = { type: "json_object" };

  const send = () =>
    fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
      },
      body: JSON.stringify(body),
    });

  let res = await send();
  // Một số model/provider không hỗ trợ response_format → thử lại không có
  if (res.status === 400 && opts.json) {
    delete body.response_format;
    res = await send();
  }

  const text = await res.text();
  if (!res.ok) throw new Error(`AI ${res.status}: ${text.slice(0, 200)}`);
  let data: { choices?: { message?: { content?: string } }[] };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("AI trả về phản hồi không phải JSON");
  }
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI không trả về nội dung");
  return content;
}

/** Cắt khối JSON đầu tiên trong chuỗi (bỏ code fence). */
export function extractJson(raw: string): unknown {
  let s = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a !== -1 && b > a) s = s.slice(a, b + 1);
  return JSON.parse(s);
}
