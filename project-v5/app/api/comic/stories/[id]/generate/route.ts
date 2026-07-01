import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateComicPanel } from "@/lib/imageGen";
import { uploadFromUrl, makeFileName } from "@/lib/storage";
import { getCulturalGroup } from "@/data/culture";
import type {
  ComicCharacterDTO,
  ComicBackgroundDTO,
  ComicStoryPanel,
  CulturalMission,
} from "@/types";

const AI_BASE_URL = (
  process.env.AI_BASE_URL || "https://api.groq.com/openai/v1"
).replace(/\/+$/, "");
const AI_MODEL = process.env.AI_MODEL || "llama-3.3-70b-versatile";
const AI_API_KEY = process.env.AI_API_KEY || "";

// ─── Templates ────────────────────────────────────────────────────────────────
const STORY_TEMPLATES: Record<
  string,
  { panelCount: number; structure: string; levelHint: string }
> = {
  INTRO_4: {
    panelCount: 4,
    levelHint:
      "B1 — học sinh 10-12 tuổi, đã biết Present Simple/Continuous, câu hỏi Wh-",
    structure: `Panel 1 – Bối cảnh & nhân vật: Mô tả sinh động khung cảnh, giới thiệu nhân vật đang làm gì. 2-3 lời thoại chứa thông tin thật (không chỉ chào hỏi).
Panel 2 – Tình huống kích thích tò mò: Xuất hiện vật/sự kiện/câu hỏi liên quan đến văn hóa dân tộc. Nhân vật phản ứng và bắt đầu tìm hiểu.
Panel 3 – Học kiến thức cốt lõi: Nhân vật được giải thích về phong tục/đồ vật/hoạt động. Lời thoại mang thông tin văn hóa cụ thể, chèn từ vựng mục tiêu tự nhiên.
Panel 4 – Áp dụng & kết luận: Nhân vật thực hành điều vừa học, nêu cảm nhận hoặc kế hoạch. Kết thúc mở hoặc có câu hỏi gợi suy nghĩ.`,
  },
  DIALOGUE_6: {
    panelCount: 6,
    levelHint:
      "B1-B2 — học sinh 11-13 tuổi, dùng được Past Simple, Modal verbs, câu phức",
    structure: `Panel 1 – Gặp gỡ có tình tiết: Hai nhân vật gặp nhau trong hoàn cảnh thú vị, không chỉ "Hello". Giới thiệu bối cảnh văn hóa ngay từ đầu.
Panel 2 – Khám phá sự khác biệt: Nhân vật chia sẻ thông tin về gia đình/làng/nghề theo cách so sánh. Học từ vựng qua thực tế.
Panel 3 – Tham gia hoạt động cùng nhau: Cùng làm một việc cụ thể của địa phương. Mô tả hành động chi tiết qua lời thoại.
Panel 4 – Giải thích phong tục: Một nhân vật giải thích ý nghĩa của một phong tục/lễ hội/đồ vật truyền thống. Thông tin cụ thể, không chung chung.
Panel 5 – Thử thách nhỏ hoặc hiểu lầm vui: Xảy ra tình huống cần giải quyết bằng ngôn ngữ hoặc kiến thức văn hóa.
Panel 6 – Kết nối sâu hơn: Hai nhân vật rút ra bài học, lên kế hoạch gặp lại, hoặc chia sẻ điều quan trọng nhất học được.`,
  },
  ADVENTURE_6: {
    panelCount: 6,
    levelHint:
      "B1-B2 — học sinh 11-13 tuổi, tường thuật sự kiện, mô tả địa điểm, biểu đạt cảm xúc",
    structure: `Panel 1 – Khởi hành với mục tiêu: Nhân vật đang đi đâu và tại sao. Mô tả đồ dùng/chuẩn bị cụ thể.
Panel 2 – Khám phá địa điểm đặc trưng: Mô tả chi tiết cảnh vật, cây cối, nhà cửa, âm thanh, mùi vị của địa điểm.
Panel 3 – Gặp người dân địa phương: Tìm hiểu về cuộc sống nơi đây qua cuộc trò chuyện thật.
Panel 4 – Thử thách thực tế: Nhân vật gặp khó khăn cụ thể (ngôn ngữ, địa hình, phong tục không biết).
Panel 5 – Hợp tác giải quyết: Kết hợp kiến thức của mình và người dân địa phương để vượt qua.
Panel 6 – Bài học & di sản: Nhân vật chia sẻ điều quan trọng nhất học được, về nhà mang theo kỷ niệm văn hóa.`,
  },
  FESTIVAL_8: {
    panelCount: 8,
    levelHint:
      "B1-B2 — học sinh 10-13 tuổi, mô tả sự kiện, giải thích truyền thống, biểu đạt cảm xúc phong phú",
    structure: `Panel 1 – Chuẩn bị sôi động: Gia đình chuẩn bị đón lễ hội — chi tiết cụ thể về từng công việc chuẩn bị.
Panel 2 – Trang phục truyền thống: Mặc và giải thích ý nghĩa từng chi tiết của bộ trang phục. Từ vựng về màu sắc, hoa văn, chất liệu.
Panel 3 – Hành trình đến lễ hội: Mô tả không khí trên đường đi, gặp hàng xóm, người thân, bạn bè.
Panel 4 – Âm nhạc và nhảy múa: Tên cụ thể của nhạc cụ, điệu múa. Mô tả cách chơi, cách múa, ý nghĩa.
Panel 5 – Ẩm thực đặc trưng: Các món ăn truyền thống với tên gọi, cách làm, ý nghĩa trong lễ hội.
Panel 6 – Trò chơi dân gian: Mô tả luật chơi của một trò chơi truyền thống, cách tham gia.
Panel 7 – Kết bạn qua văn hóa: Gặp người từ vùng khác, chia sẻ và so sánh lễ hội của nhau bằng tiếng Anh.
Panel 8 – Kết thúc ý nghĩa: Chia sẻ điều đáng nhớ nhất, ý nghĩa của lễ hội với cộng đồng và cuộc sống hiện đại.`,
  },
};

