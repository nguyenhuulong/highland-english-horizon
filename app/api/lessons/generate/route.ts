import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateComicPanel } from "@/lib/imageGen";
import { uploadFromUrl, makeFileName } from "@/lib/storage";
import type { ComicCharacterDTO, ComicBackgroundDTO, CulturalMission } from "@/types";

const AI_BASE_URL = (process.env.AI_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/+$/, "");
const AI_MODEL    = process.env.AI_MODEL    || "llama-3.3-70b-versatile";
const AI_API_KEY  = process.env.AI_API_KEY  || "";

// ─── Cấp độ ───────────────────────────────────────────────────────────────────
const LEVEL_SPEC: Record<number, {
  label: string; dialogueWords: string; vocabCount: string;
  sentenceType: string; example: string; forbidden: string;
}> = {
  1: {
    label: "Starter — Tiểu học (lớp 3–5, 8–10 tuổi)",
    dialogueWords: "4–8 từ/câu",
    vocabCount: "6–8 từ đơn giản: danh từ, động từ cơ bản, màu sắc, số đếm",
    sentenceType: "Simple Present, câu khẳng định/phủ định, câu hỏi Yes/No đơn giản",
    example: "This is a gong. We play it at festivals.",
    forbidden: "KHÔNG dùng câu phức, mệnh đề quan hệ, thì quá khứ hoàn thành, passive voice, từ vựng học thuật",
  },
  2: {
    label: "Basic — THCS (lớp 6–7, 11–13 tuổi)",
    dialogueWords: "8–14 từ/câu",
    vocabCount: "8–10 từ: danh từ, động từ, tính từ, cụm từ văn hóa cơ bản",
    sentenceType: "Present/Past Simple, câu hỏi Wh-, so sánh hơn/nhất đơn giản",
    example: "My grandmother weaves brocade cloth every morning at the longhouse.",
    forbidden: "Tránh mệnh đề quan hệ phức tạp, passive voice nhiều lớp, conditional type 2/3",
  },
  3: {
    label: "Intermediate — THCS nâng cao (lớp 8+, 13–15 tuổi)",
    dialogueWords: "12–20 từ/câu",
    vocabCount: "10–14 từ: cụm từ văn hóa, thành ngữ đơn giản, từ học thuật vừa phải",
    sentenceType: "Đa dạng thì, mệnh đề trạng ngữ, conditional type 1, so sánh phức tạp",
    example: "If you visit during the harvest festival, you will see everyone wearing traditional K'Ho brocade costumes.",
    forbidden: "Không giới hạn cấu trúc nhưng phải tự nhiên, phù hợp văn cảnh câu chuyện",
  },
};

// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES: Record<string, { panelCount: number; guide: string }> = {
  INTRO_4: {
    panelCount: 4,
    guide: `Panel 1: Mở đầu — nhân vật đang làm gì cụ thể, bối cảnh rõ ràng, giới thiệu chủ đề.
Panel 2: Điều thú vị xảy ra — câu hỏi thật sự hoặc sự vật liên quan đến văn hóa.
Panel 3: Khám phá, học hỏi — nhân vật giải thích cụ thể, dùng đúng tên văn hóa từ dữ liệu.
Panel 4: Kết thúc — nhân vật áp dụng điều học được, cảm xúc tích cực.`,
  },
  DIALOGUE_6: {
    panelCount: 6,
    guide: `Panel 1: Hai nhân vật gặp nhau trong tình huống thực tế của đời sống buôn làng.
Panel 2: Hỏi thăm cụ thể — không chỉ chào hỏi xã giao.
Panel 3: Cùng làm một việc thực tế (dệt vải, nấu ăn, làm nương...).
Panel 4: Một nhân vật giải thích điều đặc biệt của văn hóa mình (dùng đúng tên lễ hội/nhạc cụ/món ăn từ dữ liệu).
Panel 5: Tình huống vui hoặc thử thách nhỏ liên quan đến ngôn ngữ/văn hóa.
Panel 6: Kết bạn, lời hẹn có ý nghĩa.`,
  },
  ADVENTURE_6: {
    panelCount: 6,
    guide: `Panel 1: Nhân vật lên đường với mục đích cụ thể, mô tả đồ vật mang theo.
Panel 2: Khám phá địa điểm mới — mô tả chi tiết cảnh vật, cây cối, âm thanh.
Panel 3: Gặp người địa phương, học được điều thực tế về cuộc sống nơi đây.
Panel 4: Khó khăn hoặc điều bất ngờ — liên quan đến ngôn ngữ hoặc phong tục.
Panel 5: Cùng nhau giải quyết bằng kiến thức văn hóa.
Panel 6: Bài học ý nghĩa, ký ức đẹp mang về.`,
  },
  FESTIVAL_8: {
    panelCount: 8,
    guide: `Panel 1: Không khí chuẩn bị lễ hội — công việc cụ thể, đồ vật truyền thống.
Panel 2: Mặc trang phục — giải thích ý nghĩa từng chi tiết trang phục.
Panel 3: Đến nơi lễ hội, gặp gỡ mọi người, mô tả không khí.
Panel 4: Âm nhạc — tên nhạc cụ cụ thể, cách chơi, ý nghĩa.
Panel 5: Ẩm thực — tên món cụ thể, cách làm, ý nghĩa trong lễ hội.
Panel 6: Trò chơi dân gian — mô tả luật chơi, cách tham gia.
Panel 7: Kết bạn với người từ nơi khác, chia sẻ văn hóa bằng tiếng Anh.
Panel 8: Chia sẻ điều đẹp nhất, ý nghĩa lễ hội với cuộc sống hiện tại.`,
  },
};

