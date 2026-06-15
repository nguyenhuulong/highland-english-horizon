import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/dashboard/StatCard";

export default async function TeacherDashboard() {
  const session = await auth();
  const teacherId = session!.user.id;

  const [classes, lessons, aiLogs] = await Promise.all([
    prisma.class.findMany({ where: { teacherId }, include: { members: true } }),
    prisma.lesson.findMany({ where: { authorId: teacherId }, orderBy: { createdAt: "desc" } }),
    prisma.aIGenerationLog.count({ where: { userId: teacherId } }),
  ]);

  const published = lessons.filter((l) => l.status === "PUBLISHED").length;
  const aiGenerated = lessons.filter((l) => l.source === "AI").length;
  const totalStudents = classes.reduce((s, c) => s + c.members.length, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Xin chào, {session?.user.name}! 🧑‍🏫</h1>
          <p style={{ color: "var(--text-muted)" }}>Quản lý lớp học và tạo bài học bằng AI.</p>
        </div>
        <Link href="/dashboard/teacher/ai-generator" style={{ padding: "12px 22px", borderRadius: 12, background: "var(--primary)", color: "white", fontWeight: 800, textDecoration: "none" }}>
          🤖 Tạo bài học bằng AI
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard icon="🏫" label="Lớp học" value={classes.length} color="#E3F2FD" />
        <StatCard icon="🧑‍🎓" label="Học sinh" value={totalStudents} color="#E8F5E9" />
        <StatCard icon="📖" label="Bài học đã tạo" value={lessons.length} color="#FFF3E0" />
        <StatCard icon="✅" label="Đã xuất bản" value={published} color="#F3E5F5" />
        <StatCard icon="🤖" label="Bài học từ AI" value={aiGenerated} color="#FFFDE7" />
        <StatCard icon="✨" label="Lượt dùng AI" value={aiLogs} color="#E1F5FE" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>📖 Bài học gần đây</h2>
          {lessons.length === 0 ? (
            <div style={{ padding: 16, background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 12, color: "var(--text-muted)" }}>
              Bạn chưa tạo bài học nào. Hãy thử AI Lesson Generator!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {lessons.slice(0, 5).map((l) => (
                <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: l.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>{l.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>{l.titleVi}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{l.source === "AI" ? "🤖 AI tạo" : "✍️ Thủ công"}</div>
                  </div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: l.status === "PUBLISHED" ? "#E8F5E9" : "var(--surface)", color: l.status === "PUBLISHED" ? "var(--secondary)" : "var(--text-muted)" }}>
                    {l.status === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link href="/dashboard/teacher/lessons" style={{ display: "inline-block", marginTop: 10, color: "var(--primary)", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}>
            Xem tất cả bài học →
          </Link>
        </div>

        <div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>🏫 Lớp học của tôi</h2>
          {classes.length === 0 ? (
            <div style={{ padding: 16, background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 12, color: "var(--text-muted)" }}>
              Bạn chưa có lớp học nào.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {classes.map((c) => (
                <Link key={c.id} href={`/dashboard/teacher/classes/${c.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 12, textDecoration: "none", color: "var(--text)" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>{c.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Mã lớp: {c.joinCode} · {c.members.length} học sinh</div>
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)" }}>Xem →</span>
                </Link>
              ))}
            </div>
          )}
          <Link href="/dashboard/teacher/classes" style={{ display: "inline-block", marginTop: 10, color: "var(--primary)", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}>
            Quản lý lớp học →
          </Link>
        </div>
      </div>
    </div>
  );
}