// ─── LLM helpers ──────────────────────────────────────────────────────────────
async function callLLM(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const isLocal = /localhost|127\.0\.0\.1/.test(AI_BASE_URL);
  if (!AI_API_KEY && !isLocal) throw new Error("Thiếu AI_API_KEY");

  const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(AI_API_KEY ? { Authorization: `Bearer ${AI_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.72,
      max_tokens: 7000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`AI API ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI không trả về nội dung");
  return content;
}

function extractJson(raw: string): unknown {
  let s = raw.trim();
  if (s.startsWith("```"))
    s = s
      .replace(/^```(?:json)?\s*/, "")
      .replace(/\s*```$/, "")
      .trim();
  const a = s.indexOf("{"),
    b = s.lastIndexOf("}");
  if (a !== -1 && b !== -1) s = s.slice(a, b + 1);
  return JSON.parse(s);
}

// ─── Types for LLM output ─────────────────────────────────────────────────────
interface ScriptPanel {
  id: number;
  backgroundIndex: number;
  characterNames: string[];
  action: string;
  narration?: string;
  dialogue: { characterName: string; en: string; vi: string }[];
}

interface ScriptData {
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  vocabulary: { en: string; vi: string; example_en: string }[];
  quiz: {
    question_en: string;
    options: string[];
    answer: number;
    explanation?: string;
  }[];
  missions: CulturalMission[];
  panels: ScriptPanel[];
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const session = await auth();
    if (
      !session?.user ||
      !["TEACHER", "ADMIN"].includes(session.user.role ?? "")
    ) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const story = await prisma.comicStory.findUnique({
      where: { id },
      include: { ethnicGroup: true },
    });
    if (!story)
      return NextResponse.json(
        { error: "Không tìm thấy truyện" },
        { status: 404 },
      );

    if (session.user.role !== "ADMIN" && story.authorId !== session.user.id) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    await prisma.comicStory.update({
      where: { id },
      data: { status: "generating" },
    });

    // ── Fetch characters & backgrounds ────────────────────────────────────────
    const charIds = story.characterIds as string[];
    const bgIds = story.backgroundIds as string[];

    const [dbChars, dbBgs] = await Promise.all([
      prisma.comicCharacter.findMany({ where: { id: { in: charIds } } }),
      prisma.comicBackground.findMany({ where: { id: { in: bgIds } } }),
    ]);

    const characters: ComicCharacterDTO[] = dbChars.map(c => ({
      id: c.id,
      name: c.name,
      nameEn: c.nameEn,
      role: c.role as "child" | "adult" | "elder",
      gender: c.gender as "male" | "female",
      ethnicGroupId: c.ethnicGroupId,
      descriptionVi: c.descriptionVi,
      descriptionEn: c.descriptionEn,
      costumePrompt: c.costumePrompt,
      appearancePrompt: c.appearancePrompt,
      referenceImageUrl: c.referenceImageUrl,
      characterImageUrl: c.characterImageUrl,
      thumbnailEmoji: c.thumbnailEmoji,
      isActive: c.isActive,
    }));

    const backgrounds: ComicBackgroundDTO[] = dbBgs.map(b => ({
      id: b.id,
      key: b.key,
      nameVi: b.nameVi,
      nameEn: b.nameEn,
      category: b.category as
        | "village"
        | "forest"
        | "market"
        | "festival"
        | "house"
        | "school",
      ethnicGroupId: b.ethnicGroupId,
      prompt: b.prompt,
      referenceImageUrl: b.referenceImageUrl,
      imageUrl: b.imageUrl,
      thumbnailEmoji: b.thumbnailEmoji,
      isActive: b.isActive,
    }));

    // ── Cultural context ──────────────────────────────────────────────────────
    const ethnicNameVi = story.ethnicGroup?.nameVi || "K'Ho";
    const ethnicNameEn = story.ethnicGroup?.nameEn || "K'Ho";
    const ethnicEmoji = story.ethnicGroup?.emoji || "🌄";
    const culture = story.ethnicGroup ? getCulturalGroup(ethnicNameVi) : null;
    const template =
      STORY_TEMPLATES[story.templateKey] || STORY_TEMPLATES.DIALOGUE_6;

    const cultureBlock = culture
      ? `DỮ LIỆU VĂN HÓA ${ethnicNameVi.toUpperCase()} (chỉ được dùng các thông tin này, không được bịa thêm):
- Lễ hội: ${(culture.festivals as string[]).join(", ")}
- Trang phục: ${(culture.costume as string[]).join(", ")}
- Nhạc cụ: ${(culture.instruments as string[]).join(", ")}
- Nghề thủ công: ${(culture.crafts as string[]).join(", ")}
- Ẩm thực: ${(culture.cuisine as string[]).join(", ")}
- Địa danh: ${(culture.locations as string[]).join(", ")}
- Kiến trúc: ${culture.architecture}`
      : `Dân tộc thiểu số vùng Tây Nguyên Việt Nam.`;

    const charBlock = characters.length
      ? characters
          .map(
            c =>
              `- ${c.name} (EN: ${c.nameEn}): ${c.descriptionEn}. Trang phục: ${c.costumePrompt}`,
          )
          .join("\n")
      : "Không có nhân vật cụ thể — tự tạo tên và mô tả phù hợp với dân tộc";

    const bgBlock = backgrounds.length
      ? backgrounds
          .map(
            (b, i) =>
              `[${i}] ${b.nameVi} (${b.nameEn}): ${b.prompt.slice(0, 120)}`,
          )
          .join("\n")
      : "Không có bối cảnh cụ thể — tự mô tả phù hợp chủ đề";

    // ── Build prompts ─────────────────────────────────────────────────────────
    const systemPrompt = `Bạn là chuyên gia thiết kế bài học tiếng Anh tích hợp văn hóa dân tộc thiểu số Việt Nam, viết truyện tranh song ngữ chất lượng cao cho học sinh cấp 2 vùng Tây Nguyên.

TIÊU CHUẨN CHẤT LƯỢNG BẮT BUỘC:
1. Lời thoại tiếng Anh: ${template.levelHint}
2. Mỗi panel phải có 2-4 lượt thoại. TUYỆT ĐỐI KHÔNG dùng chỉ "Hello", "Hi", "Great!" hay câu cảm thán đơn — mỗi lượt thoại phải truyền đạt thông tin thực chất.
3. Hội thoại phải thể hiện: hỏi có nội dung cụ thể → trả lời có giải thích → phản hồi có chiều sâu.
4. Từ vựng phải xuất hiện tự nhiên trong hội thoại, không gượng ép.
5. Nhiệm vụ văn hóa (missions) phải yêu cầu học sinh SUY NGHĨ và LIÊN KẾT với nội dung truyện, không chỉ ghi nhớ máy móc.
6. Quiz phải kiểm tra HIỂU BIẾT, không chỉ đọc lại câu trong truyện.

CHỈ trả về JSON thuần túy. Không markdown, không giải thích.`;

    const userPrompt = `Tạo bài học truyện tranh ${template.panelCount} panel.

CHỦ ĐỀ (mô tả của giáo viên): "${story.topic}"
DÂN TỘC: ${ethnicNameVi}

${cultureBlock}

NHÂN VẬT:
${charBlock}

BỐI CẢNH có sẵn (chọn theo index, hoặc dùng fallback nếu không có):
${bgBlock}

CẤU TRÚC TỪNG PANEL:
${template.structure}

TRẢ VỀ JSON theo định dạng này, không sai field nào:
{
  "titleVi": "Tên bài học hay, cụ thể, không generic",
  "titleEn": "Engaging English title",
  "descriptionVi": "Tóm tắt 2-3 câu: học sinh sẽ đọc về gì và học được gì",
  "vocabulary": [
    {
      "en": "từ/cụm từ tiếng Anh",
      "vi": "nghĩa tiếng Việt",
      "example_en": "Câu ví dụ hoàn chỉnh dùng từ này, lấy thẳng hoặc gần với hội thoại trong truyện"
    }
  ],
  "quiz": [
    {
      "question_en": "Câu hỏi đòi hỏi hiểu nội dung, không chỉ nhớ từ",
      "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      "answer": 0,
      "explanation": "Giải thích tại sao đáp án này đúng, liên kết với nội dung truyện"
    }
  ],
  "missions": [
    {
      "id": "m1",
      "type": "select",
      "title": "Tiêu đề nhiệm vụ khám phá văn hóa",
      "prompt": "Câu hỏi/yêu cầu cụ thể dựa trên thông tin trong truyện",
      "options": [
        {"id": "a", "label": "Lựa chọn A", "emoji": "🎵", "correct": true},
        {"id": "b", "label": "Lựa chọn B", "emoji": "🌿", "correct": false},
        {"id": "c", "label": "Lựa chọn C", "emoji": "🏺", "correct": false}
      ],
      "fact": "Thông tin thú vị 2-3 câu giải thích đáp án và mở rộng kiến thức văn hóa"
    }
  ],
  "panels": [
    {
      "id": 1,
      "backgroundIndex": 0,
      "characterNames": ["Tên nhân vật xuất hiện trong panel này"],
      "action": "Mô tả hành động, vị trí, biểu cảm của nhân vật bằng tiếng Anh cho image generation",
      "narration": "Câu dẫn truyện ngắn bằng tiếng Việt mô tả bối cảnh panel (tùy chọn)",
      "dialogue": [
        {"characterName": "Tên nhân vật", "en": "Câu thoại tiếng Anh đủ ý nghĩa, ít nhất 6 từ", "vi": "Bản dịch tiếng Việt tự nhiên"},
        {"characterName": "Tên khác hoặc cùng nhân vật", "en": "Phản hồi có nội dung, không chỉ 'Yes' hay 'Okay'", "vi": "Bản dịch"},
        {"characterName": "Tên", "en": "Câu tiếp theo hoặc giải thích thêm", "vi": "Bản dịch"}
      ]
    }
  ]
}

Số lượng yêu cầu:
- vocabulary: 8-12 mục
- quiz: đúng 4 câu
- missions: 1-2 nhiệm vụ
- panels: đúng ${template.panelCount} panel, mỗi panel có 2-4 lượt thoại`;

    // ── Call LLM ───────────────────────────────────────────────────────────────
    let scriptData: ScriptData;
    try {
      const raw = await callLLM(systemPrompt, userPrompt);
      scriptData = extractJson(raw) as ScriptData;
    } catch (err) {
      await prisma.comicStory.update({
        where: { id },
        data: { status: "draft" },
      });
      return NextResponse.json(
        { error: `LLM thất bại: ${err}` },
        { status: 500 },
      );
    }

    // ── Generate panel images + assemble ──────────────────────────────────────
    const SCENE_FALLBACK: Record<string, string> = {
      village: "morning_village",
      forest: "forest_entrance",
      market: "market_morning",
      festival: "drum",
      house: "costume",
      school: "morning_village",
    };

    const panels: ComicStoryPanel[] = [];

    for (let idx = 0; idx < scriptData.panels.length; idx++) {
      const ps = scriptData.panels[idx];

      const bg = backgrounds[ps.backgroundIndex] ??
        backgrounds[idx % Math.max(backgrounds.length, 1)] ?? {
          id: "",
          key: "village",
          nameVi: "Làng",
          nameEn: "Village",
          category: "village" as const,
          prompt: `${ethnicNameEn} K'Ho highland village, traditional longhouse`,
          thumbnailEmoji: "🌄",
          isActive: true,
        };

      const panelChars = characters.filter(c =>
        ps.characterNames?.some(n => n === c.name || n === c.nameEn),
      );
      if (panelChars.length === 0 && characters.length > 0)
        panelChars.push(characters[0]);

      const dialogue = (ps.dialogue || []).map(d => ({
        characterId:
          characters.find(
            c => c.name === d.characterName || c.nameEn === d.characterName,
          )?.id || "",
        characterName: d.characterName,
        en: d.en,
        vi: d.vi,
      }));

      let generatedImageUrl: string | undefined;
      try {
        const rawUrl = await generateComicPanel({
          background: bg,
          characters: panelChars,
          action:
            ps.action || `${ethnicNameEn} characters in traditional setting`,
          ethnicCulture: ethnicNameEn,
          panelSeed: parseInt(id.slice(-4), 16) + idx,
        });
        const fileName = makeFileName(`stories/${id}/panel-${idx + 1}`, "jpg");
        generatedImageUrl = await uploadFromUrl({
          sourceUrl: rawUrl,
          fileName,
        }).catch(() => rawUrl);
      } catch (imgErr) {
        console.error(`[generate] Panel ${idx + 1} image failed:`, imgErr);
      }

      const sceneKey =
        bg.key || SCENE_FALLBACK[bg.category] || "morning_village";

      panels.push({
        id: ps.id || idx + 1,
        backgroundId: bg.id,
        backgroundImageUrl: bg.imageUrl ?? undefined,
        generatedImageUrl,
        action: ps.action,
        characterIds: panelChars.map(c => c.id),
        dialogue,
      });
    }

    // ── Persist ───────────────────────────────────────────────────────────────
    const panelsJson = JSON.parse(JSON.stringify(panels));
    const vocabJson = JSON.parse(JSON.stringify(scriptData.vocabulary ?? []));
    const quizJson = JSON.parse(JSON.stringify(scriptData.quiz ?? []));
    const missionsJson = JSON.parse(JSON.stringify(scriptData.missions ?? []));

    // Lesson panels — map to the Panel shape the reader expects
    const SCENE_BY_CAT: Record<string, string> = {
      village: "morning_village",
      forest: "forest_entrance",
      market: "market_morning",
      festival: "drum",
      house: "costume",
      school: "morning_village",
    };

    const bgCatMap = new Map(dbBgs.map(b => [b.id, b.category]));

    const lessonPanels = panels.map(p => {
      const rawCat = bgCatMap.get(p.backgroundId);
      const cat = (typeof rawCat === "string" ? rawCat : null) || "village";
      return {
        id: p.id,
        bg: "#FFF3E0",
        scene:
          dbBgs.find(b => b.id === p.backgroundId)?.key ||
          SCENE_BY_CAT[cat] ||
          "morning_village",
        generatedImageUrl: p.generatedImageUrl,
        dialogue: p.dialogue.map(d => ({
          character: d.characterName,
          vi: d.vi,
          en: d.en,
        })),
        backgroundId: p.backgroundId,
        backgroundImageUrl: p.backgroundImageUrl,
        action: p.action,
        characterIds: p.characterIds,
      };
    });

    const finalTitle = scriptData.titleVi || story.title;
    const finalTitleEn = scriptData.titleEn || story.titleEn;
    const finalDesc = scriptData.descriptionVi || story.topic;

    // Upsert Lesson
    let lesson;
    if (story.lessonId) {
      lesson = await prisma.lesson.update({
        where: { id: story.lessonId },
        data: {
          titleVi: finalTitle,
          titleEn: finalTitleEn,
          topic: story.topic,
          descriptionVi: finalDesc,
          emoji: ethnicEmoji,
          vocabulary: vocabJson,
          panels: JSON.parse(JSON.stringify(lessonPanels)),
          quiz: quizJson,
          missions: missionsJson,
          status: "PUBLISHED",
          ethnicGroupId: story.ethnicGroupId,
          characterIds: charIds,
          backgroundIds: bgIds,
          templateKey: story.templateKey,
        },
      });
    } else {
      lesson = await prisma.lesson.create({
        data: {
          titleVi: finalTitle,
          titleEn: finalTitleEn,
          topic: story.topic,
          descriptionVi: finalDesc,
          emoji: ethnicEmoji,
          vocabulary: vocabJson,
          panels: JSON.parse(JSON.stringify(lessonPanels)),
          quiz: quizJson,
          missions: missionsJson,
          status: "PUBLISHED",
          source: "COMIC",
          authorId: story.authorId,
          ethnicGroupId: story.ethnicGroupId,
          characterIds: charIds,
          backgroundIds: bgIds,
          templateKey: story.templateKey,
        },
      });
    }

    const updatedStory = await prisma.comicStory.update({
      where: { id },
      data: {
        title: finalTitle,
        titleEn: finalTitleEn,
        panels: panelsJson,
        vocabulary: vocabJson,
        quiz: quizJson,
        missions: missionsJson,
        status: "published",
        lessonId: lesson.id,
      },
    });

    return NextResponse.json({ story: updatedStory, lessonId: lesson.id });
  } catch (err) {
    console.error("[generate story]", err);
    await prisma.comicStory
      .update({ where: { id }, data: { status: "draft" } })
      .catch(() => {});
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi sinh truyện" },
      { status: 500 },
    );
  }
}
