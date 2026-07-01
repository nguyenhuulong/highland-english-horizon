import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function StudentsPage() {
  const session = await auth();
  if (!session?.user || !["TEACHER", "ADMIN"].includes(session.user.role ?? "")) {
    redirect("/dashboard");
  }

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { xp: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      xp: true,
      streak: true,
      ethnicGroup: true,
      ageGroup: true,
      createdAt: true,
      progress: {
        select: { read: true, quizScore: true, quizTotal: true, matchScore: true, pronScore: true },
      },
      badges: { select: { id: true } },
    },
  });

  const rows = students.map((s) => {
    const lessonsRead = s.progress.filter((p) => p.read).length;
    const quizAttempts = s.progress.filter((p) => p.quizTotal != null);
    const avgQuiz = quizAttempts.length
      ? Math.round(
          (quizAttempts.reduce((sum, p) => sum + (p.quizScore || 0) / (p.quizTotal || 1), 0) / quizAttempts.length) * 100
        )
      : null;
    return {
      id: s.id,
      name: s.name,
      email: s.email,
      avatar: s.avatar,
      xp: s.xp,
      streak: s.streak,
      ethnicGroup: s.ethnicGroup,
      ageGroup: s.ageGroup,
      lessonsRead,
      avgQuiz,
      badgeCount: s.badges.length,
    };
  });

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>🧑‍🎓 Tiến độ học sinh</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
        {rows.length} học sinh — xếp hạng theo điểm kinh nghiệm (XP)
      </p>

      {rows.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", background: "var(--bg-card)", borderRadius: 14, border: "1.5px solid var(--border)" }}>
          Chưa có học sinh nào trong hệ thống.
        </div>
      ) : (
        <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1.5px solid var(--border)", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "40px 1.4fr 1fr 90px 90px 90px 80px", gap: 10, padding: "10px 18px", fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", background: "var(--surface)" }}>
            <span>#</span>
            <span>Học sinh</span>
            <span>Dân tộc</span>
            <span>Bài đọc</span>
            <span>Quiz TB</span>
            <span>Huy hiệu</span>
            <span>XP</span>
          </div>
          {rows.map((s, i) => (
            <div
              key={s.id}
              style={{ display: "grid", gridTemplateColumns: "40px 1.4fr 1fr 90px 90px 90px 80px", gap: 10, padding: "12px 18px", borderTop: "1px solid var(--border)", alignItems: "center" }}
            >
              <span style={{ fontWeight: 800, color: i < 3 ? "var(--primary)" : "var(--text-muted)" }}>{i + 1}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.3rem" }}>{s.avatar}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{s.name}</div>
                  <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{s.email}</div>
                </div>
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{s.ethnicGroup || "—"}</span>
              <span style={{ fontWeight: 700 }}>{s.lessonsRead}</span>
              <span style={{ fontWeight: 700 }}>{s.avgQuiz != null ? `${s.avgQuiz}%` : "—"}</span>
              <span style={{ fontWeight: 700 }}>🏅 {s.badgeCount}</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--primary)" }}>{s.xp}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
