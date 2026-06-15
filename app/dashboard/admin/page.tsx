import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/dashboard/StatCard";

export default async function AdminDashboard() {
  const [students, teachers, admins, lessons, published, classes, ethnicGroups, aiLogs, recentLessons] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } }),
    prisma.lesson.count(),
    prisma.lesson.count({ where: { status: "PUBLISHED" } }),
    prisma.class.count(),
    prisma.ethnicGroup.count(),
    prisma.aIGenerationLog.count(),
    prisma.lesson.findMany({ take: 6, orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } }),
  ]);

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>🛡️ Tổng quan hệ thống</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>Highland English Horizon — Bảng điều khiển quản trị.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard icon="🧑‍🎓" label="Học sinh" value={students} color="#E8F5E9" />
        <StatCard icon="🧑‍🏫" label="Giáo viên" value={teachers} color="#E3F2FD" />
        <StatCard icon="🛡️" label="Quản trị viên" value={admins} color="#F3E5F5" />
        <StatCard icon="🏫" label="Lớp học" value={classes} color="#FFF3E0" />
        <StatCard icon="📖" label="Tổng bài học" value={lessons} color="#FFFDE7" />
        <StatCard icon="✅" label="Đã xuất bản" value={published} color="#E1F5FE" />
        <StatCard icon="🎎" label="Nhóm dân tộc" value={ethnicGroups} color="#FBE9E7" />
        <StatCard icon="🤖" label="Lượt tạo bằng AI" value={aiLogs} color="#EDE7F6" />
      </div>

      <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>📖 Bài học mới nhất</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {recentLessons.map((l) => (
          <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: l.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>{l.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>{l.titleVi}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {l.author.name} · {l.source === "AI" ? "🤖 AI" : l.source === "SAMPLE" ? "📦 Mẫu" : "✍️ Thủ công"}
              </div>
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: l.status === "PUBLISHED" ? "#E8F5E9" : "var(--surface)", color: l.status === "PUBLISHED" ? "var(--secondary)" : "var(--text-muted)" }}>
              {l.status === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}
            </span>
          </div>
        ))}
      </div>
      <Link href="/dashboard/admin/lessons" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none", fontSize: "0.9rem" }}>
        Quản lý tất cả bài học →
      </Link>
    </div>
  );
}
