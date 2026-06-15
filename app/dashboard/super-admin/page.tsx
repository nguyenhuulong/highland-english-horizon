import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/dashboard/StatCard";

export default async function SuperAdminDashboard() {
  const [students, teachers, admins, lessons, published, draft, classes, ethnicGroups, aiLogs, badges] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } }),
    prisma.lesson.count(),
    prisma.lesson.count({ where: { status: "PUBLISHED" } }),
    prisma.lesson.count({ where: { status: "DRAFT" } }),
    prisma.class.count(),
    prisma.ethnicGroup.count(),
    prisma.aIGenerationLog.count(),
    prisma.badge.count(),
  ]);

  const checks = [
    { label: "Kết nối cơ sở dữ liệu (DATABASE_URL)", ok: !!process.env.DATABASE_URL },
    { label: "AI Lesson Generator (AI_BASE_URL / AI_API_KEY)", ok: !!process.env.AI_BASE_URL && (!!process.env.AI_API_KEY || /localhost|127\.0\.0\.1/.test(process.env.AI_BASE_URL)) },
    { label: "Khóa xác thực (AUTH_SECRET)", ok: !!process.env.AUTH_SECRET },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>🛡️ Tổng quan hệ thống — Ban Tổ Chức</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>Toàn quyền quản trị Highland English Horizon.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard icon="🧑‍🎓" label="Học sinh" value={students} color="#E8F5E9" />
        <StatCard icon="🧑‍🏫" label="Giáo viên" value={teachers} color="#E3F2FD" />
        <StatCard icon="🛡️" label="Quản trị viên" value={admins} color="#F3E5F5" />
        <StatCard icon="🏫" label="Lớp học" value={classes} color="#FFF3E0" />
        <StatCard icon="📖" label="Tổng bài học" value={lessons} color="#FFFDE7" />
        <StatCard icon="✅" label="Đã xuất bản" value={published} color="#E1F5FE" />
        <StatCard icon="📝" label="Bản nháp" value={draft} color="#FBE9E7" />
        <StatCard icon="🎎" label="Nhóm dân tộc" value={ethnicGroups} color="#EDE7F6" />
        <StatCard icon="🤖" label="Lượt tạo bằng AI" value={aiLogs} color="#E0F2F1" />
        <StatCard icon="🏆" label="Huy hiệu" value={badges} color="#FFF8E1" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>⚙️ Tình trạng cấu hình</h2>
          <div style={{ background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 14, padding: 16 }}>
            {checks.map((c) => (
              <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <span>{c.ok ? "✅" : "⚠️"}</span>
                <span style={{ fontSize: "0.9rem" }}>{c.label}</span>
                <span style={{ marginLeft: "auto", fontSize: "0.78rem", fontWeight: 700, color: c.ok ? "var(--secondary)" : "#F44336" }}>
                  {c.ok ? "Đã cấu hình" : "Thiếu"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>🔗 Truy cập nhanh</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/dashboard/admin/users" style={{ padding: 14, background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 12, textDecoration: "none", color: "var(--text)", fontWeight: 700 }}>
              👥 Quản lý người dùng & phân quyền
            </Link>
            <Link href="/dashboard/admin/lessons" style={{ padding: 14, background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 12, textDecoration: "none", color: "var(--text)", fontWeight: 700 }}>
              📖 Quản lý bài học & truyện tranh
            </Link>
            <Link href="/dashboard/admin/culture" style={{ padding: 14, background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 12, textDecoration: "none", color: "var(--text)", fontWeight: 700 }}>
              🎎 Kho dữ liệu văn hóa
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
