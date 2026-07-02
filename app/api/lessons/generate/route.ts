import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateComicPanel } from "@/lib/imageGen";
import { uploadFromUrl, makeFileName } from "@/lib/storage";
import { getCulturalGroup } from "@/data/culture";
import type {
  ComicCharacterDTO,
  ComicBackgroundDTO,
  CulturalMission,
} from "@/types";

const AI_BASE_URL = (
  process.env.AI_BASE_URL || "https://api.groq.com/openai/v1"
).replace(/\/+$/, "");
const AI_MODEL = process.env.AI_MODEL || "llama-3.3-70b-versatile";
const AI_API_KEY = process.env.AI_API_KEY || "";

const TEMPLATES: Record<string, { panelCount: number; guide: string }> = {
  INTRO_4: {
    panelCount: 4,
    guide: `Panel 1: Mở đầu — nhân vật đang làm gì đó cụ thể, bối cảnh rõ ràng.
Panel 2: Điều thú vị xảy ra — câu hỏi hoặc sự vật liên quan đến chủ đề.
Panel 3: Khám phá, học hỏi — nhân vật tìm hiểu, giải thích ngắn gọn.
Panel 4: Kết thúc vui — nhân vật áp dụng điều học được.`,
  },
  DIALOGUE_6: {
    panelCount: 6,
    guide: `Panel 1: Hai nhân vật gặp nhau trong tình huống thực tế.
Panel 2: Hỏi thăm, làm quen.
Panel 3: Cùng làm một việc, chia sẻ.
Panel 4: Một nhân vật giải thích điều đặc biệt của văn hóa mình.
Panel 5: Tình huống vui hoặc thử thách nhỏ.
Panel 6: Kết bạn, lời hẹn.`,
  },
  ADVENTURE_6: {
    panelCount: 6,
    guide: `Panel 1: Nhân vật lên đường, chuẩn bị.
Panel 2: Khám phá địa điểm mới, mô tả cảnh vật.
Panel 3: Gặp người địa phương, tò mò hỏi han.
Panel 4: Khó khăn hoặc điều bất ngờ.
Panel 5: Cùng nhau giải quyết.
Panel 6: Bài học, ký ức đẹp mang về.`,
  },
  FESTIVAL_8: {
    panelCount: 8,
    guide: `Panel 1: Không khí chuẩn bị lễ hội.
Panel 2: Mặc trang phục, giải thích ý nghĩa.
Panel 3: Đến nơi lễ hội, gặp gỡ mọi người.
Panel 4: Âm nhạc, nhảy múa.
Panel 5: Thưởng thức ẩm thực truyền thống.
Panel 6: Trò chơi dân gian.
Panel 7: Kết bạn với người từ nơi khác.
Panel 8: Chia sẻ điều đẹp nhất của lễ hội.`,
  },
};

