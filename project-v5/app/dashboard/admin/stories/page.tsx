"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import StoryCreator from "@/components/comic/StoryCreator";
import { showToast } from "@/components/ui/Feedback";
import type { ComicStoryDTO } from "@/types";

interface EthnicGroup { id: string; slug: string; nameVi: string; nameEn: string; emoji: string; }

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft: { label: "Nháp", color: "#94a3b8" },
  generating: { label: "Đang tạo...", color: "#f59e0b" },
  ready: { label: "Sẵn sàng", color: "#22c55e" },
  published: { label: "Đã xuất bản", color: "var(--primary)" },
};

export default function StoriesPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const userId = session?.user?.id;

  const [view, setView] = useState<"list" | "create">("list");
  const [stories, setStories] = useState<ComicStoryDTO[]>([]);
  const [ethnicGroups, setEthnicGroups] = useState<EthnicGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/comic/stories").then((r) => r.json()).catch(() => ({ stories: [] })),
      fetch("/api/ethnic-groups").then((r) => r.json()).catch(() => ({ ethnicGroups: [] })),
    ]).then(([sd, ed]) => {
      setStories(sd.stories ?? []);
      setEthnicGroups(ed.ethnicGroups ?? []);
      setLoading(false);
    });
  }, []);

  function handleStoryReady(story: ComicStoryDTO) {
    setStories((p) => [story, ...p]);
    setView("list");
  }

  function canEdit(s: ComicStoryDTO) {
    return role === "ADMIN" || s.authorId === userId;
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Xóa bài học "${title}"?`)) return;
    try {
      const res = await fetch(`/api/comic/stories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setStories((p) => p.filter((s) => s.id !== id));
      showToast("Đã xóa bài học", "success");
    } catch {
      showToast("Không thể xóa", "error");
    }
  }

  async function handleRegenerate(id: string) {
    if (!confirm("Tạo lại toàn bộ kịch bản và ảnh? (có thể mất vài phút)")) return;
    setStories((p) => p.map((s) => (s.id === id ? { ...s, status: "generating" as const } : s)));
    try {
      const res = await fetch(`/api/comic/stories/${id}/generate`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Lỗi sinh lại");
      const { story } = await res.json();
      setStories((p) => p.map((s) => (s.id === id ? story : s)));
      showToast("Đã sinh lại bài học!", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi", "error");
      setStories((p) => p.map((s) => (s.id === id ? { ...s, status: "draft" as const } : s)));
    }
  }

  if (view === "create") {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <button onClick={() => setView("list")}
            style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-body)" }}>
            ← Danh sách
          </button>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.4rem", margin: 0 }}>
            🎨 Tạo bài học truyện tranh
          </h1>
        </div>
        <StoryCreator ethnicGroups={ethnicGroups} onStoryReady={handleStoryReady} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.6rem", margin: 0 }}>📖 Bài học truyện tranh</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: 4 }}>
            {stories.length} bài học — bài được tạo sẽ tự động xuất bản vào thư viện cho học sinh đọc ngay
          </p>
        </div>
        {(role === "TEACHER" || role === "ADMIN") && (
          <button onClick={() => setView("create")}
            style={{ padding: "11px 22px", borderRadius: 12, background: "var(--primary)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 800, fontFamily: "var(--font-body)", fontSize: "0.95rem" }}>
            + Tạo bài học mới
          </button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Đang tải...</div>
      )}

      {!loading && stories.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
          {role === "TEACHER"
            ? <>Chưa có bài học nào. Nhấn <strong>+ Tạo bài học mới</strong> để bắt đầu!</>
            : "Chưa có giáo viên nào tạo bài học."}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {stories.map((s) => {
          const eg = ethnicGroups.find((g) => g.id === s.ethnicGroupId);
          const firstPanel = s.panels?.[0];
          const statusInfo = STATUS_LABEL[s.status] || STATUS_LABEL.draft;
          const editable = canEdit(s);
          const vocab = s.vocabulary as unknown[];
          const missions = s.missions as unknown[];

          return (
            <div key={s.id} style={{ background: "var(--bg-card)", borderRadius: 16, border: "1.5px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
              {/* Thumbnail */}
              <div style={{ height: 180, background: "linear-gradient(135deg,#ffecd2,#fcb69f)", position: "relative", overflow: "hidden" }}>
                {firstPanel?.generatedImageUrl
                  ? <img src={firstPanel.generatedImageUrl} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem" }}>{eg?.emoji ?? "📖"}</div>
                }
                <div style={{ position: "absolute", top: 10, right: 10, padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 800, background: "rgba(255,255,255,0.93)", color: statusInfo.color }}>
                  {s.status === "generating" && <span style={{ marginRight: 4 }}>⏳</span>}
                  {statusInfo.label}
                </div>
                {s.lessonId && (
                  <div style={{ position: "absolute", top: 10, left: 10, padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 800, background: "rgba(34,197,94,0.92)", color: "#fff" }}>
                    ✅ Trong thư viện
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: 14 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem" }}>{s.title}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 2 }}>{s.titleEn}</div>

                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <span style={{ background: "var(--surface)", borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600 }}>{s.panels?.length ?? 0} panel</span>
                  <span style={{ background: "var(--surface)", borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600 }}>{vocab?.length ?? 0} từ vựng</span>
                  <span style={{ background: "var(--surface)", borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600 }}>{s.quiz?.length ?? 0} quiz</span>
                  <span style={{ background: "var(--surface)", borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600 }}>{missions?.length ?? 0} nhiệm vụ</span>
                  {eg && <span style={{ background: "var(--surface)", borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600 }}>{eg.emoji} {eg.nameVi}</span>}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 12 }}>
                  {s.lessonId && (
                    <Link href={`/reader?id=${s.lessonId}`}
                      style={{ padding: "9px 0", borderRadius: 8, background: "var(--primary)", color: "#fff", fontWeight: 700, fontSize: "0.82rem", fontFamily: "var(--font-body)", textAlign: "center", textDecoration: "none", display: "block" }}>
                      📖 Đọc bài học
                    </Link>
                  )}
                  {editable && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                      <button onClick={() => handleRegenerate(s.id)} disabled={s.status === "generating"}
                        style={{ padding: "8px 0", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: s.status === "generating" ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.78rem", fontFamily: "var(--font-body)" }}>
                        🔄 Tạo lại
                      </button>
                      <button onClick={() => handleDelete(s.id, s.title)}
                        style={{ padding: "8px 0", borderRadius: 8, border: "1.5px solid #fee2e2", background: "#fff5f5", cursor: "pointer", fontWeight: 600, fontSize: "0.78rem", fontFamily: "var(--font-body)", color: "#dc2626" }}>
                        🗑️ Xóa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
