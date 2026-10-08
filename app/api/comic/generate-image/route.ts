import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateComicPanel } from "@/lib/imageGen";
import { makeFileName } from "@/lib/storage";
import type { ComicCharacterDTO, ComicBackgroundDTO } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["TEACHER", "ADMIN"].includes(session.user.role ?? "")
    ) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const body = await req.json();
    const {
      panelId,
      lessonId,
      characterNames,
      backgroundKey,
      action,
      ethnicCulture,
      saveToPanel,
    } = body as {
      panelId: number;
      lessonId?: string;
      characterNames: string[];
      backgroundKey: string;
      action: string;
      ethnicCulture: string;
      saveToPanel?: boolean;
    };

    const dbChars = await prisma.comicCharacter.findMany({
      where: {
        OR: [
          { name: { in: characterNames ?? [] } },
          { id: { in: characterNames ?? [] } }, // trang sửa bài gửi id
        ],
        isActive: true,
      },
      include: { ethnicGroup: { select: { nameEn: true } } },
    });

    const ethnicName = dbChars.find(c => c.ethnicGroup)?.ethnicGroup?.nameEn ?? ethnicCulture ?? "K'Ho";

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

    const dbBg = await prisma.comicBackground.findUnique({
      where: { key: backgroundKey },
    });

    const background: ComicBackgroundDTO = dbBg
      ? {
          id: dbBg.id,
          key: dbBg.key,
          nameVi: dbBg.nameVi,
          nameEn: dbBg.nameEn,
          category: dbBg.category as
            | "village"
            | "forest"
            | "market"
            | "festival"
            | "house"
            | "school",
          prompt: dbBg.prompt,
          referenceImageUrl: dbBg.referenceImageUrl,
          imageUrl: dbBg.imageUrl,
          thumbnailEmoji: dbBg.thumbnailEmoji,
          isActive: dbBg.isActive,
        }
      : {
          id: "",
          key: backgroundKey,
          nameVi: backgroundKey,
          nameEn: backgroundKey,
          category: "village",
          prompt: `Southeast Asian highland village scene, ${ethnicCulture} ethnic minority setting, children book illustration`,
          thumbnailEmoji: "🌄",
          isActive: true,
        };

    const seed = lessonId
      ? Math.abs(
          parseInt(lessonId.replace(/[^0-9]/g, "").slice(0, 8) || "42", 10) +
            panelId,
        ) % 10000
      : 42 + panelId;

    const result = await generateComicPanel({
      background,
      characters,
      action,
      ethnicCulture: ethnicName,
      panelSeed: seed,
      panelIndex: Math.max(0, panelId - 1) + (Date.now() % 3), // đổi góc máy khi vẽ lại
      fileName: makeFileName(
        `panels/${lessonId || "preview"}/panel-${panelId}`,
        "jpg",
      ),
    });
    const imageUrl = result.url;

    if (saveToPanel && lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
      });
      if (lesson) {
        const panels = lesson.panels as Record<string, unknown>[];
        const updated = panels.map(p =>
          Number(p.id) === panelId ? {
                ...p,
                generatedImageUrl: imageUrl,
                imageMode: result.mode,
                degraded: result.degraded,
                imageNote: result.note ?? null,
              } : p,
        );
        await prisma.lesson.update({
          where: { id: lessonId },
          data: { panels: updated as never[] },
        });
      }
    }

    await prisma.aIGenerationLog
      .create({
        data: {
          userId: session.user.id!,
          lessonId: lessonId || null,
          input: {
            panelId,
            characterNames,
            backgroundKey,
            action,
            ethnicCulture,
          },
          status: "success",
        },
      })
      .catch(() => {});

    return NextResponse.json({
      imageUrl,
      cached: false,
      degraded: result.degraded,
      note: result.note ?? null,
    });
  } catch (err) {
    console.error("[generate-image]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi sinh ảnh" },
      { status: 500 },
    );
  }
}