async function callLLM(system: string, user: string): Promise<string> {
  const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(AI_API_KEY ? { Authorization: `Bearer ${AI_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.75,
      max_tokens: 8000,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok)
    throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI không trả về nội dung");
  return content;
}

function parseJson(raw: string): unknown {
  let s = raw
    .trim()
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();
  const a = s.indexOf("{"),
    b = s.lastIndexOf("}");
  if (a !== -1 && b !== -1) s = s.slice(a, b + 1);
  return JSON.parse(s);
}

interface ScriptData {
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  vocabulary: { en: string; vi: string }[];
  quiz: { question_en: string; options: string[]; answer: number }[];
  missions: CulturalMission[];
  panels: {
    id: number;
    backgroundIndex: number;
    characterNames: string[];
    action: string;
    dialogue: { characterName: string; en: string; vi: string }[];
  }[];
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Chỉ giáo viên mới tạo được bài học" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const {
      topic,
      templateKey,
      ethnicGroupId,
      characterIds,
      backgroundIds,
      titleVi,
    } = body as {
      topic: string;
      templateKey: string;
      ethnicGroupId?: string;
      characterIds?: string[];
      backgroundIds?: string[];
      titleVi?: string;
    };

    if (!topic || !templateKey) {
      return NextResponse.json(
        { error: "Thiếu topic hoặc templateKey" },
        { status: 400 },
      );
    }

    const tmpl = TEMPLATES[templateKey] || TEMPLATES.INTRO_4;
    const charIds = characterIds ?? [];
    const bgIds = backgroundIds ?? [];

    const [dbChars, dbBgs, ethnicGroup] = await Promise.all([
      prisma.comicCharacter.findMany({ where: { id: { in: charIds } } }),
      prisma.comicBackground.findMany({ where: { id: { in: bgIds } } }),
      ethnicGroupId
        ? prisma.ethnicGroup.findUnique({ where: { id: ethnicGroupId } })
        : null,
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

    const ethnicNameVi = ethnicGroup?.nameVi ?? "K'Ho";
    const ethnicNameEn = ethnicGroup?.nameEn ?? "K'Ho";
    const ethnicEmoji = ethnicGroup?.emoji ?? "🌄";
    const culture = ethnicGroup ? getCulturalGroup(ethnicNameVi) : null;

    // Cultural context
    const cultureHint = culture
      ? `Văn hóa ${ethnicNameVi}: lễ hội (${(culture.festivals as string[]).slice(0, 3).join(", ")}), trang phục (${(culture.costume as string[]).slice(0, 2).join(", ")}), ẩm thực (${(culture.cuisine as string[]).slice(0, 3).join(", ")}), nhạc cụ (${(culture.instruments as string[]).slice(0, 2).join(", ")}).`
      : "";

    const charHint = characters.length
      ? characters
          .map(c => `${c.name}: ${c.descriptionEn}, ${c.costumePrompt}`)
          .join(" | ")
      : "Tự đặt tên nhân vật phù hợp";

    const bgHint = backgrounds.length
      ? backgrounds.map((b, i) => `[${i}] ${b.nameVi}`).join(", ")
      : "Tự mô tả bối cảnh";

    // Prompt ngắn gọn, tự nhiên như truyện tranh thiếu nhi thực sự
    const systemPrompt = `Bạn là tác giả truyện tranh giáo dục song ngữ Anh-Việt cho học sinh dân tộc thiểu số 9-12 tuổi tại Tây Nguyên Việt Nam.

TIÊU CHUẨN BẮT BUỘC cho mỗi lượt thoại tiếng Anh:
- Độ dài: 6-15 từ, KHÔNG được ngắn hơn 6 từ
- Phải chứa ít nhất 1 từ vựng mục tiêu hoặc thông tin văn hóa cụ thể
- Câu hoàn chỉnh, có chủ ngữ và vị ngữ rõ ràng
- TUYỆT ĐỐI KHÔNG dùng: "Let's go", "Okay", "Me too", "I love you", "Yes", "No", "Really?" hay bất kỳ câu dưới 6 từ
- Mỗi panel 2-3 lượt thoại, câu sau phản hồi và mở rộng câu trước

Mục tiêu: Học sinh đọc xong phải học được ít nhất 8 từ/cụm từ tiếng Anh mới liên quan đến văn hóa dân tộc.
Phong cách: Tự nhiên, sinh động — nhưng mỗi câu phải có nội dung thực chất, không câu chào hỏi xã giao rỗng tuếch.

Chỉ trả về JSON thuần túy, không markdown, không giải thích.`;

    const userPrompt = `Tạo truyện tranh ${tmpl.panelCount} panel về chủ đề: "${topic}"

Dân tộc: ${ethnicNameVi}
${cultureHint}

Nhân vật có trong truyện: ${charHint}
Bối cảnh có sẵn (chọn theo index): ${bgHint}

Cấu trúc từng panel:
${tmpl.guide}

Ví dụ hội thoại ĐẠT CHUẨN:
✓ "Mom, look at this beautiful indigo fabric with traditional deer patterns!" (có từ vựng: indigo, fabric, deer patterns)
✓ "This brocade cloth takes three months to weave by hand." (có từ vựng: brocade, weave)
✓ "How much does one kilogram of bamboo shoots cost today?" (có từ vựng: kilogram, bamboo shoots)
✓ "The gong ceremony is held every year after the harvest season." (có từ vựng: gong ceremony, harvest season)

Ví dụ hội thoại CẤM DÙNG:
✗ "Let's go" — quá ngắn, không có nội dung
✗ "I love this" — không có từ vựng
✗ "Okay dear" — vô nghĩa về giáo dục
✗ "Me too" — không đạt chuẩn 6 từ

Trả về JSON:
{
  "titleVi": "Tên truyện tiếng Việt hấp dẫn, cụ thể",
  "titleEn": "Specific engaging English title",
  "descriptionVi": "1-2 câu mô tả nội dung và điều học sinh học được",
  "vocabulary": [{"en": "từ hoặc cụm từ", "vi": "nghĩa tiếng Việt"}],
  "quiz": [{"question_en": "Câu hỏi kiểm tra hiểu biết về nội dung truyện", "options": ["A","B","C","D"], "answer": 0}],
  "missions": [{"id":"m1","type":"select","title":"Tiêu đề nhiệm vụ","prompt":"Câu hỏi về phong tục văn hóa trong truyện","options":[{"id":"a","label":"Đáp án đúng","emoji":"🎵","correct":true},{"id":"b","label":"Đáp án sai","emoji":"🌿","correct":false},{"id":"c","label":"Đáp án sai","emoji":"🏺","correct":false}],"fact":"Thông tin văn hóa thú vị 2-3 câu giải thích đáp án"}],
  "panels": [
    {
      "id": 1,
      "backgroundIndex": 0,
      "characterNames": ["tên nhân vật xuất hiện trong panel này"],
      "action": "Mô tả chi tiết hành động, vị trí, cảm xúc của nhân vật bằng tiếng Anh để gen ảnh AI",
      "dialogue": [
        {"characterName": "tên", "en": "Complete sentence with 6-15 words containing cultural vocabulary", "vi": "Bản dịch tự nhiên tiếng Việt"},
        {"characterName": "tên khác", "en": "Meaningful response that continues and expands the topic", "vi": "Bản dịch tự nhiên"},
        {"characterName": "tên", "en": "Follow-up with more specific cultural information or question", "vi": "Bản dịch tự nhiên"}
      ]
    }
  ]
}

Yêu cầu số lượng: vocabulary 8-12 mục, quiz đúng 4 câu, missions 1-2, panels đúng ${tmpl.panelCount} panel.`;
    let script: ScriptData;
    try {
      const raw = await callLLM(systemPrompt, userPrompt);
      script = parseJson(raw) as ScriptData;
    } catch (err) {
      return NextResponse.json(
        { error: `LLM thất bại: ${err}` },
        { status: 500 },
      );
    }

    // Tạo lesson trước để có ID
    const lesson = await prisma.lesson.create({
      data: {
        titleVi: titleVi || script.titleVi,
        titleEn: script.titleEn,
        topic,
        descriptionVi: script.descriptionVi || topic,
        emoji: ethnicEmoji,
        vocabulary: JSON.parse(JSON.stringify(script.vocabulary ?? [])),
        panels: [],
        quiz: JSON.parse(JSON.stringify(script.quiz ?? [])),
        missions: JSON.parse(JSON.stringify(script.missions ?? [])),
        status: "DRAFT",
        source: "COMIC",
        authorId: session.user.id!,
        ethnicGroupId: ethnicGroupId || null,
        characterIds: charIds,
        backgroundIds: bgIds,
        templateKey,
      },
    });

    // Generate ảnh từng panel tuần tự
    const SCENE_MAP: Record<string, string> = {
      village: "morning_village",
      forest: "forest_entrance",
      market: "market_morning",
      festival: "drum",
      house: "costume",
      school: "morning_village",
    };

    const panelData: {
      id: number;
      bg: string;
      scene: string;
      generatedImageUrl?: string;
      dialogue: { character: string; vi: string; en: string }[];
      characterIds: string[];
      backgroundId: string;
      action: string;
    }[] = [];

    for (let i = 0; i < script.panels.length; i++) {
      const ps = script.panels[i];
      const bg = backgrounds[ps.backgroundIndex] ??
        backgrounds[i % Math.max(backgrounds.length, 1)] ?? {
          id: "",
          key: "village",
          nameVi: "Làng",
          nameEn: "Village",
          category: "village" as const,
          prompt: `${ethnicNameEn} highland village`,
          thumbnailEmoji: "🌄",
          isActive: true,
        };

      const panelChars = characters.filter(c =>
        ps.characterNames?.some(n => n === c.name || n === c.nameEn),
      );
      if (panelChars.length === 0 && characters.length > 0)
        panelChars.push(characters[0]);

      const dialogue = (ps.dialogue || []).map(d => ({
        character: d.characterName,
        vi: d.vi,
        en: d.en,
      }));

      // Seed nhất quán: dùng lesson.id + panel index để mọi lần gen cùng panel có kết quả tương tự
      const panelSeed =
        (parseInt(lesson.id.replace(/[^0-9]/g, "").slice(0, 6) || "100", 10) +
          i * 17) %
        9999;

      let generatedImageUrl: string | undefined;
      try {
        const rawUrl = await generateComicPanel({
          background: bg,
          characters: panelChars,
          action:
            ps.action ||
            `${ethnicNameEn} characters in traditional setting, panel ${i + 1}`,
          ethnicCulture: ethnicNameEn,
          panelSeed,
        });
        const fileName = makeFileName(
          `lessons/${lesson.id}/panel-${i + 1}`,
          "jpg",
        );
        generatedImageUrl = await uploadFromUrl({
          sourceUrl: rawUrl,
          fileName,
        }).catch(() => rawUrl);
      } catch (imgErr) {
        console.error(`[generate] Panel ${i + 1} image failed:`, imgErr);
      }

      const cat = typeof bg.category === "string" ? bg.category : "village";
      const sceneKey = bg.key || SCENE_MAP[cat] || "morning_village";

      panelData.push({
        id: ps.id || i + 1,
        bg: "#FFF3E0",
        scene: sceneKey,
        generatedImageUrl,
        dialogue,
        characterIds: panelChars.map(c => c.id),
        backgroundId: bg.id,
        action: ps.action,
      });
    }

    const updated = await prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        titleVi: titleVi || script.titleVi,
        titleEn: script.titleEn,
        panels: JSON.parse(JSON.stringify(panelData)),
        status: "PUBLISHED",
      },
    });

    await prisma.aIGenerationLog
      .create({
        data: {
          userId: session.user.id!,
          lessonId: lesson.id,
          input: {
            topic,
            templateKey,
            characterIds: charIds,
            backgroundIds: bgIds,
          },
          status: "success",
        },
      })
      .catch(() => {});

    return NextResponse.json({ lesson: updated });
  } catch (err) {
    console.error("[generate lesson]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi server" },
      { status: 500 },
    );
  }
}
