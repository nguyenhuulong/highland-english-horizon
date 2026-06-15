import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const cls = await prisma.class.findUnique({
    where: { id },
    include: { members: { include: { student: true } } },
  });
  if (!cls) notFound();

  const role = session!.user.role;
  if (cls.teacherId !== session!.user.id && role !== "ADMIN" && role !== "SUPER_ADMIN") notFound();

  const studentIds = cls.members.map((m) => m.studentId);
  const progress = await prisma.lessonProgress.findMany({ where: { userId: { in: studentIds } } });

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>🏫 {cls.name}</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
        Mã lớp: <strong style={{ letterSpacing: 1 }}>{cls.joinCode}</strong> · {cls.members.length} học sinh
      </p>

      {cls.members.length === 0 ? (
        <div style={{ color: "var(--text-muted)" }}>Chưa có học sinh nào tham gia.</div>
      ) : (
        <div style={{ background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--surface)", textAlign: "left" }}>
                <th style={{ padding: "10px 16px", fontSize: "0.85rem" }}>Học sinh</th>
                <th style={{ padding: "10px 16px", fontSize: "0.85rem" }}>Bài học hoàn thành</th>
                <th style={{ padding: "10px 16px", fontSize: "0.85rem" }}>Điểm đố vui TB</th>
                <th style={{ padding: "10px 16px", fontSize: "0.85rem" }}>Phát âm tốt nhất</th>
                <th style={{ padding: "10px 16px", fontSize: "0.85rem" }}>XP</th>
              </tr>
            </thead>
            <tbody>
              {cls.members.map((m) => {
                const own = progress.filter((p) => p.userId === m.studentId);
                const lessonsRead = own.filter((p) => p.read).length;
                const withQuiz = own.filter((p) => p.quizTotal);
                const avgQuiz = withQuiz.length
                  ? Math.round((withQuiz.reduce((s, p) => s + (p.quizScore || 0) / (p.quizTotal || 1), 0) / withQuiz.length) * 100)
                  : null;
                const bestPron = own.reduce((max, p) => Math.max(max, p.pronScore || 0), 0);
                return (
                  <tr key={m.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 16px", fontWeight: 700 }}>{m.student.avatar} {m.student.name}</td>
                    <td style={{ padding: "10px 16px" }}>{lessonsRead}</td>
                    <td style={{ padding: "10px 16px" }}>{avgQuiz != null ? `${avgQuiz}%` : "—"}</td>
                    <td style={{ padding: "10px 16px" }}>{bestPron > 0 ? `${bestPron}/100` : "—"}</td>
                    <td style={{ padding: "10px 16px", fontWeight: 700, color: "var(--primary)" }}>{m.student.xp}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
