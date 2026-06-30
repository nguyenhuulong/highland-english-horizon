import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/dashboard/StatCard";

export default async function AdminDashboard() {
  const [students, teachers, admins, lessons, published, ethnicGroups,
    aiLogs, characters, backgrounds, stories, recentLessons] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.lesson.count(),
      prisma.lesson.count({ where: { status: "PUBLISHED" } }),
      prisma.ethnicGroup.count(),
      prisma.aIGenerationLog.count(),
      prisma.comicCharacter.count(),
      prisma.comicBackground.count(),
      prisma.comicStory.count(),
      prisma.lesson.findMany({
        take: 6, orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } }
      }),
    ]);

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>🛡️ Tổng quan hệ thống</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
        Highland English Horizon — Bảng điều khiển quản trị.
      </p>

      <h3 style={{
        fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.95rem",
        color: "var(--text-muted)", marginBottom: 10
      }}>NGƯỜI DÙNG</h3>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 14, marginBottom: 24
      }}>
        <StatCard icon="🧑‍🎓" label="Học sinh" value={students} color="#E8F5E9" />
        <StatCard icon="🧑‍🏫" label="Giáo viên" value={teachers} color="#E3F2FD" />
        <StatCard icon="🛡️" label="Quản trị viên" value={admins} color="#F3E5F5" />
      </div>

      <h3 style={{
        fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.95rem",
        color: "var(--text-muted)", marginBottom: 10
      }}>NỘI DUNG</h3>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 14, marginBottom: 24
      }}>
        <StatCard icon="📖" label="Tổng bài học" value={lessons} color="#FFFDE7" />
        <StatCard icon="✅" label="Đã xuất bản" value={published} color="#E1F5FE" />
        <StatCard icon="🎎" label="Nhóm dân tộc" value={ethnicGroups} color="#FBE9E7" />
        <StatCard icon="⚡" label="AI đã dùng" value={aiLogs} color="#EDE7F6" />
      </div>

      <h3 style={{
        fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.95rem",
        color: "var(--text-muted)", marginBottom: 10
      }}>TRUYỆN TRANH</h3>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 14, marginBottom: 28
      }}>
        <StatCard icon="🧒" label="Nhân vật" value={characters} color="#FFF3E0" />
        <StatCard icon="🌄" label="Bối cảnh" value={backgrounds} color="#E8F5E9" />
        <StatCard icon="🎨" label="Truyện" value={stories} color="#FCE4EC" />
      </div>

      <h2 style={{
        fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.05rem",
        marginBottom: 14
      }}>📖 Bài học gần đây</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {recentLessons.map((l) => (
          <div key={l.id} style={{
            background: "var(--bg-card)", border: "1.5px solid var(--border)",
            borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12
          }}>
            <span style={{ fontSize: "1.4rem" }}>{l.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{l.titleVi}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                by {(l as { author?: { name: string } }).author?.name}
              </div>
            </div>
            <span style={{
              fontSize: "0.75rem", fontWeight: 700, padding: "3px 10px", borderRadius: 20,
              background: l.status === "PUBLISHED" ? "#dcfce7" : "var(--surface)",
              color: l.status === "PUBLISHED" ? "#166534" : "var(--text-muted)"
            }}>
              {l.status === "PUBLISHED" ? "Published" : "Draft"}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { href: "/dashboard/admin/users", icon: "👥", label: "Quản lý người dùng" },
          { href: "/dashboard/admin/lessons", icon: "📖", label: "Bài học" },
          { href: "/dashboard/admin/culture", icon: "🎎", label: "Dữ liệu văn hóa" },
          { href: "/dashboard/admin/characters", icon: "🧒", label: "Nhân vật" },
          { href: "/dashboard/admin/backgrounds", icon: "🌄", label: "Bối cảnh" },
          { href: "/dashboard/admin/stories", icon: "🎨", label: "Truyện tranh" },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            style={{
              padding: "10px 18px", borderRadius: 10, background: "var(--surface)",
              border: "1.5px solid var(--border)", textDecoration: "none", color: "var(--text)",
              fontWeight: 700, fontSize: "0.85rem"
            }}>
            {item.icon} {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
