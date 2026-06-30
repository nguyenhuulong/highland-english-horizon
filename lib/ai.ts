import { getCulturalGroup } from "@/data/culture";
import type { AILessonInput, LessonDTO } from "@/types";

// Bất kỳ provider tương thích OpenAI Chat Completions API đều dùng được:
// - Groq (free, rất nhanh):       AI_BASE_URL=https://api.groq.com/openai/v1   AI_MODEL=llama-3.3-70b-versatile
// - Google Gemini (free tier):    AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai  AI_MODEL=gemini-2.0-flash
// - OpenRouter (nhiều model free): AI_BASE_URL=https://openrouter.ai/api/v1   AI_MODEL=meta-llama/llama-3.3-70b-instruct:free
// - Ollama (chạy local, free):    AI_BASE_URL=http://localhost:11434/v1       AI_MODEL=llama3.1 (không cần AI_API_KEY)
// - OpenAI:                       AI_BASE_URL=https://api.openai.com/v1       AI_MODEL=gpt-4o-mini
const AI_BASE_URL = (
  process.env.AI_BASE_URL || "https://api.groq.com/openai/v1"
).replace(/\/+$/, "");
const AI_MODEL = process.env.AI_MODEL || "llama-3.3-70b-versatile";
const AI_API_KEY = process.env.AI_API_KEY || "";

const SYSTEM_PROMPT = `Bạn là trợ lý AI của nền tảng Highland English Horizon, hỗ trợ giáo viên vùng Tây Nguyên tạo bài học tiếng Anh dạng truyện tranh song ngữ cho học sinh dân tộc thiểu số.

QUY TẮC:
- Nội dung phải phù hợp với trẻ em, tích cực, tôn trọng văn hóa các dân tộc thiểu số, không định kiến, không xuyên tạc.
- Chỉ sử dụng dữ liệu văn hóa được cung cấp để xây dựng bối cảnh truyện, không bịa đặt phong tục không có thật.
- Hội thoại tiếng Anh phải đơn giản, đúng ngữ pháp, phù hợp độ tuổi học sinh.
- CHỈ trả về một đối tượng JSON DUY NHẤT, không kèm văn bản giải thích, không dùng markdown code fence.

ĐỊNH DẠNG JSON ĐẦU RA:
{
  "titleVi": string,
  "titleEn": string,
  "descriptionVi": string,
  "vocabulary": [{ "en": string, "vi": string }],
  "panels": [
    {
      "id": number,
      "bg": string (mã màu hex),
      "scene": string (mô tả cảnh ngắn không dấu, dùng snake_case),
      "backgroundKey": string (chọn từ: village, forest, festival, market, harvest, morning_village, cloth_stall, vegetable_stall, bargain, drum, dance, forest_entrance, big_tree, birds, butterfly),
      "characters": [string] (tên nhân vật xuất hiện trong panel, phải dùng tên được cung cấp hoặc tên generic phù hợp),
      "characterAction": string (mô tả ngắn hành động trong panel bằng tiếng Anh, dùng để sinh ảnh, vd: "child is talking to elder near house"),
      "dialogue": [{ "character": string, "vi": string, "en": string }]
    }
  ],
  "quiz": [
    { "question_en": string, "options": [string, string, string, string], "answer": number }
  ],
  "missions": [
    {
      "id": string,
      "type": "select" | "match" | "info",
      "title": string,
      "prompt": string,
      "options": [{ "id": string, "label": string, "emoji": string, "correct": boolean }],
      "fact": string
    }
  ]
}

Yêu cầu thêm:
- Tạo 4-6 panel truyện, mỗi panel có 1-2 lời thoại song ngữ.
- Tạo đúng số từ vựng được giáo viên cung cấp (nếu có), dùng các từ này trong hội thoại.
- Tạo 4 câu hỏi trắc nghiệm đọc hiểu/từ vựng.
- Tạo 1-2 nhiệm vụ khám phá văn hóa (Cultural Missions) liên quan trực tiếp đến chủ đề và dân tộc.`;

