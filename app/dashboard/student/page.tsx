import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/dashboard/StatCard";

export default async function StudentDashboard() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, progress, badges, classMemberships, recommended] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.lessonProgress.findMany({ where: { userId }, include: { lesson: true } }),
    prisma.userBadge.findMany({ where: { userId }, include: { badge: true } }),
    prisma.classMember.findMany({ where: { studentId: userId }, include: { class: { include: { teacher: { select: { name: true } } } } } }),
    prisma.lesson.findMany({ where: { status: "PUBLISHED" }, take: 3, orderBy: { createdAt: "desc" } }),
  ]);

  const lessonsRead = progress.filter((p) => p.read).length;
  const wordsLearned = progress
    .filter((p) => p.read)
    .reduce((sum, p) => sum + (Array.isArray(p.lesson.vocabulary) ? (p.lesson.vocabulary as unknown[]).length : 0), 0);
  const avgQuiz = (() => {
    const withQuiz = progress.filter((p) => p.quizTotal);
    if (!withQuiz.length) return null;
    return Math.round((withQuiz.reduce((s, p) => s + (p.quizScore || 0) / (p.quizTotal || 1), 0) / withQuiz.length) * 100);
  })();
  const readIds = new Set(progress.filter((p) => p.read).map((p) => p.lessonId));
  const nextLessons = recommended.filter((l) => !readIds.has(l.id)).slice(0, 3);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 4 }}>Xin chào, {user?.name}! {user?.avatar}</h1>
        <p style={{ color: "var(--text-muted)" }}>
          {user?.ethnicGroup ? `Học sinh dân tộc ${user.ethnicGroup} · ` : ""}Tiếp tục hành trình học tiếng Anh của bạn nhé!
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard icon="⭐" label="Điểm kinh nghiệm (XP)" value={user?.xp ?? 0} color="#FFF3E0" />
        <StatCard icon="📖" label="Bài học đã hoàn thành" value={lessonsRead} color="#E8F5E9" />
        <StatCard icon="📝" label="Từ vựng đã học" value={wordsLearned} color="#E3F2FD" />
        <StatCard icon="🎯" label="Điểm đố vui trung bình" value={avgQuiz != null ? `${avgQuiz}%` : "—"} color="#F3E5F5" />
        <StatCard icon="🏆" label="Huy hiệu đạt được" value={badges.length} color="#FFFDE7" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>📚 Tiếp tục học</h2>
          {nextLessons.length === 0 ? (
            <div style={{ padding: 20, background: "var(--bg-card)", borderRadius: 12, border: "1.5px solid var(--border)", color: "var(--text-muted)" }}>
              Bạn đã hoàn thành tất cả bài học hiện có. Tuyệt vời! 🎉
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {nextLessons.map((l) => (
                <Link key={l.id} href={`/reader?id=${l.id}`} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: 14,
                  background: "var(--bg-card)", borderRadius: 12, border: "1.5px solid var(--border)",
                  textDecoration: "none", color: "var(--text)",
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: l.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>{l.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{l.titleVi}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{l.titleEn}</div>
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)" }}>Học ngay →</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>🏫 Lớp học của tôi</h2>
          {classMemberships.length === 0 ? (
            <div style={{ padding: 16, background: "var(--bg-card)", borderRadius: 12, border: "1.5px solid var(--border)", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Bạn chưa tham gia lớp học nào.{" "}
              <Link href="/dashboard/student/classes" style={{ color: "var(--primary)", fontWeight: 700 }}>Tham gia ngay</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {classMemberships.map((m) => (
                <div key={m.id} style={{ padding: 14, background: "var(--bg-card)", borderRadius: 12, border: "1.5px solid var(--border)" }}>
                  <div style={{ fontWeight: 700 }}>{m.class.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>GV: {m.class.teacher.name}</div>
                </div>
              ))}
            </div>
          )}

          <h2 style={{ fontSize: "1.1rem", margin: "20px 0 12px" }}>🏆 Huy hiệu gần đây</h2>
          {badges.length === 0 ? (
            <div style={{ padding: 16, background: "var(--bg-card)", borderRadius: 12, border: "1.5px solid var(--border)", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Hoàn thành bài học đầu tiên để nhận huy hiệu!
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {badges.map((b) => (
                <div key={b.id} title={b.badge.description} style={{ width: 56, height: 56, borderRadius: 12, background: "var(--surface)", border: "1.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem" }}>
                  {b.badge.icon}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
