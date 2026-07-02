import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/dashboard/StatCard";

export default async function AdminDashboard() {
  const [students, teachers, admins, lessons, published] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.lesson.count(),
    prisma.lesson.count({ where: { status: "PUBLISHED" } }),
  ]);

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>🛡️ Tổng quan hệ thống</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>Highland English Horizon — Bảng điều khiển quản trị.</p>

      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: 10 }}>NGƯỜI DÙNG</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard icon="🧑‍🎓" label="Học sinh" value={students} color="#E8F5E9" />
        <StatCard icon="🧑‍🏫" label="Giáo viên" value={teachers} color="#E3F2FD" />
        <StatCard icon="🛡️" label="Quản trị viên" value={admins} color="#F3E5F5" />
      </div>

      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: 10 }}>NỘI DUNG</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard icon="📖" label="Tổng bài học" value={lessons} color="#FFFDE7" />
        <StatCard icon="✅" label="Đã xuất bản" value={published} color="#E1F5FE" />
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/dashboard/admin/users"
          style={{ padding: "10px 18px", borderRadius: 10, background: "var(--surface)", border: "1.5px solid var(--border)", textDecoration: "none", color: "var(--text)", fontWeight: 700, fontSize: "0.85rem" }}>
          👥 Quản lý người dùng
        </Link>
        <Link href="/dashboard/admin/students"
          style={{ padding: "10px 18px", borderRadius: 10, background: "var(--surface)", border: "1.5px solid var(--border)", textDecoration: "none", color: "var(--text)", fontWeight: 700, fontSize: "0.85rem" }}>
          📊 Thành tích học sinh
        </Link>
        <Link href="/library"
          style={{ padding: "10px 18px", borderRadius: 10, background: "var(--surface)", border: "1.5px solid var(--border)", textDecoration: "none", color: "var(--text)", fontWeight: 700, fontSize: "0.85rem" }}>
          📚 Thư viện bài học
        </Link>
        <Link href="/dashboard/teacher/characters"
          style={{ padding: "10px 18px", borderRadius: 10, background: "var(--surface)", border: "1.5px solid var(--border)", textDecoration: "none", color: "var(--text)", fontWeight: 700, fontSize: "0.85rem" }}>
          🧒 Xem nhân vật
        </Link>
        <Link href="/dashboard/teacher/backgrounds"
          style={{ padding: "10px 18px", borderRadius: 10, background: "var(--surface)", border: "1.5px solid var(--border)", textDecoration: "none", color: "var(--text)", fontWeight: 700, fontSize: "0.85rem" }}>
          🌄 Xem bối cảnh
        </Link>
      </div>
    </div>
  );
}
