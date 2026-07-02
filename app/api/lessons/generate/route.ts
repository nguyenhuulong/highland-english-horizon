import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateComicPanel } from "@/lib/imageGen";
import { uploadFromUrl, makeFileName } from "@/lib/storage";
import { getCulturalGroup } from "@/data/culture";
import type { ComicCharacterDTO, ComicBackgroundDTO, CulturalMission } from "@/types";

const AI_BASE_URL = (process.env.AI_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/+$/, "");
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
      temperature: 0.8,
      max_tokens: 5000,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
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
      return NextResponse.json({ error: "Chỉ giáo viên mới tạo được bài học" }, { status: 403 });
    }

    const body = await req.json();
    const { topic, templateKey, ethnicGroupId, characterIds, backgroundIds, titleVi } = body as {
      topic: string;
      templateKey: string;
      ethnicGroupId?: string;
      characterIds?: string[];
      backgroundIds?: string[];
      titleVi?: string;
    };

    if (!topic || !templateKey) {
      return NextResponse.json({ error: "Thiếu topic hoặc templateKey" }, { status: 400 });
    }

    const tmpl = TEMPLATES[templateKey] || TEMPLATES.INTRO_4;
    const charIds = characterIds ?? [];
    const bgIds = backgroundIds ?? [];

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
      ethnicGroupId: b.ethnicGroupId, prompt: b.prompt,
      referenceImageUrl: b.referenceImageUrl, imageUrl: b.imageUrl,
      thumbnailEmoji: b.thumbnailEmoji, isActive: b.isActive,
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
      ? characters.map((c) => `${c.name}: ${c.descriptionEn}, ${c.costumePrompt}`).join(" | ")
      : "Tự đặt tên nhân vật phù hợp";

    const bgHint = backgrounds.length
      ? backgrounds.map((b, i) => `[${i}] ${b.nameVi}`).join(", ")
      : "Tự mô tả bối cảnh";

    // Prompt ngắn gọn, tự nhiên như truyện tranh thiếu nhi thực sự
    const systemPrompt = `Bạn viết truyện tranh thiếu nhi song ngữ Anh-Việt cho học sinh dân tộc thiểu số 9-12 tuổi. Phong cách giống Doraemon, Conan hay Shin-chan: lời thoại ngắn, tự nhiên, sinh động. Không dài dòng, không giải thích như sách giáo khoa.

QUAN TRỌNG:
- Mỗi lượt thoại tiếng Anh: 4-10 từ, tự nhiên như trẻ em thực sự nói
- Mỗi panel: 2-3 lượt thoại ngắn gọn
- Từ vựng xuất hiện tự nhiên trong câu chuyện, không nhồi nhét
- Viết để đọc thấy vui, không phải để học ngữ pháp

Chỉ trả về JSON, không markdown.`;

    const userPrompt = `Tạo truyện tranh ${tmpl.panelCount} panel.

Chủ đề: ${topic}
Dân tộc: ${ethnicNameVi}
${cultureHint}

Nhân vật: ${charHint}
Bối cảnh: ${bgHint}

Gợi ý cấu trúc:
${tmpl.guide}

JSON output:
{
  "titleVi": "Tên truyện tiếng Việt (ngắn gọn, hấp dẫn)",
  "titleEn": "English title",
  "descriptionVi": "1-2 câu giới thiệu truyện",
  "vocabulary": [{"en": "word", "vi": "nghĩa"}],
  "quiz": [{"question_en": "...", "options": ["A","B","C","D"], "answer": 0}],
  "missions": [{"id":"m1","type":"select","title":"...","prompt":"...","options":[{"id":"a","label":"...","emoji":"🎵","correct":true},{"id":"b","label":"...","emoji":"🌿","correct":false}],"fact":"..."}],
  "panels": [
    {
      "id": 1,
      "backgroundIndex": 0,
      "characterNames": ["tên nhân vật"],
      "action": "Nhân vật đang làm gì, tư thế thế nào (để gen ảnh AI)",
      "dialogue": [
        {"characterName": "...", "en": "Short natural line", "vi": "Dịch tự nhiên"},
        {"characterName": "...", "en": "Reply in 4-8 words", "vi": "Dịch tự nhiên"}
      ]
    }
  ]
}

Số lượng: vocabulary 6-10 từ, quiz đúng 4 câu, missions 1-2, panels đúng ${tmpl.panelCount}.`;

    let script: ScriptData;
    try {
      const raw = await callLLM(systemPrompt, userPrompt);
      script = parseJson(raw) as ScriptData;
    } catch (err) {
      return NextResponse.json({ error: `LLM thất bại: ${err}` }, { status: 500 });
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
      const bg = backgrounds[ps.backgroundIndex] ?? backgrounds[i % Math.max(backgrounds.length, 1)] ?? {
        id: "", key: "village", nameVi: "Làng", nameEn: "Village",
        category: "village" as const, prompt: `${ethnicNameEn} highland village`,
        thumbnailEmoji: "🌄", isActive: true,
      };

      const panelChars = characters.filter((c) =>
        ps.characterNames?.some((n) => n === c.name || n === c.nameEn)
      );
      if (panelChars.length === 0 && characters.length > 0) panelChars.push(characters[0]);

      const dialogue = (ps.dialogue || []).map((d) => ({
        character: d.characterName,
        vi: d.vi,
        en: d.en,
      }));

      // Seed nhất quán: dùng lesson.id + panel index để mọi lần gen cùng panel có kết quả tương tự
      const panelSeed = (parseInt(lesson.id.replace(/[^0-9]/g, "").slice(0, 6) || "100", 10) + i * 17) % 9999;

      let generatedImageUrl: string | undefined;
      try {
        const rawUrl = await generateComicPanel({
          background: bg,
          characters: panelChars,
          action: ps.action || `${ethnicNameEn} characters in traditional setting, panel ${i + 1}`,
          ethnicCulture: ethnicNameEn,
          panelSeed,
        });
        const fileName = makeFileName(`lessons/${lesson.id}/panel-${i + 1}`, "jpg");
        generatedImageUrl = await uploadFromUrl({ sourceUrl: rawUrl, fileName }).catch(() => rawUrl);
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
        characterIds: panelChars.map((c) => c.id),
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

    await prisma.aIGenerationLog.create({
      data: {
        userId: session.user.id!,
        lessonId: lesson.id,
        input: { topic, templateKey, characterIds: charIds, backgroundIds: bgIds },
        status: "success",
      },
    }).catch(() => {});

    return NextResponse.json({ lesson: updated });
  } catch (err) {
    console.error("[generate lesson]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Lỗi server" }, { status: 500 });
  }
}
