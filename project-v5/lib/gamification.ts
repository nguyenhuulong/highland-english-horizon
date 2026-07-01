import { prisma } from "@/lib/prisma";
import { DEFAULT_BADGES } from "@/data/badges";

export const XP_RULES = {
  LESSON_READ: 20,
  QUIZ_CORRECT: 5,
  QUIZ_STREAK_BONUS: 3,
  MATCH_PER_PAIR: 3,
  FLIPCARD_COMPLETE: 20,
  FILL_CORRECT: 8,
  SPEAK_GOOD: 15,
  SPEAK_PERFECT: 25,
  MISSION_CORRECT: 10,
  PRONUNCIATION_GOOD: 15,
};

export async function addXP(userId: string, amount: number) {
  if (amount <= 0) return;
  await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: amount }, lastActiveAt: new Date() },
  });
}

export async function evaluateBadges(userId: string) {
  const [user, progress, missions, pronunciation, badgeDefs, earned] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.lessonProgress.findMany({
        where: { userId },
        include: { lesson: true },
      }),
      prisma.missionAttempt.findMany({ where: { userId, correct: true } }),
      prisma.pronunciationAttempt.findMany({ where: { userId } }),
      prisma.badge.findMany(),
      prisma.userBadge.findMany({ where: { userId } }),
    ]);
  if (!user) return [];

  const earnedCodes = new Set(earned.map(e => e.badgeId));
  const lessonsRead = progress.filter(p => p.read).length;
  const quizPerfect = progress.some(
    p =>
      p.quizScore != null &&
      p.quizTotal != null &&
      p.quizTotal > 0 &&
      p.quizScore === p.quizTotal,
  );
  const wordsLearned = progress
    .filter(p => p.read)
    .reduce(
      (sum, p) =>
        sum +
        (Array.isArray(p.lesson.vocabulary)
          ? (p.lesson.vocabulary as unknown[]).length
          : 0),
      0,
    );
  const bestPron = pronunciation.reduce((max, p) => Math.max(max, p.score), 0);

  const newlyEarned: string[] = [];

  for (const def of badgeDefs.length ? badgeDefs : []) {
    if (earnedCodes.has(def.id)) continue;
    const criteria = def.criteria as { type: string; value: number };
    let met = false;
    switch (criteria.type) {
      case "lessons_read":
        met = lessonsRead >= criteria.value;
        break;
      case "missions_done":
        met = missions.length >= criteria.value;
        break;
      case "quiz_perfect":
        met = quizPerfect;
        break;
      case "pronunciation_score":
        met = bestPron >= criteria.value;
        break;
      case "words_learned":
        met = wordsLearned >= criteria.value;
        break;
      case "fill_perfect":
        met = progress.some(p => (p.quizScore ?? 0) >= criteria.value);
        break;
    }
    if (met) {
      await prisma.userBadge.create({ data: { userId, badgeId: def.id } });
      newlyEarned.push(def.code);
    }
  }

  return newlyEarned;
}

export async function ensureBadgesSeeded() {
  const count = await prisma.badge.count();
  if (count > 0) return;
  await prisma.badge.createMany({
    data: DEFAULT_BADGES,
  });
}
