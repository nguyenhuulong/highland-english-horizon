import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addXP, evaluateBadges, XP_RULES } from "@/lib/gamification";

const schema = z.object({
  lessonId: z.string(),
  action: z.enum([
    "read",
    "quiz",
    "match",
    "pronunciation",
    "fill_blank",
    "speak_game",
  ]),
  score: z.coerce.number().optional(),
  total: z.coerce.number().optional(),
  sentenceEn: z.string().optional(),
  transcript: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ progress: [] });

  const progress = await prisma.lessonProgress.findMany({
    where: { userId: session.user.id },
  });
  const badges = await prisma.userBadge.findMany({
    where: { userId: session.user.id },
    include: { badge: true },
  });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { xp: true, streak: true },
  });

  return NextResponse.json({
    progress,
    badges,
    xp: user?.xp || 0,
    streak: user?.streak || 0,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  const { lessonId, action, score, total, sentenceEn, transcript } =
    parsed.data;
  const userId = session.user.id;

  let xpGain = 0;

  if (action === "read") {
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        read: true,
        readAt: new Date(),
        xpEarned: XP_RULES.LESSON_READ,
      },
      update: { read: true, readAt: new Date() },
    });
    const existing = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    if (existing && existing.xpEarned === 0) {
      xpGain = XP_RULES.LESSON_READ;
      await prisma.lessonProgress.update({
        where: { userId_lessonId: { userId, lessonId } },
        data: { xpEarned: { increment: xpGain } },
      });
    }
  }

  if (action === "quiz" && score != null && total != null) {
    xpGain = score * XP_RULES.QUIZ_CORRECT;
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        quizScore: score,
        quizTotal: total,
        quizAt: new Date(),
        xpEarned: xpGain,
      },
      update: {
        quizScore: score,
        quizTotal: total,
        quizAt: new Date(),
        xpEarned: { increment: xpGain },
      },
    });
  }

  if (action === "match" && score != null) {
    xpGain = score * XP_RULES.MATCH_PER_PAIR;
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, matchScore: score, xpEarned: xpGain },
      update: { matchScore: score, xpEarned: { increment: xpGain } },
    });
  }

  if (action === "fill_blank" && score != null && total != null) {
    xpGain = score * XP_RULES.FILL_CORRECT;
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        quizScore: score,
        quizTotal: total,
        xpEarned: xpGain,
      },
      update: {
        quizScore: score,
        quizTotal: total,
        xpEarned: { increment: xpGain },
      },
    });
  }

  if (action === "speak_game" && score != null && sentenceEn) {
    xpGain =
      score >= 80
        ? XP_RULES.SPEAK_PERFECT
        : score >= 60
          ? XP_RULES.SPEAK_GOOD
          : 0;
    await prisma.pronunciationAttempt.create({
      data: {
        userId,
        lessonId,
        sentenceEn,
        transcript: transcript || "",
        score,
      },
    });
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, pronScore: score, xpEarned: xpGain },
      update: { pronScore: { set: score }, xpEarned: { increment: xpGain } },
    });
  }

  if (action === "pronunciation" && score != null && sentenceEn) {
    await prisma.pronunciationAttempt.create({
      data: {
        userId,
        lessonId,
        sentenceEn,
        transcript: transcript || "",
        score,
      },
    });
    if (score >= 70) xpGain = XP_RULES.PRONUNCIATION_GOOD;
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, pronScore: score, xpEarned: xpGain },
      update: {
        pronScore: { set: score },
        xpEarned: { increment: xpGain },
      },
    });
  }

  if (xpGain > 0) await addXP(userId, xpGain);
  const newBadges = await evaluateBadges(userId);

  return NextResponse.json({ ok: true, xpGain, newBadges });
}
