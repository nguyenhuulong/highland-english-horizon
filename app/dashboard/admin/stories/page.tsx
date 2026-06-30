"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import StoryCreator from "@/components/comic/StoryCreator";
import ComicReader from "@/components/comic/ComicReader";
import { showToast } from "@/components/ui/Feedback";
import type { ComicStoryDTO } from "@/types";

interface EthnicGroup {
  id: string;
  slug: string;
  nameVi: string;
  nameEn: string;
  emoji: string;
}

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

  const [view, setView] = useState<"list" | "create" | "read">("list");
  const [stories, setStories] = useState<ComicStoryDTO[]>([]);
  const [ethnicGroups, setEthnicGroups] = useState<EthnicGroup[]>([]);
  const [readingStory, setReadingStory] = useState<ComicStoryDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

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

  function canEdit(story: ComicStoryDTO) {
    if (role === "ADMIN") return true;
    return story.authorId === userId;
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Xóa truyện "${title}"?`)) return;
    try {
      const res = await fetch(`/api/comic/stories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setStories((p) => p.filter((s) => s.id !== id));
      showToast("Đã xóa truyện", "success");
    } catch {
      showToast("Không thể xóa", "error");
    }
  }

  async function handleRegenerate(id: string) {
    if (!confirm("Tạo lại toàn bộ ảnh cho truyện này? (kịch bản giữ nguyên)")) return;
    setStories((p) => p.map((s) => (s.id === id ? { ...s, status: "generating" as const } : s)));
    try {
      const res = await fetch(`/api/comic/stories/${id}/generate`, { method: "POST" });
      if (!res.ok) throw new Error("Lỗi sinh lại");
      const { story } = await res.json();
      setStories((p) => p.map((s) => (s.id === id ? story : s)));
      showToast("Đã sinh lại truyện!", "success");
    } catch (e) {
      showToast(`Lỗi: ${e instanceof Error ? e.message : "unknown"}`, "error");
      setStories((p) => p.map((s) => (s.id === id ? { ...s, status: "draft" as const } : s)));
    }
  }

  async function handlePublish(id: string) {
    setPublishingId(id);
    try {
      const res = await fetch(`/api/comic/stories/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xuất bản");
      setStories((p) => p.map((s) => (s.id === id ? { ...s, status: "published" as const, lessonId: data.lessonId } : s)));
      showToast("Đã xuất bản! Học sinh có thể đọc truyện trong Thư viện.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi xuất bản", "error");
    } finally {
      setPublishingId(null);
    }
  }

  if (view === "create") {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <button
            onClick={() => setView("list")}
            style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-body)" }}
          >
            ← Danh sách
          </button>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.4rem", margin: 0 }}>
            🎨 Tạo truyện tranh mới
          </h1>
        </div>
        <StoryCreator ethnicGroups={ethnicGroups} onStoryReady={handleStoryReady} />
      </div>
    );
  }

  if (view === "read" && readingStory) {
    const eg = ethnicGroups.find((g) => g.id === readingStory.ethnicGroupId);
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <button
            onClick={() => { setView("list"); setReadingStory(null); }}
            style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-body)" }}
          >
            ← Danh sách
          </button>
        </div>
        <ComicReader story={readingStory} ethnicEmoji={eg?.emoji} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.6rem", margin: 0 }}>📖 Truyện tranh</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: 4 }}>
            {stories.length} truyện {role === "ADMIN" ? "— toàn hệ thống" : "— của tôi"}
          </p>
        </div>
        {role === "TEACHER" && (
          <button
            onClick={() => setView("create")}
            style={{ padding: "11px 22px", borderRadius: 12, background: "var(--primary)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 800, fontFamily: "var(--font-body)", fontSize: "0.95rem" }}
          >
            + Tạo truyện mới
          </button>
        )}
      </div>

      {loading && <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Đang tải...</div>}

      {!loading && stories.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
          {role === "TEACHER" ? (
            <>Chưa có truyện nào. Nhấn <strong>+ Tạo truyện mới</strong> để bắt đầu!</>
          ) : (
            "Chưa có giáo viên nào tạo truyện."
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {stories.map((s) => {
          const eg = ethnicGroups.find((g) => g.id === s.ethnicGroupId);
          const firstPanel = s.panels?.[0];
          const statusInfo = STATUS_LABEL[s.status] || STATUS_LABEL.draft;
          const editable = canEdit(s);

          return (
            <div key={s.id} style={{ background: "var(--bg-card)", borderRadius: 16, border: "1.5px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
              <div style={{ height: 180, background: "linear-gradient(135deg,#ffecd2,#fcb69f)", position: "relative", overflow: "hidden" }}>
                {firstPanel?.generatedImageUrl ? (
                  <img src={firstPanel.generatedImageUrl} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem" }}>{eg?.emoji ?? "📖"}</div>
                )}
                <div style={{ position: "absolute", top: 10, right: 10, padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 800, background: "rgba(255,255,255,0.9)", color: statusInfo.color }}>
                  {s.status === "generating" && <span style={{ marginRight: 5 }}>⏳</span>}
                  {statusInfo.label}
                </div>
              </div>

              <div style={{ padding: 14 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem" }}>{s.title}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 2 }}>{s.titleEn}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <span style={{ background: "var(--surface)", borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600 }}>
                    {s.panels?.length ?? 0} panel
                  </span>
                  <span style={{ background: "var(--surface)", borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600 }}>
                    {s.quiz?.length ?? 0} câu hỏi
                  </span>
                  {eg && (
                    <span style={{ background: "var(--surface)", borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600 }}>
                      {eg.emoji} {eg.nameVi}
                    </span>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 12 }}>
                  <button
                    onClick={() => { setReadingStory(s); setView("read"); }}
                    disabled={s.status === "generating"}
                    style={{ padding: "9px 0", borderRadius: 8, border: "none", background: s.status === "ready" || s.status === "published" ? "var(--primary)" : "var(--border)", color: s.status === "ready" || s.status === "published" ? "#fff" : "var(--text-muted)", cursor: s.status === "generating" ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.82rem", fontFamily: "var(--font-body)", gridColumn: "1 / -1" }}
                  >
                    {s.status === "generating" ? "⏳ Đang tạo..." : "📖 Đọc truyện"}
                  </button>

                  {editable && s.status === "ready" && (
                    <button
                      onClick={() => handlePublish(s.id)}
                      disabled={publishingId === s.id}
                      style={{ padding: "8px 0", borderRadius: 8, border: "none", background: "#22c55e", color: "#fff", cursor: publishingId === s.id ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.78rem", fontFamily: "var(--font-body)", gridColumn: "1 / -1" }}
                    >
                      {publishingId === s.id ? "⏳ Đang xuất bản..." : "🚀 Xuất bản cho học sinh"}
                    </button>
                  )}

                  {editable && (
                    <>
                      <button
                        onClick={() => handleRegenerate(s.id)}
                        disabled={s.status === "generating"}
                        style={{ padding: "8px 0", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: s.status === "generating" ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.78rem", fontFamily: "var(--font-body)" }}
                      >
                        🔄 Tạo lại
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.title)}
                        style={{ padding: "8px 0", borderRadius: 8, border: "1.5px solid #fee2e2", background: "#fff5f5", cursor: "pointer", fontWeight: 600, fontSize: "0.78rem", fontFamily: "var(--font-body)", color: "#dc2626" }}
                      >
                        🗑️ Xóa
                      </button>
                    </>
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
