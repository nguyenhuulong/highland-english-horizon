import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/dashboard/StatCard";

export default async function StudentDashboard() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, progress, badges, recommended] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.lessonProgress.findMany({ where: { userId }, include: { lesson: true } }),
    prisma.userBadge.findMany({ where: { userId }, include: { badge: true } }),
    prisma.lesson.findMany({ where: { status: "PUBLISHED" }, take: 4, orderBy: { createdAt: "desc" } }),
  ]);

  const lessonsRead = progress.filter((p) => p.read).length;
  const wordsLearned = progress
    .filter((p) => p.read)
    .reduce((sum, p) => sum + (Array.isArray(p.lesson.vocabulary) ? (p.lesson.vocabulary as unknown[]).length : 0), 0);
  const avgQuiz = (() => {
    const withQuiz = progress.filter((p) => p.quizTotal);
    if (!withQuiz.length) return null;
    return Math.round(
      (withQuiz.reduce((s, p) => s + (p.quizScore || 0) / (p.quizTotal || 1), 0) / withQuiz.length) * 100
    );
  })();
  const readIds = new Set(progress.filter((p) => p.read).map((p) => p.lessonId));
  const nextLessons = recommended.filter((l) => !readIds.has(l.id)).slice(0, 3);

  return (
    <div>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 24, flexWrap: "wrap", gap: 12
      }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>
            {user?.avatar ?? "🧒"} Xin chào, {session?.user.name}!
          </h1>
          <p style={{ color: "var(--text-muted)" }}>
            {user?.streak ? `🔥 Streak ${user.streak} ngày · ` : ""}
            {user?.xp ?? 0} XP
          </p>
        </div>
        <Link href="/library"
          style={{
            padding: "12px 22px", borderRadius: 12, background: "var(--primary)",
            color: "white", fontWeight: 800, textDecoration: "none"
          }}>
          📚 Đọc truyện
        </Link>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 14, marginBottom: 28
      }}>
        <StatCard icon="📖" label="Bài đã đọc" value={lessonsRead} color="#E3F2FD" />
        <StatCard icon="🔤" label="Từ đã học" value={wordsLearned} color="#E8F5E9" />
        <StatCard icon="🏆" label="Huy hiệu" value={badges.length} color="#FFF3E0" />
        <StatCard icon="⭐" label="XP tích lũy" value={user?.xp ?? 0} color="#FFFDE7" />
        {avgQuiz !== null && (
          <StatCard icon="✅" label="Quiz TB" value={`${avgQuiz}%`} color="#F3E5F5" />
        )}
      </div>

      {nextLessons.length > 0 && (
        <div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem",
            marginBottom: 14
          }}>🆕 Bài học mới</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {nextLessons.map((l) => (
              <Link key={l.id} href={`/reader?id=${l.id}`}
                style={{
                  background: "var(--bg-card)", border: "1.5px solid var(--border)",
                  borderRadius: 14, padding: 16, textDecoration: "none", color: "var(--text)", display: "block"
                }}>
                <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>{l.emoji}</div>
                <div style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: 3 }}>{l.titleVi}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{l.titleEn}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {badges.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem",
            marginBottom: 14
          }}>🏆 Huy hiệu gần đây</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {badges.slice(0, 6).map((ub) => (
              <div key={ub.id} title={ub.badge.description || ub.badge.name}
                style={{
                  background: "var(--bg-card)", border: "1.5px solid var(--border)",
                  borderRadius: 12, padding: "10px 14px", textAlign: "center", minWidth: 80
                }}>
                {/* <div style={{ fontSize: "2rem" }}>{ub.badge.emoji}</div> */}
                <div style={{ fontSize: "0.72rem", fontWeight: 700, marginTop: 4, color: "var(--text-muted)" }}>
                  {ub.badge.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
