import { prisma } from "@/lib/prisma";
import LessonRowActions from "@/components/dashboard/LessonRowActions";

export default async function AdminLessonsPage() {
  const lessons = await prisma.lesson.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true, role: true } } },
  });

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>📖 Bài học & truyện tranh</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>{lessons.length} bài học trên toàn hệ thống.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lessons.map((l) => (
          <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 14, flexWrap: "wrap" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: l.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>{l.emoji}</div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 700 }}>{l.titleVi}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {l.titleEn} · Tác giả: {l.author.name} · {l.source === "AI" ? "🤖 AI" : l.source === "SAMPLE" ? "📦 Mẫu" : "✍️ Thủ công"}
              </div>
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: l.status === "PUBLISHED" ? "#E8F5E9" : "var(--surface)", color: l.status === "PUBLISHED" ? "var(--secondary)" : "var(--text-muted)" }}>
              {l.status === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}
            </span>
            <LessonRowActions id={l.id} status={l.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