async function callAI(userPrompt: string): Promise<string> {
  const isLocal = /localhost|127\.0\.0\.1/.test(AI_BASE_URL);
  if (!AI_API_KEY && !isLocal) {
    throw new Error(
      "Thiếu biến môi trường AI_API_KEY (xem .env.example để chọn provider AI miễn phí).",
    );
  }

  const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(AI_API_KEY ? { Authorization: `Bearer ${AI_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.7,
      max_tokens: 4000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI API lỗi (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string")
    throw new Error("AI không trả về nội dung hợp lệ");
  return content;
}

export async function generateLessonWithAI(
  input: AILessonInput,
): Promise<LessonDTO> {
  const culture = getCulturalGroup(input.ethnicGroup);

  let charactersContext = "";
  try {
    const { prisma: prismaClient } = await import("@/lib/prisma");
    const ethnicSlug = input.ethnicGroup.toLowerCase().replace(/[^a-z]/g, "");
    const ethnicGroup = await prismaClient.ethnicGroup.findUnique({
      where: { slug: ethnicSlug },
    });
    if (ethnicGroup) {
      const chars = await prismaClient.comicCharacter.findMany({
        where: { ethnicGroupId: ethnicGroup.id, isActive: true },
        select: { name: true, nameEn: true, role: true },
      });
      if (chars.length > 0) {
        charactersContext = `\nNhân vật có sẵn (ưu tiên dùng trong trường characters của panel): ${JSON.stringify(chars)}`;
      }
    }
  } catch {
    // not critical
  }

  const userPrompt = `Hãy tạo một bài học tiếng Anh dạng truyện tranh với thông tin sau:

Chủ đề: ${input.topic}
Nhóm dân tộc: ${input.ethnicGroup}
Độ tuổi học sinh: ${input.ageGroup}
Cấp độ: ${input.level}
Mục tiêu bài học: ${input.objective}
Từ vựng mục tiêu: ${input.vocabulary.length ? input.vocabulary.join(", ") : "(AI tự chọn phù hợp chủ đề)"}${charactersContext}

Dữ liệu văn hóa tham khảo (chỉ dùng đúng các thông tin này, không thêm chi tiết khác):
${
  culture
    ? JSON.stringify(
        {
          ten: culture.nameVi,
          le_hoi: culture.festivals,
          trang_phuc: culture.costume,
          nhac_cu: culture.instruments,
          nghe_truyen_thong: culture.crafts,
          am_thuc: culture.cuisine,
          dia_danh: culture.locations,
          kien_truc: culture.architecture,
        },
        null,
        2,
      )
    : "Không có dữ liệu cụ thể, hãy giữ bối cảnh chung chung và an toàn về văn hóa."
}

Trả về đúng định dạng JSON đã quy định.`;

  const raw = await callAI(userPrompt);

  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(json)?/, "")
      .replace(/```$/, "")
      .trim();
  }
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1)
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1);

  let parsed: Omit<
    LessonDTO,
    | "id"
    | "level"
    | "ageGroup"
    | "topic"
    | "color"
    | "emoji"
    | "status"
    | "source"
  >;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Không thể phân tích JSON từ AI. Vui lòng thử lại.");
  }

  return {
    id: "",
    titleVi: parsed.titleVi,
    titleEn: parsed.titleEn,
    topic: input.topic,
    level: input.level,
    ageGroup: input.ageGroup,
    color: culture ? "#E8643A" : "#7B1FA2",
    emoji: culture?.emoji || "📖",
    descriptionVi: parsed.descriptionVi,
    vocabulary: parsed.vocabulary || [],
    panels: parsed.panels || [],
    quiz: parsed.quiz || [],
    missions: parsed.missions || [],
    status: "DRAFT",
    source: "AI",
  };
}
