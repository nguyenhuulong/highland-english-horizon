import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateComicPanel } from "@/lib/imageGen";
import { uploadFromUrl, makeFileName } from "@/lib/storage";
import type { ComicCharacterDTO, ComicBackgroundDTO, ComicStoryPanel } from "@/types";

const AI_BASE_URL = process.env.AI_BASE_URL || "https://api.openai.com/v1";
const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";
const AI_API_KEY = process.env.AI_API_KEY || "";

const STORY_TEMPLATES: Record<string, { panelCount: number; structure: string }> = {
  INTRO_4: {
    panelCount: 4,
    structure: `Panel 1: Giới thiệu nhân vật và bối cảnh
Panel 2: Tình huống/vấn đề xảy ra
Panel 3: Tương tác chính, học từ vựng
Panel 4: Kết thúc vui vẻ, tóm tắt bài học`,
  },
  DIALOGUE_6: {
    panelCount: 6,
    structure: `Panel 1: Gặp gỡ
Panel 2: Hỏi thăm, làm quen
Panel 3: Hoạt động chung
Panel 4: Khám phá văn hóa
Panel 5: Thử thách nhỏ
Panel 6: Giải quyết và tạm biệt`,
  },
  ADVENTURE_6: {
    panelCount: 6,
    structure: `Panel 1: Khởi hành phiêu lưu
Panel 2: Khám phá địa điểm mới
Panel 3: Gặp nhân vật thú vị
Panel 4: Thử thách cần vượt qua
Panel 5: Cùng nhau giải quyết
Panel 6: Chiến thắng và bài học`,
  },
  FESTIVAL_8: {
    panelCount: 8,
    structure: `Panel 1: Chuẩn bị lễ hội
Panel 2: Trang phục truyền thống
Panel 3: Đến lễ hội
Panel 4: Âm nhạc và múa
Panel 5: Ẩm thực truyền thống
Panel 6: Trò chơi dân gian
Panel 7: Kết bạn với khách tham quan
Panel 8: Chia sẻ văn hóa, tạm biệt`,
  },
};

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(AI_API_KEY ? { Authorization: `Bearer ${AI_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.8,
      max_tokens: 4000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`AI API ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI không trả về nội dung");
  return content;
}

function extractJson(raw: string): unknown {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  const text = match ? match[1].trim() : raw.trim();
  return JSON.parse(text);
}

interface ScriptData {
  titleVi: string;
  titleEn: string;
  vocabulary: { en: string; vi: string }[];
  quiz: { question_en: string; options: string[]; answer: number }[];
  panels: {
    id: number;
    backgroundIndex: number;
    characterNames: string[];
    action: string;
    dialogue: { characterName: string; en: string; vi: string }[];
  }[];
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const session = await auth();
    if (!session?.user || !["TEACHER", "ADMIN"].includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const story = await prisma.comicStory.findUnique({
      where: { id },
      include: { ethnicGroup: { select: { nameVi: true, nameEn: true, slug: true } } },
    });

    if (!story) {
      return NextResponse.json({ error: "Không tìm thấy truyện" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin && story.authorId !== session.user.id) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    await prisma.comicStory.update({ where: { id }, data: { status: "generating" } });

    const characterIds = story.characterIds as string[];
    const backgroundIds = story.backgroundIds as string[];

    const [dbChars, dbBgs] = await Promise.all([
      prisma.comicCharacter.findMany({ where: { id: { in: characterIds } } }),
      prisma.comicBackground.findMany({ where: { id: { in: backgroundIds } } }),
    ]);

    const characters: ComicCharacterDTO[] = dbChars.map((c) => ({
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

    const backgrounds: ComicBackgroundDTO[] = dbBgs.map((b) => ({
      id: b.id,
      key: b.key,
      nameVi: b.nameVi,
      nameEn: b.nameEn,
      category: b.category as "village" | "forest" | "market" | "festival" | "house" | "school",
      ethnicGroupId: b.ethnicGroupId,
      prompt: b.prompt,
      referenceImageUrl: b.referenceImageUrl,
      imageUrl: b.imageUrl,
      thumbnailEmoji: b.thumbnailEmoji,
      isActive: b.isActive,
    }));

    const template = STORY_TEMPLATES[story.templateKey] || STORY_TEMPLATES.INTRO_4;
    const ethnicNameVi = story.ethnicGroup?.nameVi || "K'Ho";
    const ethnicNameEn = story.ethnicGroup?.nameEn || "K'Ho";

    const charList = characters.map((c) => `- ${c.name} (${c.nameEn}): ${c.descriptionEn}`).join("\n");
    const bgList = backgrounds.map((b, i) => `[${i}] ${b.nameVi} / ${b.nameEn}: ${b.prompt.slice(0, 80)}`).join("\n");

    const systemPrompt = `Bạn là tác giả truyện tranh thiếu nhi song ngữ Anh-Việt, chuyên về văn hóa dân tộc Tây Nguyên Việt Nam.
Tạo kịch bản truyện tranh ngắn, phù hợp trẻ em 8-12 tuổi.
- Thoại tiếng Anh: ngắn gọn, đơn giản (A1-A2), tối đa 12 từ/câu.
- Thoại tiếng Việt: dịch sát nghĩa, tự nhiên.
- Mỗi panel có đúng 1-2 lượt thoại.
- Sau khi viết xong panel, tạo 3 câu hỏi quiz trắc nghiệm tiếng Anh dựa trên nội dung và từ vựng trong truyện, mỗi câu có 4 lựa chọn.
- Nội dung vui vẻ, giáo dục, tôn trọng văn hóa dân tộc.
Trả về JSON thuần túy, không có markdown.`;

    const userPrompt = `Tạo kịch bản truyện tranh ${template.panelCount} panel.

Chủ đề: ${story.topic}
Dân tộc: ${ethnicNameVi}
Nhân vật có sẵn:
${charList || "Không có nhân vật cụ thể, dùng tên generic"}

Bối cảnh có sẵn (chọn từ danh sách này theo index):
${bgList || "Dùng bối cảnh generic"}

Cấu trúc template:
${template.structure}

Trả về JSON theo format:
{
  "titleVi": "Tên truyện tiếng Việt",
  "titleEn": "Story title in English",
  "vocabulary": [{"en": "word", "vi": "từ"}],
  "quiz": [{"question_en": "What did the character do?", "options": ["A", "B", "C", "D"], "answer": 0}],
  "panels": [
    {
      "id": 1,
      "backgroundIndex": 0,
      "characterNames": ["Tên nhân vật xuất hiện"],
      "action": "Short English description of what characters are doing",
      "dialogue": [{"characterName": "Tên nhân vật", "en": "English line", "vi": "Dịch tiếng Việt"}]
    }
  ]
}`;

    let scriptData: ScriptData;
    try {
      const raw = await callLLM(systemPrompt, userPrompt);
      scriptData = extractJson(raw) as ScriptData;
    } catch (err) {
      await prisma.comicStory.update({ where: { id }, data: { status: "draft" } });
      return NextResponse.json({ error: `LLM gen kịch bản thất bại: ${err}` }, { status: 500 });
    }

    const panels: ComicStoryPanel[] = [];
    for (let idx = 0; idx < scriptData.panels.length; idx++) {
      const panelScript = scriptData.panels[idx];
      const bg = backgrounds[panelScript.backgroundIndex] || backgrounds[0] || {
        id: "",
        key: "village",
        nameVi: "Làng",
        nameEn: "Village",
        category: "village" as const,
        prompt: `${ethnicNameEn} highland village`,
        thumbnailEmoji: "🌄",
        isActive: true,
      };

      const panelChars = characters.filter((c) =>
        panelScript.characterNames.some((n) => n === c.name || n === c.nameEn)
      );
      if (panelChars.length === 0 && characters.length > 0) panelChars.push(characters[0]);

      const dialogue = panelScript.dialogue.map((d) => {
        const char = characters.find((c) => c.name === d.characterName || c.nameEn === d.characterName);
        return {
          characterId: char?.id || "",
          characterName: d.characterName,
          en: d.en,
          vi: d.vi,
        };
      });

      let generatedImageUrl: string | undefined;
      try {
        const rawUrl = await generateComicPanel({
          background: bg,
          characters: panelChars,
          action: panelScript.action,
          ethnicCulture: ethnicNameEn,
          panelSeed: parseInt(id.slice(-4), 16) + idx,
        });
        const fileName = makeFileName(`stories/${id}/panel-${idx + 1}`, "jpg");
        generatedImageUrl = await uploadFromUrl({ sourceUrl: rawUrl, fileName }).catch(() => rawUrl);
      } catch (imgErr) {
        console.error(`[generate] Panel ${idx + 1} image failed:`, imgErr);
      }

      panels.push({
        id: panelScript.id || idx + 1,
        backgroundId: bg.id,
        backgroundImageUrl: bg.imageUrl || undefined,
        generatedImageUrl,
        action: panelScript.action,
        characterIds: panelChars.map((c) => c.id),
        dialogue,
      });
    }

    const panelsJson = JSON.parse(JSON.stringify(panels));
    const vocabularyJson = JSON.parse(JSON.stringify(scriptData.vocabulary ?? []));
    const quizJson = JSON.parse(JSON.stringify(scriptData.quiz ?? []));

    const updatedStory = await prisma.comicStory.update({
      where: { id },
      data: {
        title: scriptData.titleVi || story.title,
        titleEn: scriptData.titleEn || story.titleEn,
        panels: panelsJson,
        vocabulary: vocabularyJson,
        quiz: quizJson,
        status: "ready",
      },
    });

    return NextResponse.json({ story: updatedStory });
  } catch (err) {
    console.error("[generate story]", err);
    await prisma.comicStory.update({ where: { id }, data: { status: "draft" } }).catch(() => {});
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi sinh truyện" },
      { status: 500 }
    );
  }
}
