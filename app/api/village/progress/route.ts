import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addXP, evaluateBadges } from "@/lib/gamification";
import { VILLAGE_MAP_POINTS } from "@/data/villageMap";

const XP_BY_POINT = new Map(VILLAGE_MAP_POINTS.map(p => [p.id, p.xpReward]));

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
    const pointId = a.missionId.replace("village_", "");
    completed[pointId] = {
      completedAt: a.createdAt.getTime(),
      xpEarned: XP_BY_POINT.get(pointId) ?? 0,
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

  const { pointId } = (await req.json()) as { pointId: string };
  // XP lấy từ dữ liệu phía server, không tin giá trị client gửi lên
  const xp = XP_BY_POINT.get(pointId);
  if (!pointId || xp === undefined) {
    return NextResponse.json({ error: "Điểm trên bản đồ không hợp lệ" }, { status: 400 });
  }

  const missionId = `village_${pointId}`;
  const existing = await prisma.missionAttempt.findFirst({
    where: { userId: session.user.id, missionId, correct: true },
  });
  if (existing) return NextResponse.json({ ok: true, xpGain: 0, alreadyCompleted: true });

  // MissionAttempt cần một lessonId hợp lệ: dùng bất kỳ bài nào (ưu tiên SAMPLE)
  const anyLesson =
    (await prisma.lesson.findFirst({ where: { source: "SAMPLE" }, select: { id: true } })) ??
    (await prisma.lesson.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } }));
  if (!anyLesson) {
    return NextResponse.json(
      { error: "Hệ thống chưa có bài học nào để ghi tiến độ. Hãy nhờ quản trị viên chạy seed." },
      { status: 503 },
    );
  }

  await prisma.missionAttempt.create({
    data: { userId: session.user.id!, lessonId: anyLesson.id, missionId, correct: true },
  });

  await addXP(session.user.id!, xp);
  const newBadges = await evaluateBadges(session.user.id!);

  return NextResponse.json({ ok: true, xpGain: xp, newBadges });
}
