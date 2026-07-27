import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addXP, evaluateBadges } from "@/lib/gamification";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ completed: {} });
  }

  const attempts = await prisma.missionAttempt.findMany({
    where: { userId: session.user.id, missionId: { startsWith: "village_" }, correct: true },
  });

  const completed: Record<string, { completedAt: number; xpEarned: number }> = {};
  for (const a of attempts) {
    completed[a.missionId.replace("village_", "")] = {
      completedAt: a.createdAt.getTime(),
      xpEarned: 0,
    };
  }

  return NextResponse.json({ completed });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ ok: true, xpGain: 0 });
  }

  const { pointId, xpReward } = await req.json() as { pointId: string; xpReward: number };
  if (!pointId) return NextResponse.json({ error: "Thiếu pointId" }, { status: 400 });

  const missionId = `village_${pointId}`;

  const existing = await prisma.missionAttempt.findFirst({
    where: { userId: session.user.id, missionId, correct: true },
  });
  if (existing) return NextResponse.json({ ok: true, xpGain: 0, alreadyCompleted: true });

  // Dùng bất kỳ lesson nào làm placeholder cho MissionAttempt
  const anyLesson = await prisma.lesson.findFirst({ where: { source: "SAMPLE" } });
  if (!anyLesson) return NextResponse.json({ error: "Không tìm thấy lesson" }, { status: 500 });

  await prisma.missionAttempt.create({
    data: { userId: session.user.id, lessonId: anyLesson.id, missionId, correct: true },
  });

  const xp = Math.max(0, Math.min(100, xpReward ?? 25));
  await addXP(session.user.id, xp);
  const newBadges = await evaluateBadges(session.user.id);

  return NextResponse.json({ ok: true, xpGain: xp, newBadges });
}
