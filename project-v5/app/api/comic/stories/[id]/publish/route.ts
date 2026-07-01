import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ComicStoryPanel } from "@/types";

const SCENE_KEY_BY_CATEGORY: Record<string, string> = {
  village: "morning_village",
  forest: "forest_entrance",
  market: "market_morning",
  festival: "drum",
  house: "costume",
  school: "morning_village",
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || !["TEACHER", "ADMIN"].includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const { id } = await params;
    const story = await prisma.comicStory.findUnique({ where: { id } });
    if (!story) {
      return NextResponse.json({ error: "Không tìm thấy truyện" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin && story.authorId !== session.user.id) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    if (story.status !== "ready" && story.status !== "published") {
      return NextResponse.json(
        { error: "Truyện chưa sẵn sàng để xuất bản. Hãy sinh ảnh và kịch bản trước." },
        { status: 400 }
      );
    }

    const panels = story.panels as unknown as ComicStoryPanel[];
    if (!panels.length) {
      return NextResponse.json({ error: "Truyện chưa có panel nào" }, { status: 400 });
    }

    const backgrounds = await prisma.comicBackground.findMany({
      where: { id: { in: panels.map((p) => p.backgroundId).filter(Boolean) } },
      select: { id: true, key: true, category: true },
    });
    const bgMap = new Map<string, { id: string; key: string; category: string }>(
      backgrounds.map((b) => [b.id, b])
    );

    const lessonPanels = panels.map((p) => {
      const bg = bgMap.get(p.backgroundId);
      const scene = bg?.key || SCENE_KEY_BY_CATEGORY[bg?.category ?? "village"] || "morning_village";
      return {
        id: p.id,
        bg: "#FFF3E0",
        scene,
        generatedImageUrl: p.generatedImageUrl,
        dialogue: p.dialogue.map((d) => ({
          character: d.characterName,
          vi: d.vi,
          en: d.en,
        })),
      };
    });

    const vocabulary = story.vocabulary as { en: string; vi: string }[];
    const quiz = story.quiz as { question_en: string; options: string[]; answer: number }[];

    if (story.lessonId) {
      const updated = await prisma.lesson.update({
        where: { id: story.lessonId },
        data: {
          titleVi: story.title,
          titleEn: story.titleEn,
          topic: story.topic,
          vocabulary,
          panels: lessonPanels,
          quiz,
          status: "PUBLISHED",
          ethnicGroupId: story.ethnicGroupId,
        },
      });
      await prisma.comicStory.update({ where: { id }, data: { status: "published" } });
      return NextResponse.json({ lessonId: updated.id });
    }

    const lesson = await prisma.lesson.create({
      data: {
        titleVi: story.title,
        titleEn: story.titleEn,
        topic: story.topic,
        descriptionVi: story.topic,
        emoji: "📖",
        vocabulary,
        panels: lessonPanels,
        quiz,
        missions: [],
        status: "PUBLISHED",
        source: "COMIC",
        authorId: story.authorId,
        ethnicGroupId: story.ethnicGroupId,
      },
    });

    await prisma.comicStory.update({
      where: { id },
      data: { status: "published", lessonId: lesson.id },
    });

    return NextResponse.json({ lessonId: lesson.id });
  } catch (err) {
    console.error("[publish story]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi xuất bản truyện" },
      { status: 500 }
    );
  }
}