// ─── LLM helper ────────────────────────────────────────────────────────────────
async function callLLM(system: string, user: string): Promise<string> {
  const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(AI_API_KEY ? { Authorization: `Bearer ${AI_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: AI_MODEL, temperature: 0.72, max_tokens: 9000,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI không trả về nội dung");
  return content;
}

function parseJson(raw: string): unknown {
  let s = raw.trim().replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a !== -1 && b !== -1) s = s.slice(a, b + 1);
  return JSON.parse(s);
}

interface ScriptData {
  titleVi: string; titleEn: string; descriptionVi: string;
  vocabulary: { en: string; vi: string }[];
  quiz: { question_en: string; options: string[]; answer: number }[];
  missions: CulturalMission[];
  panels: {
    id: number; backgroundIndex: number; characterNames: string[];
    action: string;
    dialogue: { characterName: string; en: string; vi: string }[];
  }[];
}

// ─── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Chỉ giáo viên mới tạo được bài học" }, { status: 403 });
    }

    const body = await req.json();
    const { topic, templateKey, ethnicGroupId, characterIds, backgroundIds, titleVi, level } = body as {
      topic: string; templateKey: string; ethnicGroupId?: string;
      characterIds?: string[]; backgroundIds?: string[];
      titleVi?: string; level?: number;
    };

    if (!topic || !templateKey) {
      return NextResponse.json({ error: "Thiếu topic hoặc templateKey" }, { status: 400 });
    }

    const lessonLevel = Math.min(3, Math.max(1, level ?? 2)) as 1 | 2 | 3;
    const levelSpec = LEVEL_SPEC[lessonLevel];
    const tmpl = TEMPLATES[templateKey] || TEMPLATES.INTRO_4;
    const charIds = characterIds ?? [];
    const bgIds = backgroundIds ?? [];

    // Đọc dữ liệu từ DB — KHÔNG dùng data/culture.ts ở runtime
    const [dbChars, dbBgs, ethnicGroup] = await Promise.all([
      prisma.comicCharacter.findMany({ where: { id: { in: charIds } } }),
      prisma.comicBackground.findMany({ where: { id: { in: bgIds } } }),
      ethnicGroupId ? prisma.ethnicGroup.findUnique({ where: { id: ethnicGroupId } }) : null,
    ]);

    const characters: ComicCharacterDTO[] = dbChars.map((c) => ({
      id: c.id, name: c.name, nameEn: c.nameEn,
      role: c.role as "child" | "adult" | "elder",
      gender: c.gender as "male" | "female",
      ethnicGroupId: c.ethnicGroupId, descriptionVi: c.descriptionVi, descriptionEn: c.descriptionEn,
      costumePrompt: c.costumePrompt, appearancePrompt: c.appearancePrompt,
      referenceImageUrl: c.referenceImageUrl, characterImageUrl: c.characterImageUrl,
      thumbnailEmoji: c.thumbnailEmoji, isActive: c.isActive,
    }));

    const backgrounds: ComicBackgroundDTO[] = dbBgs.map((b) => ({
      id: b.id, key: b.key, nameVi: b.nameVi, nameEn: b.nameEn,
      category: b.category as "village" | "forest" | "market" | "festival" | "house" | "school",
      prompt: b.prompt,
      referenceImageUrl: b.referenceImageUrl, imageUrl: b.imageUrl,
      thumbnailEmoji: b.thumbnailEmoji, isActive: b.isActive,
    }));

    const ethnicNameVi = ethnicGroup?.nameVi ?? "K'Ho";
    const ethnicNameEn = ethnicGroup?.nameEn ?? "K'Ho";
    const ethnicEmoji  = ethnicGroup?.emoji  ?? "🌄";

    // ── Dữ liệu văn hóa đầy đủ từ DB ────────────────────────────────────────
    const cultureBlock = ethnicGroup
      ? `DỮ LIỆU VĂN HÓA CHÍNH XÁC — CHỈ ĐƯỢC DÙNG THÔNG TIN NÀY, KHÔNG ĐƯỢC BỊA THÊM:
Dân tộc: ${ethnicGroup.nameVi} (${ethnicGroup.nameEn})
Mô tả: ${ethnicGroup.description}
Lễ hội: ${(ethnicGroup.festivals as string[]).join(" | ")}
Trang phục: ${(ethnicGroup.costume as string[]).join(" | ")}
Nhạc cụ: ${(ethnicGroup.instruments as string[]).join(" | ")}
Nghề thủ công: ${(ethnicGroup.crafts as string[]).join(" | ")}
Ẩm thực truyền thống: ${(ethnicGroup.cuisine as string[]).join(" | ")}
Địa danh: ${(ethnicGroup.locations as string[]).join(" | ")}
Kiến trúc: ${ethnicGroup.architecture}`
      : `Dân tộc thiểu số vùng Tây Nguyên Việt Nam.`;

    const charHint = characters.length
      ? characters.map((c) => `${c.name} (${c.nameEn}): ${c.appearancePrompt}`).join(" | ")
      : "Tự đặt tên nhân vật phù hợp dân tộc";

    const bgHint = backgrounds.length
      ? backgrounds.map((b, i) => `[${i}] ${b.nameVi}`).join(", ")
      : "Tự mô tả bối cảnh phù hợp";

    // ── System prompt ─────────────────────────────────────────────────────────
    const systemPrompt = `Bạn là tác giả truyện tranh giáo dục song ngữ Anh-Việt cho học sinh dân tộc thiểu số tại Tây Nguyên Việt Nam, cấp độ ${lessonLevel}: ${levelSpec.label}.

NGÔN NGỮ — BẮT BUỘC TUYỆT ĐỐI:
- Trường "vi": PHẢI là tiếng Việt thuần túy, TUYỆT ĐỐI KHÔNG có ký tự chữ Hán, chữ Trung Quốc, chữ Nhật hoặc bất kỳ ký tự ngoài bảng chữ cái tiếng Việt
- Trường "en": tiếng Anh đúng ngữ pháp, tự nhiên

CẤP ĐỘ ${lessonLevel} — QUY TẮC LỜI THOẠI:
- Độ dài: ${levelSpec.dialogueWords}
- Từ vựng: ${levelSpec.vocabCount}
- Cấu trúc câu: ${levelSpec.sentenceType}
- Ví dụ câu chuẩn: "${levelSpec.example}"
- ${levelSpec.forbidden}
- Mỗi panel: 2–3 lượt thoại, câu sau phản hồi và mở rộng câu trước

T�NH CHÍNH XÁC VĂN HÓA — BẮT BUỘC:
- Tên lễ hội, nhạc cụ, trang phục, món ăn PHẢI lấy đúng từ DỮ LIỆU VĂN HÓA bên dưới
- KHÔNG được bịa: lễ hội không có trong danh sách, hoa văn "on trees/rocks", nhạc cụ không thuộc dân tộc này
- Dùng tên lễ hội cụ thể (ví dụ: "Lễ mừng lúa mới" / "Rice Harvest Festival"), không gọi chung "gong ceremony"

LỜI THOẠI CẤM DÙNG (bất kể cấp độ):
✗ "Let's go", "Okay", "Me too", "I see", "Yes/No" độc lập — câu dưới 4 từ không có thông tin
✗ Câu không có chủ ngữ hoặc động từ chính
✗ Lời thoại không liên quan đến văn hóa hoặc chủ đề bài học

Chỉ trả về JSON thuần túy, không markdown, không giải thích.`;

    // ── User prompt ────────────────────────────────────────────────────────────
    const userPrompt = `Tạo truyện tranh ${tmpl.panelCount} panel về chủ đề: "${topic}"

${cultureBlock}

Nhân vật: ${charHint}
Bối cảnh có sẵn (chọn theo index): ${bgHint}

Cấu trúc từng panel:
${tmpl.guide}

Trả về JSON:
{
  "titleVi": "Tên truyện tiếng Việt hấp dẫn, cụ thể — phản ánh đúng nội dung",
  "titleEn": "Specific English title",
  "descriptionVi": "1-2 câu: học sinh sẽ đọc về gì và học được gì",
  "vocabulary": [{"en": "từ/cụm từ", "vi": "nghĩa tiếng Việt chuẩn, KHÔNG chữ Hán"}],
  "quiz": [{"question_en": "Câu hỏi kiểm tra hiểu bài cụ thể", "options": ["A","B","C","D"], "answer": 0}],
  "missions": [
    {
      "id": "m1", "type": "select",
      "title": "Tên nhiệm vụ khám phá văn hóa",
      "prompt": "Câu hỏi về phong tục/lễ hội/nhạc cụ cụ thể trong truyện",
      "options": [
        {"id":"a","label":"Đáp án đúng từ dữ liệu văn hóa","emoji":"🎵","correct":true},
        {"id":"b","label":"Đáp án sai hợp lý","emoji":"🌿","correct":false},
        {"id":"c","label":"Đáp án sai hợp lý","emoji":"🏺","correct":false}
      ],
      "fact": "Thông tin thú vị 2-3 câu giải thích đáp án, lấy từ dữ liệu văn hóa"
    }
  ],
  "panels": [
    {
      "id": 1, "backgroundIndex": 0,
      "characterNames": ["tên nhân vật xuất hiện"],
      "action": "Mô tả hành động, vị trí, cảm xúc nhân vật bằng tiếng Anh để gen ảnh AI",
      "dialogue": [
        {"characterName": "tên", "en": "Câu tiếng Anh đúng cấp độ ${lessonLevel}, có thông tin văn hóa cụ thể", "vi": "Bản dịch tiếng Việt thuần túy, KHÔNG chữ Hán"},
        {"characterName": "tên", "en": "Câu phản hồi mở rộng chủ đề", "vi": "Bản dịch tiếng Việt thuần túy"}
      ]
    }
  ]
}

Số lượng: vocabulary ${lessonLevel === 1 ? "6-8" : lessonLevel === 2 ? "8-10" : "10-14"} mục, quiz đúng 4 câu, missions 1-2, panels đúng ${tmpl.panelCount}.`;

    let script: ScriptData;
    try {
      const raw = await callLLM(systemPrompt, userPrompt);
      script = parseJson(raw) as ScriptData;
    } catch (err) {
      return NextResponse.json({ error: `LLM thất bại: ${err}` }, { status: 500 });
    }

    // Tạo lesson DRAFT trước để có ID
    const lesson = await prisma.lesson.create({
      data: {
        titleVi: titleVi || script.titleVi,
        titleEn: script.titleEn, topic,
        descriptionVi: script.descriptionVi || topic,
        emoji: ethnicEmoji, level: lessonLevel,
        vocabulary: JSON.parse(JSON.stringify(script.vocabulary ?? [])),
        panels: [],
        quiz: JSON.parse(JSON.stringify(script.quiz ?? [])),
        missions: JSON.parse(JSON.stringify(script.missions ?? [])),
        status: "DRAFT", source: "COMIC",
        authorId: session.user.id!,
        characterIds: charIds, backgroundIds: bgIds, templateKey,
      },
    });

    // Sinh ảnh từng panel tuần tự
    const SCENE_MAP: Record<string, string> = {
      village: "morning_village", forest: "forest_entrance", market: "market_morning",
      festival: "drum", house: "costume", school: "morning_village",
    };

    const panelData: {
      id: number; bg: string; scene: string; generatedImageUrl?: string;
      dialogue: { character: string; vi: string; en: string }[];
      characterIds: string[]; backgroundId: string; action: string;
    }[] = [];

    for (let i = 0; i < script.panels.length; i++) {
      const ps = script.panels[i];
      const bg = backgrounds[ps.backgroundIndex] ??
        backgrounds[i % Math.max(backgrounds.length, 1)] ?? {
          id: "", key: "village", nameVi: "Làng", nameEn: "Village",
          category: "village" as const, prompt: `${ethnicNameEn} highland village`,
          thumbnailEmoji: "🌄", isActive: true,
        };

      const panelChars = characters.filter((c) =>
        ps.characterNames?.some((n) => n === c.name || n === c.nameEn)
      );
      if (panelChars.length === 0 && characters.length > 0) panelChars.push(characters[0]);

      const dialogue = (ps.dialogue || []).map((d) => ({
        character: d.characterName, vi: d.vi, en: d.en,
      }));

      const panelSeed = (parseInt(lesson.id.replace(/[^0-9]/g, "").slice(0, 6) || "100", 10) + i * 17) % 9999;

      let generatedImageUrl: string | undefined;
      try {
        const rawUrl = await generateComicPanel({
          background: bg, characters: panelChars,
          action: ps.action || `${ethnicNameEn} characters in traditional setting, panel ${i + 1}`,
          ethnicCulture: ethnicNameEn, panelSeed,
        });
        const fileName = makeFileName(`lessons/${lesson.id}/panel-${i + 1}`, "jpg");
        generatedImageUrl = await uploadFromUrl({ sourceUrl: rawUrl, fileName }).catch(() => rawUrl);
      } catch (imgErr) {
        console.error(`[generate] Panel ${i + 1} image failed:`, imgErr);
      }

      const cat = typeof bg.category === "string" ? bg.category : "village";
      const sceneKey = bg.key || SCENE_MAP[cat] || "morning_village";

      panelData.push({
        id: ps.id || i + 1, bg: "#FFF3E0", scene: sceneKey,
        generatedImageUrl, dialogue,
        characterIds: panelChars.map((c) => c.id),
        backgroundId: bg.id, action: ps.action,
      });
    }

    const updated = await prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        titleVi: titleVi || script.titleVi, titleEn: script.titleEn,
        panels: JSON.parse(JSON.stringify(panelData)),
        status: "PUBLISHED",
      },
    });

    await prisma.aIGenerationLog.create({
      data: {
        userId: session.user.id!, lessonId: lesson.id,
        input: { topic, templateKey, level: lessonLevel, characterIds: charIds, backgroundIds: bgIds },
        status: "success",
      },
    }).catch(() => {});

    return NextResponse.json({ lesson: updated });
  } catch (err) {
    console.error("[generate lesson]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Lỗi server" }, { status: 500 });
  }
}
