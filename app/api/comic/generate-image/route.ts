import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildPanelPrompt, generatePanelImage } from "@/lib/imageGen";
import type { ComicCharacterDTO, ComicBackgroundDTO } from "@/types";

function isValidHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["TEACHER", "ADMIN", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const body = await req.json();
    const { panelId, lessonId, characterNames, backgroundKey, action, ethnicCulture, saveToPanel } = body as {
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
        name: { in: characterNames },
        isActive: true,
      },
    });

    const characters: ComicCharacterDTO[] = (dbChars as {
      id: string; name: string; nameEn: string; role: string; gender: string;
      ethnicGroupId: string | null; descriptionVi: string; descriptionEn: string;
      costumePrompt: string; appearancePrompt: string; referenceImageUrl: string | null;
      thumbnailEmoji: string; isActive: boolean;
    }[]).map((c) => ({
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
      thumbnailEmoji: c.thumbnailEmoji,
      isActive: c.isActive,
    }));

    const dbBg = await prisma.comicBackground.findUnique({ where: { key: backgroundKey } });

    const background: ComicBackgroundDTO = dbBg
      ? {
          id: dbBg.id,
          key: dbBg.key,
          nameVi: dbBg.nameVi,
          nameEn: dbBg.nameEn,
          category: dbBg.category as "village" | "forest" | "market" | "festival" | "house" | "school",
          ethnicGroupId: dbBg.ethnicGroupId,
          prompt: dbBg.prompt,
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
      ? Math.abs(parseInt(lessonId.replace(/[^0-9]/g, "").slice(0, 8) || "42", 10) + panelId) % 10000
      : 42 + panelId;

    const panelPrompt = await buildPanelPrompt({ background, characters, action, ethnicCulture });
    const imageUrl = await generatePanelImage({ panelPrompt, seed });

    if (saveToPanel && lessonId) {
      try {
        const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
        if (lesson) {
          const panels = lesson.panels as Record<string, unknown>[];
          const updated = panels.map((p) => {
            if (Number(p.id) === panelId) {
              return { ...p, generatedImageUrl: imageUrl };
            }
            return p;
          });
          await prisma.lesson.update({ where: { id: lessonId }, data: { panels: updated } });
        }
      } catch (e) {
        console.error("[generate-image] Failed to save to panel:", e);
      }
    }

    await prisma.aIGenerationLog.create({
      data: {
        userId: session.user.id!,
        lessonId: lessonId || null,
        input: { panelId, characterNames, backgroundKey, action, ethnicCulture },
        status: "success",
      },
    }).catch(() => {});

    return NextResponse.json({ imageUrl, cached: false });
  } catch (err) {
    console.error("[generate-image] Error:", err);
    return NextResponse.json({ error: "Lỗi sinh ảnh" }, { status: 500 });
  }
}
