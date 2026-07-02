import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/dashboard/StatCard";

export default async function TeacherDashboard() {
  const session = await auth();
  const teacherId = session!.user.id;
  
  const [lessons, aiLogs, characters] = await Promise.all([
    prisma.lesson.findMany({ where: { authorId: teacherId }, orderBy: { createdAt: "desc" } }),
    prisma.aIGenerationLog.count({ where: { userId: teacherId } }),
    prisma.comicCharacter.count({ where: { createdById: teacherId } }),
    // prisma.comicStory.count({ where: { authorId: teacherId } }),
  ]);
  
  const comicLessons = lessons.filter((l) => l.source === "COMIC").length;
  const published = lessons.filter((l) => l.status === "PUBLISHED").length;
  const aiGenerated = lessons.filter((l) => l.source === "AI").length;

  return (
    <div>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 24, flexWrap: "wrap", gap: 12
      }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Xin chào, {session?.user.name}! 🧑‍🏫</h1>
          <p style={{ color: "var(--text-muted)" }}>Tạo nội dung học tiếng Anh cho học sinh vùng cao.</p>
        </div>
        <Link href="/dashboard/teacher/stories"
          style={{
            padding: "12px 22px", borderRadius: 12, background: "var(--primary)",
            color: "white", fontWeight: 800, textDecoration: "none"
          }}>
          🎨 Tạo bài học mới
        </Link>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 16, marginBottom: 28
      }}>
        <StatCard icon="📖" label="Tổng bài học" value={lessons.length} color="#E3F2FD" />
        <StatCard icon="✅" label="Đã xuất bản" value={published} color="#E8F5E9" />
        <StatCard icon="🤖" label="AI tạo" value={aiGenerated} color="#F3E5F5" />
        <StatCard icon="🧒" label="Nhân vật tôi tạo" value={characters} color="#FFF3E0" />
        {/* <StatCard icon="🎨" label="Truyện tranh" value={comicStories} color="#FBE9E7" /> */}
        <StatCard icon="🎨" label="Bài học truyện tranh" value={comicLessons} color="#FBE9E7" />
        <StatCard icon="⚡" label="Lần dùng AI" value={aiLogs} color="#FFFDE7" />
      </div>

      <h2 style={{
        fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem",
        marginBottom: 14
      }}>🚀 Tác vụ nhanh</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {[
          { href: "/dashboard/teacher/stories", icon: "🎨", title: "Tạo bài học mới", desc: "Truyện tranh song ngữ với ảnh AI" },
          { href: "/dashboard/teacher/characters", icon: "🧒", title: "Quản lý nhân vật", desc: "Tạo nhân vật dân tộc 2D" },
          { href: "/dashboard/teacher/backgrounds", icon: "🌄", title: "Quản lý bối cảnh", desc: "Tạo ảnh bối cảnh Tây Nguyên" },
          { href: "/dashboard/admin/students", icon: "📊", title: "Tiến độ học sinh", desc: "Bảng xếp hạng và thành tích" },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            style={{
              background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 14,
              padding: 16, textDecoration: "none", color: "var(--text)", display: "block"
            }}>
            <div style={{ fontSize: "1.8rem", marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontWeight: 800, fontSize: "0.95rem", marginBottom: 3 }}>{item.title}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{item.desc}</div>
          </Link>
        ))}
      </div>

      {lessons.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", marginBottom: 14 }}>
            📖 Bài học gần đây
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lessons.slice(0, 5).map((l) => (
              <div key={l.id} style={{
                background: "var(--bg-card)", border: "1.5px solid var(--border)",
                borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12
              }}>
                <span style={{ fontSize: "1.4rem" }}>{l.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{l.titleVi}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{l.titleEn}</div>
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
        </div>
      )}
    </div>
  );
}
