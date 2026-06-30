import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canCreateLessons } from "@/lib/rbac";

const lessonSchema = z.object({
  titleVi: z.string().min(1),
  titleEn: z.string().min(1),
  topic: z.string().default(""),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
  ageGroup: z.coerce.number().int().min(5).max(20).default(10),
  color: z.string().default("#E8643A"),
  emoji: z.string().default("📖"),
  descriptionVi: z.string().default(""),
  vocabulary: z.array(
    z.object({ en: z.string(), vi: z.string(), audio: z.string().optional() }),
  ),
  panels: z.array(z.any()),
  quiz: z.array(z.any()).default([]),
  missions: z.array(z.any()).default([]),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  source: z.enum(["MANUAL", "AI", "SAMPLE"]).default("MANUAL"),
  ethnicGroupId: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine");
  const status = searchParams.get("status");

  if (!session?.user) {
    const lessons = await prisma.lesson.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ lessons });
  }

  const role = session.user.role;
  let where: Record<string, unknown> = { status: "PUBLISHED" };

  if (role === "ADMIN") {
    where = status ? { status } : {};
  } else if (role === "TEACHER") {
    where = mine ? { authorId: session.user.id } : { status: "PUBLISHED" };
    if (mine && status) where = { authorId: session.user.id, status };
  } else {
    where = { status: "PUBLISHED" };
  }

  const lessons = await prisma.lesson.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ lessons });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !canCreateLessons(session.user.role)) {
    return NextResponse.json(
      { error: "Không có quyền tạo bài học" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const parsed = lessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const lesson = await prisma.lesson.create({
    data: {
      ...parsed.data,
      vocabulary: parsed.data.vocabulary,
      panels: parsed.data.panels,
      quiz: parsed.data.quiz,
      missions: parsed.data.missions,
      authorId: session.user.id,
    },
  });

  return NextResponse.json({ lesson }, { status: 201 });
}
