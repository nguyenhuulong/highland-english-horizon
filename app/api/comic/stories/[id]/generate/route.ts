import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { generateComicPanel } from "@/lib/imageGen";
import { uploadFromUrl, makeFileName } from "@/lib/storage";
import type { ComicCharacterDTO, ComicBackgroundDTO, ComicStoryPanel } from "@/types";

const AI_BASE_URL = process.env.AI_BASE_URL || "https://api.openai.com/v1";
const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";
const AI_API_KEY = process.env.AI_API_KEY || "";

// 4 template cố định — định nghĩa cấu trúc panel cho LLM
const STORY_TEMPLATES: Record<string, { panelCount: number; structure: string }> = {
  INTRO_4: {
    panelCount: 4,
    structure: `
Panel 1: Giới thiệu nhân vật và bối cảnh (greeting, introduction)
Panel 2: Tình huống/vấn đề xảy ra (problem or activity begins)
Panel 3: Tương tác chính, học từ vựng (main interaction, vocabulary in context)
Panel 4: Kết thúc vui vẻ, tóm tắt bài học (happy ending, lesson recap)`.trim(),
  },
  DIALOGUE_6: {
    panelCount: 6,
    structure: `
Panel 1: Gặp gỡ (meeting/greeting)
Panel 2: Hỏi thăm, làm quen (asking about each other)
Panel 3: Hoạt động chung (shared activity)
Panel 4: Khám phá văn hóa (cultural discovery moment)
Panel 5: Thử thách nhỏ (small challenge)
Panel 6: Giải quyết và tạm biệt (resolution and farewell)`.trim(),
  },
  ADVENTURE_6: {
    panelCount: 6,
    structure: `
Panel 1: Khởi hành phiêu lưu (adventure begins)
Panel 2: Khám phá địa điểm mới (explore new place)
Panel 3: Gặp nhân vật thú vị (meet interesting character)
Panel 4: Thử thách cần vượt qua (challenge to overcome)
Panel 5: Cùng nhau giải quyết (teamwork solution)
Panel 6: Chiến thắng và bài học (victory and lesson)`.trim(),
  },
  FESTIVAL_8: {
    panelCount: 8,
    structure: `
Panel 1: Chuẩn bị lễ hội (festival preparation)
Panel 2: Trang phục truyền thống (traditional costumes)
Panel 3: Đến lễ hội (arriving at festival)
Panel 4: Âm nhạc và múa (music and dance)
Panel 5: Ẩm thực truyền thống (traditional food)
Panel 6: Trò chơi dân gian (traditional games)
Panel 7: Kết bạn với khách tham quan (making friends with visitors)
Panel 8: Chia sẻ văn hóa, tạm biệt (sharing culture, farewell)`.trim(),
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

// POST /api/comic/stories/[id]/generate
// Sinh toàn bộ kịch bản + ảnh cho một story

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || !["TEACHER", "ADMIN", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const { id } = await params;
    const story = await prisma.comicStory.findUnique({
      where: { id },
      include: { ethnicGroup: { select: { nameVi: true, nameEn: true, slug: true } } },
    });

    if (!story) return NextResponse.json({ error: "Không tìm thấy truyện" }, { status: 404 });

    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role ?? "");
    if (!isAdmin && story.authorId !== session.user.id) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    // Đánh dấu đang generating
    await prisma.comicStory.update({ where: { id }, data: { status: "generating" } });

    // Lấy characters và backgrounds đã chọn
    const characterIds = story.characterIds as string[];
    const backgroundIds = story.backgroundIds as string[];

    const [dbChars, dbBgs] = await Promise.all([
      prisma.comicCharacter.findMany({ where: { id: { in: characterIds } } }),
      prisma.comicBackground.findMany({ where: { id: { in: backgroundIds } } }),
    ]);

    const characters: ComicCharacterDTO[] = (dbChars as {
      id: string; name: string; nameEn: string; role: string; gender: string;
      ethnicGroupId: string | null; descriptionVi: string; descriptionEn: string;
      costumePrompt: string; appearancePrompt: string; referenceImageUrl: string | null;
      characterImageUrl?: string; thumbnailEmoji: string; isActive: boolean;
    }[]).map((c) => ({
      id: c.id, name: c.name, nameEn: c.nameEn,
      role: c.role as "child" | "adult" | "elder",
      gender: c.gender as "male" | "female",
      ethnicGroupId: c.ethnicGroupId, descriptionVi: c.descriptionVi,
      descriptionEn: c.descriptionEn, costumePrompt: c.costumePrompt,
      appearancePrompt: c.appearancePrompt,
      referenceImageUrl: c.referenceImageUrl,
      characterImageUrl: (c as { characterImageUrl?: string }).characterImageUrl || null,
      thumbnailEmoji: c.thumbnailEmoji, isActive: c.isActive,
    }));

    const backgrounds: ComicBackgroundDTO[] = (dbBgs as {
      id: string; key: string; nameVi: string; nameEn: string; category: string;
      ethnicGroupId: string | null; prompt: string; referenceImageUrl?: string;
      imageUrl: string | null; thumbnailEmoji: string; isActive: boolean;
    }[]).map((b) => ({
      id: b.id, key: b.key, nameVi: b.nameVi, nameEn: b.nameEn,
      category: b.category as "village" | "forest" | "market" | "festival" | "house" | "school",
      ethnicGroupId: b.ethnicGroupId, prompt: b.prompt,
      referenceImageUrl: (b as { referenceImageUrl?: string }).referenceImageUrl || null,
      imageUrl: b.imageUrl, thumbnailEmoji: b.thumbnailEmoji, isActive: b.isActive,
    }));

    const template = STORY_TEMPLATES[story.templateKey] || STORY_TEMPLATES.INTRO_4;
    const ethnicName = story.ethnicGroup?.nameVi || "K'Ho";
    const ethnicNameEn = story.ethnicGroup?.nameEn || "K'Ho";

    // ── BƯỚC 1: LLM gen kịch bản ──────────────────────────────────────────────
    const charList = characters.map((c) => `- ${c.name} (${c.nameEn}): ${c.descriptionEn}`).join("\n");
    const bgList = backgrounds.map((b, i) => `[${i}] ${b.nameVi} / ${b.nameEn}: ${b.prompt.slice(0, 80)}`).join("\n");

    const systemPrompt = `Bạn là tác giả truyện tranh thiếu nhi song ngữ Anh-Việt, chuyên về văn hóa dân tộc Tây Nguyên Việt Nam.
Tạo kịch bản truyện tranh ngắn, phù hợp trẻ em 8-12 tuổi.
- Thoại tiếng Anh: ngắn gọn, đơn giản (A1-A2), tối đa 12 từ/câu
- Thoại tiếng Việt: dịch sát nghĩa, tự nhiên
- Mỗi panel có đúng 1-2 lượt thoại
- Nội dung vui vẻ, giáo dục, tôn trọng văn hóa dân tộc
Trả về JSON thuần túy, không có markdown.`;

    const userPrompt = `Tạo kịch bản truyện tranh ${template.panelCount} panel.

Chủ đề: ${story.topic}
Dân tộc: ${ethnicName}
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
  "vocabulary": [{"en": "word", "vi": "từ", "example": "example sentence"}],
  "panels": [
    {
      "id": 1,
      "backgroundIndex": 0,
      "characterNames": ["Tên nhân vật xuất hiện"],
      "action": "Short English description of what characters are doing (for image gen)",
      "dialogue": [
        {"characterName": "Tên nhân vật", "en": "English line max 12 words", "vi": "Dịch tiếng Việt"}
      ]
    }
  ]
}`;

    let scriptData: {
      titleVi: string;
      titleEn: string;
      vocabulary: { en: string; vi: string; example: string }[];
      panels: {
        id: number;
        backgroundIndex: number;
        characterNames: string[];
        action: string;
        dialogue: { characterName: string; en: string; vi: string }[];
      }[];
    };

    try {
      const raw = await callLLM(systemPrompt, userPrompt);
      scriptData = extractJson(raw) as typeof scriptData;
    } catch (err) {
      await prisma.comicStory.update({ where: { id }, data: { status: "draft" } });
      return NextResponse.json({ error: `LLM gen kịch bản thất bại: ${err}` }, { status: 500 });
    }

    // ── BƯỚC 2: Gen ảnh từng panel song song ──────────────────────────────────
    const panelPromises = scriptData.panels.map(async (panelScript, idx) => {
      const bg = backgrounds[panelScript.backgroundIndex] || backgrounds[0] || {
        id: "", key: "village", nameVi: "Làng", nameEn: "Village",
        category: "village" as const, prompt: `${ethnicNameEn} highland village`,
        thumbnailEmoji: "🌄", isActive: true,
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

      // Sinh ảnh panel với Replicate FLUX-dev (image conditioning nếu có characterImageUrl)
      let generatedImageUrl: string | undefined;
      try {
        const rawUrl = await generateComicPanel({
          background: bg,
          characters: panelChars,
          action: panelScript.action,
          ethnicCulture: ethnicNameEn,
          panelSeed: parseInt(id.slice(-4), 16) + idx,
        });

        // Lưu vào Supabase Storage
        try {
          const fileName = makeFileName(`stories/${id}/panel-${idx + 1}`, "jpg");
          generatedImageUrl = await uploadFromUrl({ sourceUrl: rawUrl, fileName });
        } catch {
          generatedImageUrl = rawUrl;
        }
      } catch (imgErr) {
        console.warn(`[generate] Panel ${idx + 1} image failed:`, imgErr);
      }

      const panel: ComicStoryPanel = {
        id: panelScript.id || idx + 1,
        backgroundId: bg.id,
        backgroundImageUrl: bg.imageUrl || undefined,
        generatedImageUrl,
        action: panelScript.action,
        characterIds: panelChars.map((c) => c.id),
        dialogue,
      };

      return panel;
    });

    const panels = await Promise.all(panelPromises);

    // ── BƯỚC 3: Lưu kết quả ───────────────────────────────────────────────────
    const panelsJson = JSON.parse(
      JSON.stringify(panels),
    ) as Prisma.InputJsonValue;

    const vocabularyJson = JSON.parse(
      JSON.stringify(scriptData.vocabulary ?? []),
    ) as Prisma.InputJsonValue;

    const updatedStory = await prisma.comicStory.update({
      where: { id },
      data: {
        title: scriptData.titleVi || story.title,
        titleEn: scriptData.titleEn || story.titleEn,
        panels: panelsJson,
        vocabulary: vocabularyJson,
        status: "ready",
      },
    });

    return NextResponse.json({ story: updatedStory });
  } catch (err) {
    console.error("[generate story]", err);
    // Reset về draft nếu lỗi không mong đợi
    const { id } = await params;
    await prisma.comicStory.update({ where: { id }, data: { status: "draft" } }).catch(() => {});
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi sinh truyện" },
      { status: 500 }
    );
  }
}
