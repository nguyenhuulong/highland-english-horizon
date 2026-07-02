"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StoryCreator from "@/components/comic/StoryCreator";
import { showToast } from "@/components/ui/Feedback";
import type { LessonDTO } from "@/types";

interface EthnicGroup { id: string; slug: string; nameVi: string; nameEn: string; emoji: string; }

export default function TeacherStoriesPage() {
  const [view, setView] = useState<"list" | "create">("list");
  const [lessons, setLessons] = useState<LessonDTO[]>([]);
  const [ethnicGroups, setEthnicGroups] = useState<EthnicGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/lessons?mine=true").then((r) => r.json()).catch(() => ({ lessons: [] })),
      fetch("/api/ethnic-groups").then((r) => r.json()).catch(() => ({ ethnicGroups: [] })),
    ]).then(([ld, ed]) => {
      setLessons((ld.lessons ?? []).filter((l: LessonDTO) => l.source === "COMIC"));
      setEthnicGroups(ed.ethnicGroups ?? []);
      setLoading(false);
    });
  }, []);

  function handleCreated(lessonId: string) {
    fetch(`/api/lessons/${lessonId}`).then((r) => r.json()).then((data) => {
      if (data.lesson) setLessons((p) => [data.lesson, ...p]);
    });
    setView("list");
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Xóa bài học "${title}"?`)) return;
    try {
      await fetch(`/api/lessons/${id}`, { method: "DELETE" });
      setLessons((p) => p.filter((l) => l.id !== id));
      showToast("Đã xóa bài học", "success");
    } catch {
      showToast("Không thể xóa", "error");
    }
  }

  if (view === "create") {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <button onClick={() => setView("list")} style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-body)" }}>
            ← Danh sách
          </button>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.4rem", margin: 0 }}>🎨 Tạo bài học truyện tranh</h1>
        </div>
        <StoryCreator ethnicGroups={ethnicGroups} onStoryReady={handleCreated} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.6rem", margin: 0 }}>📖 Bài học truyện tranh của tôi</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: 4 }}>
            {lessons.length} bài học — tự động xuất bản vào thư viện sau khi tạo
          </p>
        </div>
        <button onClick={() => setView("create")}
          style={{ padding: "11px 22px", borderRadius: 12, background: "var(--primary)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 800, fontFamily: "var(--font-body)" }}>
          + Tạo bài học mới
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 60 }}>Đang tải...</div>}

      {!loading && lessons.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
          Chưa có bài học nào. Nhấn <strong>+ Tạo bài học mới</strong> để bắt đầu!
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 16 }}>
        {lessons.map((l) => {
          const panels = l.panels as { generatedImageUrl?: string }[];
          const thumb = panels?.[0]?.generatedImageUrl;
          return (
            <div key={l.id} style={{ background: "var(--bg-card)", borderRadius: 16, border: "1.5px solid var(--border)", overflow: "hidden" }}>
              <div style={{ height: 160, background: "linear-gradient(135deg,#ffecd2,#fcb69f)", position: "relative" }}>
                {thumb
                  ? <img src={thumb} alt={l.titleVi} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3.5rem" }}>{l.emoji}</div>
                }
                <div style={{ position: "absolute", top: 8, right: 8, padding: "2px 8px", borderRadius: 12, fontSize: "0.7rem", fontWeight: 800, background: l.status === "PUBLISHED" ? "rgba(34,197,94,0.9)" : "rgba(148,163,184,0.9)", color: "#fff" }}>
                  {l.status === "PUBLISHED" ? "✅ Đã xuất bản" : "📝 Nháp"}
                </div>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>{l.titleVi}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 2 }}>{l.titleEn}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <span style={{ background: "var(--surface)", borderRadius: 6, padding: "2px 7px", fontSize: "0.72rem", fontWeight: 600 }}>{panels?.length ?? 0} panel</span>
                  <span style={{ background: "var(--surface)", borderRadius: 6, padding: "2px 7px", fontSize: "0.72rem", fontWeight: 600 }}>{(l.vocabulary as unknown[])?.length ?? 0} từ</span>
                  <span style={{ background: "var(--surface)", borderRadius: 6, padding: "2px 7px", fontSize: "0.72rem", fontWeight: 600 }}>{(l.quiz as unknown[])?.length ?? 0} quiz</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Link href={`/reader?id=${l.id}`}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 8, background: "var(--primary)", color: "#fff", fontWeight: 700, fontSize: "0.82rem", textAlign: "center", textDecoration: "none" }}>
                    📖 Đọc
                  </Link>
                  <button onClick={() => handleDelete(l.id, l.titleVi)}
                    style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #fee2e2", background: "#fff5f5", cursor: "pointer", fontWeight: 600, fontSize: "0.78rem", fontFamily: "var(--font-body)", color: "#dc2626" }}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
