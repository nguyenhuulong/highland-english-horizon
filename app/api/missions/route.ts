import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addXP, evaluateBadges, XP_RULES } from "@/lib/gamification";

const schema = z.object({
  lessonId: z.string(),
  missionId: z.string(),
  correct: z.boolean(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { lessonId, missionId, correct } = parsed.data;
  const userId = session.user.id;

  await prisma.missionAttempt.create({ data: { userId, lessonId, missionId, correct } });

  let xpGain = 0;
  if (correct) {
    xpGain = XP_RULES.MISSION_CORRECT;
    await addXP(userId, xpGain);
  }
  const newBadges = await evaluateBadges(userId);

  return NextResponse.json({ ok: true, xpGain, newBadges });
}
