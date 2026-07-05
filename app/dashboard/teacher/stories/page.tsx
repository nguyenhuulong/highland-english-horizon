"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StoryCreator from "@/components/comic/StoryCreator";
import { showToast, spawnConfetti } from "@/components/ui/Feedback";
import type { LessonDTO } from "@/types";

interface EthnicGroup { id: string; slug: string; nameVi: string; nameEn: string; emoji: string; }

type ViewMode = "list" | "create" | "edit";

interface EditingPanel {
  id: number; bg: string; scene: string; generatedImageUrl?: string;
  action: string; backgroundId: string; characterIds: string[];
  dialogue: { character: string; vi: string; en: string }[];
}

export default function TeacherStoriesPage() {
  const [view, setView] = useState<ViewMode>("list");
  const [lessons, setLessons] = useState<LessonDTO[]>([]);
  const [ethnicGroups, setEthnicGroups] = useState<EthnicGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editLesson, setEditLesson] = useState<LessonDTO | null>(null);
  const [editPanels, setEditPanels] = useState<EditingPanel[]>([]);
  const [editVocab, setEditVocab] = useState<{ en: string; vi: string }[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [regenPanel, setRegenPanel] = useState<number | null>(null);
  const [regenPrompt, setRegenPrompt] = useState("");
  const [regenExtra, setRegenExtra] = useState<Record<number, string>>({});

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

  function openEdit(lesson: LessonDTO) {
    setEditLesson(lesson);
    setEditPanels(JSON.parse(JSON.stringify(lesson.panels as EditingPanel[])));
    setEditVocab(JSON.parse(JSON.stringify(lesson.vocabulary as { en: string; vi: string }[])));
    setView("edit");
  }

  async function saveEdit() {
    if (!editLesson) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/lessons/${editLesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panels: editPanels, vocabulary: editVocab }),
      });
      if (!res.ok) throw new Error("Không thể lưu");
      const data = await res.json();
      setLessons((p) => p.map((l) => (l.id === editLesson.id ? data.lesson : l)));
      showToast("Đã lưu thay đổi!", "success");
      setView("list");
    } catch {
      showToast("Lỗi khi lưu", "error");
    } finally {
      setSavingEdit(false);
    }
  }

  async function regenPanelImage(panel: EditingPanel) {
    if (!editLesson) return;
    setRegenPanel(panel.id);
    const extraNote = regenExtra[panel.id] || "";
    try {
      const res = await fetch("/api/comic/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          panelId: panel.id,
          lessonId: editLesson.id,
          characterNames: panel.characterIds,
          backgroundKey: panel.scene,
          action: panel.action + (extraNote ? `. ${extraNote}` : ""),
          ethnicCulture: "K'Ho",
          saveToPanel: true,
        }),
      });
      if (!res.ok) throw new Error();
      const { imageUrl } = await res.json();
      setEditPanels((prev) =>
        prev.map((p) => (p.id === panel.id ? { ...p, generatedImageUrl: imageUrl } : p))
      );
      setRegenExtra((prev) => ({ ...prev, [panel.id]: "" }));
      showToast("Đã sinh lại ảnh panel!", "success");
      spawnConfetti();
    } catch {
      showToast("Lỗi sinh ảnh", "error");
    } finally {
      setRegenPanel(null);
    }
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

  // ── View: Create ────────────────────────────────────────────────────────────
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

  // ── View: Edit ──────────────────────────────────────────────────────────────
  if (view === "edit" && editLesson) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <button onClick={() => setView("list")} style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-body)" }}>
            ← Danh sách
          </button>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.4rem", margin: 0, flex: 1 }}>
            ✏️ Chỉnh sửa: {editLesson.titleVi}
          </h1>
          <button onClick={saveEdit} disabled={savingEdit}
            style={{ padding: "10px 22px", borderRadius: 10, background: "var(--primary)", color: "#fff", border: "none", cursor: savingEdit ? "not-allowed" : "pointer", fontWeight: 800, fontFamily: "var(--font-body)" }}>
            {savingEdit ? "Đang lưu..." : "💾 Lưu thay đổi"}
          </button>
        </div>

        {/* Từ vựng */}
        <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1.5px solid var(--border)", padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 14 }}>📚 Từ vựng ({editVocab.length} từ)</h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 10,
          }}>
            {editVocab.map((v, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input value={v.en} onChange={(e) => setEditVocab((prev) => prev.map((x, j) => j === i ? { ...x, en: e.target.value } : x))}
                  style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "0.85rem" }} />
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>→</span>
                <input value={v.vi} onChange={(e) => setEditVocab((prev) => prev.map((x, j) => j === i ? { ...x, vi: e.target.value } : x))}
                  style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "0.85rem" }} />
                <button onClick={() => setEditVocab((prev) => prev.filter((_, j) => j !== i))}
                  style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "#fee2e2", color: "#dc2626", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "0.8rem" }}>✕</button>
              </div>
            ))}
          </div>
          <button onClick={() => setEditVocab((p) => [...p, { en: "", vi: "" }])}
            style={{ marginTop: 10, padding: "7px 14px", borderRadius: 8, border: "1.5px dashed var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 600, fontFamily: "var(--font-body)", fontSize: "0.82rem" }}>
            + Thêm từ
          </button>
        </div>

        {/* Panels */}
        <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 14 }}>🖼️ Các panel truyện</h3>
        {editPanels.map((panel) => (
          <div key={panel.id} style={{ background: "var(--bg-card)", borderRadius: 16, border: "1.5px solid var(--border)", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 0 }}>
              {/* Ảnh */}
              <div style={{ width: 220, flexShrink: 0, position: "relative" }}>
                {panel.generatedImageUrl
                  ? <img src={panel.generatedImageUrl} alt={`Panel ${panel.id}`} style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: 130 }} />
                  : <div style={{ width: "100%", minHeight: 130, background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>🖼️</div>
                }
                {regenPanel === panel.id && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  </div>
                )}
              </div>

              {/* Nội dung */}
              <div style={{ flex: 1, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: "0.9rem" }}>Panel {panel.id}</span>
                </div>

                {/* Lời thoại */}
                {panel.dialogue.map((d, di) => (
                  <div key={di} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <input value={d.character} onChange={(e) => setEditPanels((prev) => prev.map((p) => p.id === panel.id ? { ...p, dialogue: p.dialogue.map((x, j) => j === di ? { ...x, character: e.target.value } : x) } : p))}
                      placeholder="Nhân vật"
                      style={{ width: 90, padding: "5px 8px", borderRadius: 7, border: "1.5px solid var(--border)", background: "var(--surface)", fontFamily: "var(--font-body)", fontSize: "0.78rem", flexShrink: 0 }} />
                    <input value={d.en} onChange={(e) => setEditPanels((prev) => prev.map((p) => p.id === panel.id ? { ...p, dialogue: p.dialogue.map((x, j) => j === di ? { ...x, en: e.target.value } : x) } : p))}
                      placeholder="Tiếng Anh"
                      style={{ flex: 1, padding: "5px 8px", borderRadius: 7, border: "1.5px solid #dbeafe", background: "#eff6ff", fontFamily: "var(--font-body)", fontSize: "0.78rem" }} />
                    <input value={d.vi} onChange={(e) => setEditPanels((prev) => prev.map((p) => p.id === panel.id ? { ...p, dialogue: p.dialogue.map((x, j) => j === di ? { ...x, vi: e.target.value } : x) } : p))}
                      placeholder="Tiếng Việt"
                      style={{ flex: 1, padding: "5px 8px", borderRadius: 7, border: "1.5px solid #dcfce7", background: "#f0fdf4", fontFamily: "var(--font-body)", fontSize: "0.78rem" }} />
                  </div>
                ))}

                {/* Sinh lại ảnh */}
                <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                  <input
                    value={regenExtra[panel.id] || ""}
                    onChange={(e) => setRegenExtra((prev) => ({ ...prev, [panel.id]: e.target.value }))}
                    placeholder="Ghi chú thêm cho AI (tùy chọn)"
                    style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface)", fontFamily: "var(--font-body)", fontSize: "0.78rem" }} />
                  <button onClick={() => regenPanelImage(panel)} disabled={regenPanel !== null}
                    style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#ede9fe", color: "#7c3aed", cursor: regenPanel !== null ? "not-allowed" : "pointer", fontWeight: 700, fontFamily: "var(--font-body)", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                    🔄 Sinh lại ảnh
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── View: List ──────────────────────────────────────────────────────────────
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
          const lvl = l.level ?? 1;
          const lvlLabel = lvl === 1 ? "🌱 Starter" : lvl === 2 ? "🌿 Basic" : "🌳 Intermediate";
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
                <div style={{ position: "absolute", top: 8, left: 8, padding: "2px 8px", borderRadius: 12, fontSize: "0.7rem", fontWeight: 800, background: "rgba(255,255,255,0.9)", color: "var(--primary)" }}>
                  {lvlLabel}
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
                <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                  <Link href={`/reader?id=${l.id}`}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 8, background: "var(--primary)", color: "#fff", fontWeight: 700, fontSize: "0.82rem", textAlign: "center", textDecoration: "none" }}>
                    📖 Đọc
                  </Link>
                  <button onClick={() => openEdit(l)}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 600, fontSize: "0.78rem", fontFamily: "var(--font-body)" }}>
                    ✏️
                  </button>
                  <button onClick={() => handleDelete(l.id, l.titleVi)}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #fee2e2", background: "#fff5f5", cursor: "pointer", fontWeight: 600, fontSize: "0.78rem", fontFamily: "var(--font-body)", color: "#dc2626" }}>
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
