import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import LessonRowActions from "@/components/dashboard/LessonRowActions";

export default async function TeacherLessonsPage() {
  const session = await auth();
  const lessons = await prisma.lesson.findMany({
    where: { authorId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>📖 Bài học của tôi</h1>
          <p style={{ color: "var(--text-muted)" }}>{lessons.length} bài học</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/creator" style={{ padding: "10px 18px", borderRadius: 10, border: "1.5px solid var(--border)", color: "var(--text)", textDecoration: "none", fontWeight: 700, fontSize: "0.9rem" }}>
            ✍️ Tạo thủ công
          </Link>
          <Link href="/dashboard/teacher/ai-generator" style={{ padding: "10px 18px", borderRadius: 10, background: "var(--primary)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: "0.9rem" }}>
            🤖 Tạo bằng AI
          </Link>
        </div>
      </div>

      {lessons.length === 0 ? (
        <div style={{ color: "var(--text-muted)" }}>Chưa có bài học nào.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {lessons.map((l) => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: l.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>{l.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{l.titleVi}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {l.titleEn} · {l.source === "AI" ? "🤖 AI" : "✍️ Thủ công"} · Cấp độ {l.level}
                </div>
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: l.status === "PUBLISHED" ? "#E8F5E9" : "var(--surface)", color: l.status === "PUBLISHED" ? "var(--secondary)" : "var(--text-muted)", flexShrink: 0 }}>
                {l.status === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}
              </span>
              {l.status === "PUBLISHED" && (
                <Link href={`/reader?id=${l.id}`} style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", textDecoration: "none", flexShrink: 0 }}>Xem →</Link>
              )}
              <LessonRowActions id={l.id} status={l.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
