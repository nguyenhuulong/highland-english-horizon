import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateComicPanel, type PanelResult } from "@/lib/imageGen";
import { makeFileName } from "@/lib/storage";
import { checkAIConfig } from "@/lib/aiConfig";
import {
  generateLessonScript,
  buildCultureBlock,
  TEMPLATES,
  type ScriptCharacter,
} from "@/lib/lessonScript";
import { cultureFactsBlock } from "@/data/cultureFacts";
import type { ComicCharacterDTO, ComicBackgroundDTO } from "@/types";

// Sinh bài (LLM nhiều bước + vài ảnh) có thể mất vài chục giây đến vài phút
export const maxDuration = 300;

// Chặn chi phí vô tình: tối đa số bài AI/giờ cho mỗi giáo viên
const MAX_LESSONS_PER_HOUR = Number(process.env.AI_MAX_LESSONS_PER_HOUR || 8);
const IMAGE_CONCURRENCY = 2;

type DbBg = Awaited<ReturnType<typeof prisma.comicBackground.findMany>>[number];

function toBgDTO(b: DbBg): ComicBackgroundDTO {
  return {
    id: b.id,
    key: b.key,
    nameVi: b.nameVi,
    nameEn: b.nameEn,
    category: b.category as ComicBackgroundDTO["category"],
    prompt: b.prompt,
    referenceImageUrl: b.referenceImageUrl,
    imageUrl: b.imageUrl,
    thumbnailEmoji: b.thumbnailEmoji,
    isActive: b.isActive,
  };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Chạy tác vụ với số luồng giới hạn, giữ nguyên thứ tự kết quả. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, i: number) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function POST(req: NextRequest) {
  let draftId: string | null = null;
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Chỉ giáo viên mới tạo được bài học" },
        { status: 403 },
      );
    }

    const problem = checkAIConfig();
    if (problem) {
      console.error("[generate] cấu hình AI sai:", problem);
      return NextResponse.json({ error: `Cấu hình AI chưa đúng: ${problem}` }, { status: 503 });
    }

    const lessonsLastHour = await prisma.aIGenerationLog.count({
      where: {
        userId: session.user.id!,
        createdAt: { gt: new Date(Date.now() - 3600_000) },
        input: { path: ["kind"], equals: "lesson" },
      },
    });
    if (lessonsLastHour >= MAX_LESSONS_PER_HOUR) {
      return NextResponse.json(
        { error: `Bạn đã tạo ${lessonsLastHour} bài trong 1 giờ qua. Vui lòng thử lại sau để tránh tốn chi phí AI.` },
        { status: 429 },
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
      level,
      panelBackgroundKeys,
    } = body as {
      topic: string;
      templateKey: string;
      ethnicGroupId?: string;
      characterIds?: string[];
      backgroundIds?: string[];
      titleVi?: string;
      level?: number;
      panelBackgroundKeys?: string[];
    };

    if (!topic || !templateKey) {
      return NextResponse.json({ error: "Thiếu chủ đề hoặc mẫu truyện" }, { status: 400 });
    }

    const lessonLevel = Math.min(3, Math.max(1, level ?? 2)) as 1 | 2 | 3;
    const tmpl = TEMPLATES[templateKey] || TEMPLATES.INTRO_4;
    const charIds = characterIds ?? [];
    const bgIds = backgroundIds ?? [];
    const extraBgKeys = panelBackgroundKeys
      ? [...new Set(panelBackgroundKeys)].filter(k => !bgIds.includes(k))
      : [];

    const [dbChars, dbBgs, dbExtraBgs, ethnicGroup] = await Promise.all([
      prisma.comicCharacter.findMany({ where: { id: { in: charIds } } }),
      prisma.comicBackground.findMany({ where: { id: { in: bgIds } } }),
      extraBgKeys.length > 0
        ? prisma.comicBackground.findMany({ where: { key: { in: extraBgKeys } } })
        : Promise.resolve([] as DbBg[]),
      ethnicGroupId
        ? prisma.ethnicGroup.findUnique({ where: { id: ethnicGroupId } })
        : null,
    ]);

    const bgByKeyOrId = new Map<string, DbBg>();
    [...dbBgs, ...dbExtraBgs].forEach(b => {
      bgByKeyOrId.set(b.id, b);
      bgByKeyOrId.set(b.key, b);
    });

    const characters: ComicCharacterDTO[] = dbChars.map(c => ({
      id: c.id,
      name: c.name,
      nameEn: c.nameEn,
      role: c.role as ComicCharacterDTO["role"],
      gender: c.gender as ComicCharacterDTO["gender"],
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
    const backgrounds = dbBgs.map(toBgDTO);

    const ethnicNameEn = ethnicGroup?.nameEn ?? "K'Ho";
    const ethnicEmoji = ethnicGroup?.emoji ?? "🌄";

    // ── Nội dung: LLM nhiều bước + validator ────────────────────────────────
    const scriptChars: ScriptCharacter[] = characters.map(c => ({
      name: c.name,
      nameEn: c.nameEn,
      role: c.role,
      gender: c.gender,
      descriptionVi: c.descriptionVi,
      appearancePrompt: c.appearancePrompt,
    }));

    let result: Awaited<ReturnType<typeof generateLessonScript>>;
    try {
      result = await generateLessonScript({
        topic,
        templateKey,
        level: lessonLevel,
        cultureBlock: buildCultureBlock(ethnicGroup, cultureFactsBlock(ethnicGroup?.slug)),
        characters: scriptChars,
        backgroundNames: backgrounds.map(b => b.nameVi),
      });
    } catch (err) {
      console.error("[generate] LLM thất bại:", err);
      return NextResponse.json(
        { error: `AI viết truyện thất bại: ${err instanceof Error ? err.message : err}` },
        { status: 502 },
      );
    }
    const { script, report } = result;

    // ── Tạo bài DRAFT để có ID ──────────────────────────────────────────────
    const lesson = await prisma.lesson.create({
      data: {
        titleVi: titleVi || script.titleVi,
        titleEn: script.titleEn,
        topic,
        descriptionVi: script.descriptionVi || topic,
        emoji: ethnicEmoji,
        level: lessonLevel,
        vocabulary: JSON.parse(JSON.stringify(script.vocabulary)),
        panels: [],
        quiz: JSON.parse(JSON.stringify(script.quiz)),
        missions: JSON.parse(JSON.stringify(script.missions)),
        status: "DRAFT",
        source: "COMIC",
        authorId: session.user.id!,
        characterIds: charIds,
        backgroundIds: bgIds,
        templateKey,
      },
    });
    draftId = lesson.id;

    // ── Ảnh từng panel (song song giới hạn) ─────────────────────────────────
    const panelScripts = script.panels.slice(0, tmpl.panelCount);
    const fallbackBg: ComicBackgroundDTO = {
      id: "",
      key: "village",
      nameVi: "Làng",
      nameEn: "Village",
      category: "village",
      prompt: `${ethnicNameEn} highland village, Central Highlands of Vietnam`,
      thumbnailEmoji: "🌄",
      isActive: true,
    };

    const panelData = await mapLimit(panelScripts, IMAGE_CONCURRENCY, async (ps, i) => {
      let bg: ComicBackgroundDTO | undefined;
      const keyed = panelBackgroundKeys?.[i] ? bgByKeyOrId.get(panelBackgroundKeys[i]) : undefined;
      if (keyed) bg = toBgDTO(keyed);
      else if (backgrounds[ps.backgroundIndex]) bg = backgrounds[ps.backgroundIndex];
      else bg = backgrounds[i % Math.max(backgrounds.length, 1)];
      bg = bg ?? fallbackBg;

      let panelChars = characters.filter(c =>
        ps.characterNames.some(n => n === c.name || n === c.nameEn),
      );
      if (panelChars.length === 0) panelChars = characters.slice(0, 2);

      const panelSeed = (hashString(lesson.id) + i * 1337) % 99999;
      let img: PanelResult | null = null;
      let imgErr = "";
      try {
        img = await generateComicPanel({
          background: bg,
          characters: panelChars,
          action: ps.action || `${ethnicNameEn} characters in a traditional setting, panel ${i + 1}`,
          ethnicCulture: ethnicNameEn,
          panelSeed,
          panelIndex: i,
          fileName: makeFileName(`lessons/${lesson.id}/panel-${i + 1}`, "jpg"),
        });
      } catch (e) {
        imgErr = e instanceof Error ? e.message : String(e);
        console.error(`[generate] Panel ${i + 1} lỗi ảnh:`, e);
      }

      return {
        id: ps.id || i + 1,
        bg: "#FFF3E0",
        scene: bg.key || "morning_village",
        generatedImageUrl: img?.url,
        imageMode: img?.mode,
        degraded: img ? img.degraded : true,
        imageNote: img?.note ?? (imgErr ? `Không vẽ được ảnh: ${imgErr.slice(0, 120)}` : undefined),
        dialogue: ps.dialogue.map(d => ({ character: d.characterName, vi: d.vi, en: d.en })),
        characterIds: panelChars.map(c => c.id),
        backgroundId: bg.id,
        action: ps.action,
      };
    });

    const updated = await prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        titleVi: titleVi || script.titleVi,
        titleEn: script.titleEn,
        panels: JSON.parse(JSON.stringify(panelData)),
        status: "PUBLISHED",
      },
    });
    draftId = null;

    const degradedPanels = panelData.filter(p => p.degraded).length;
    await prisma.aIGenerationLog
      .create({
        data: {
          userId: session.user.id!,
          lessonId: lesson.id,
          input: {
            kind: "lesson",
            topic,
            templateKey,
            level: lessonLevel,
            characterIds: charIds,
            backgroundIds: bgIds,
            quality: { ...report.metrics, warnings: report.warnings, repairRounds: report.repairRounds, llmCalls: report.llmCalls },
            images: { total: panelData.length, degraded: degradedPanels, modes: panelData.map(p => p.imageMode ?? "none") },
          },
          status: degradedPanels ? "degraded" : "success",
        },
      })
      .catch(() => {});

    return NextResponse.json({
      lesson: updated,
      quality: { ...report.metrics, warnings: report.warnings },
      degradedPanels,
    });
  } catch (err) {
    console.error("[generate lesson]", err);
    // Không để lại bài DRAFT mồ côi
    if (draftId) await prisma.lesson.delete({ where: { id: draftId } }).catch(() => {});
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi server" },
      { status: 500 },
    );
  }
}
