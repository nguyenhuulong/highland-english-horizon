"use client";

import { useState, useRef } from "react";
import { showToast } from "@/components/ui/Feedback";
import type { ComicBackgroundDTO, BackgroundCategory } from "@/types";

interface Props {
  initialBackgrounds: ComicBackgroundDTO[];
  ethnicGroups: { id: string; slug: string; nameVi: string }[];
}

const CATEGORIES: { value: BackgroundCategory; label: string; emoji: string }[] = [
  { value: "village", label: "Làng", emoji: "🏘️" },
  { value: "forest", label: "Rừng", emoji: "🌲" },
  { value: "market", label: "Chợ", emoji: "🛒" },
  { value: "festival", label: "Lễ hội", emoji: "🎉" },
  { value: "house", label: "Nhà", emoji: "🏠" },
  { value: "school", label: "Trường", emoji: "🏫" },
];

const emptyForm = {
  key: "", nameVi: "", nameEn: "", category: "village" as BackgroundCategory,
  ethnicGroupId: "", prompt: "", thumbnailEmoji: "🌄",
};

export default function BackgroundManager({ initialBackgrounds, ethnicGroups }: Props) {
  const [bgs, setBgs] = useState<ComicBackgroundDTO[]>(initialBackgrounds);
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("");
  const [uploadingRef, setUploadingRef] = useState(false);
  const [pendingRefUrl, setPendingRefUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const displayed = filterCat ? bgs.filter((b) => b.category === filterCat) : bgs;

  function openCreate() {
    setForm({ ...emptyForm });
    setEditId(null);
    setPendingRefUrl(null);
    setShowForm(true);
  }

  function openEdit(b: ComicBackgroundDTO) {
    setForm({
      key: b.key, nameVi: b.nameVi, nameEn: b.nameEn, category: b.category,
      ethnicGroupId: b.ethnicGroupId ?? "", prompt: b.prompt, thumbnailEmoji: b.thumbnailEmoji,
    });
    setPendingRefUrl(b.referenceImageUrl ?? null);
    setEditId(b.id);
    setShowForm(true);
  }

  async function handleUploadRef(file: File) {
    setUploadingRef(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "background");
      const res = await fetch("/api/comic/upload-reference", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload thất bại");
      const data = await res.json();
      setPendingRefUrl(data.url);
    } catch {
      showToast("Không thể upload ảnh", "error");
    } finally {
      setUploadingRef(false);
    }
  }

  async function handleSave() {
    if (!form.key || !form.nameVi || !form.prompt) {
      showToast("Vui lòng điền key, tên và prompt", "error");
      return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/comic/backgrounds/${editId}` : "/api/comic/backgrounds";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ethnicGroupId: form.ethnicGroupId || null,
          referenceImageUrl: pendingRefUrl || null,
        }),
      });
      if (!res.ok) throw new Error("Lỗi lưu");
      const data = await res.json();
      const saved = data.background as ComicBackgroundDTO;
      if (editId) {
        setBgs((p) => p.map((b) => (b.id === editId ? saved : b)));
        showToast("Đã cập nhật bối cảnh", "success");
      } else {
        setBgs((p) => [...p, saved]);
        showToast("Đã tạo bối cảnh mới", "success");
      }
      setShowForm(false);
    } catch {
      showToast("Lỗi lưu dữ liệu", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Xóa bối cảnh "${name}"?`)) return;
    try {
      await fetch(`/api/comic/backgrounds/${id}`, { method: "DELETE" });
      setBgs((p) => p.filter((b) => b.id !== id));
      showToast("Đã xóa", "success");
    } catch {
      showToast("Không thể xóa", "error");
    }
  }

  async function handleGenerateBg(bg: ComicBackgroundDTO) {
    setGeneratingId(bg.id);
    try {
      const res = await fetch("/api/comic/generate-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backgroundId: bg.id }),
      });
      if (!res.ok) throw new Error("Lỗi sinh ảnh");
      const data = await res.json();
      setBgs((p) => p.map((b) => (b.id === bg.id ? { ...b, imageUrl: data.imageUrl } : b)));
      showToast("Đã sinh ảnh nền!", "success");
    } catch (e) {
      showToast(`Lỗi: ${e instanceof Error ? e.message : "unknown"}`, "error");
    } finally {
      setGeneratingId(null);
    }
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 10,
    border: "1.5px solid var(--border)", background: "var(--surface)",
    color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "0.88rem",
    boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, display: "block",
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ ...inp, width: "auto" }}>
          <option value="">Tất cả danh mục</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
        </select>
        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{displayed.length} bối cảnh</span>
        <div style={{ flex: 1 }} />
        <button onClick={openCreate} style={{
          background: "var(--primary)", color: "#fff", border: "none",
          borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer",
          fontFamily: "var(--font-body)"
        }}>+ Tạo bối cảnh mới</button>
      </div>

      {displayed.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Chưa có bối cảnh nào.</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {displayed.map((b) => (
          <div key={b.id} style={{
            background: "var(--bg-card)", borderRadius: 16,
            border: "1.5px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow)"
          }}>
            <div style={{ height: 160, position: "relative", background: "var(--surface)" }}>
              {b.imageUrl ? (
                <img src={b.imageUrl} alt={b.nameVi} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : b.referenceImageUrl ? (
                <>
                  <img src={b.referenceImageUrl} alt="ref" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} />
                  <div style={{
                    position: "absolute", inset: 0, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "3rem"
                  }}>{b.thumbnailEmoji}</div>
                </>
              ) : (
                <div style={{
                  height: "100%", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "3.5rem"
                }}>{b.thumbnailEmoji}</div>
              )}
              {generatingId === b.id && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(255,255,255,0.85)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8
                }}>
                  <div style={{
                    width: 32, height: 32, border: "3px solid var(--border)",
                    borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite"
                  }} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>AI đang vẽ...</span>
                </div>
              )}
            </div>

            <div style={{ padding: 14 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}>{b.nameVi}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginBottom: 6 }}>{b.nameEn} · <code style={{ fontSize: "0.72rem" }}>{b.key}</code></div>
              <span style={{
                background: "var(--surface)", borderRadius: 6, padding: "2px 8px",
                fontSize: "0.72rem", fontWeight: 600
              }}>
                {CATEGORIES.find((c) => c.value === b.category)?.emoji} {CATEGORIES.find((c) => c.value === b.category)?.label}
              </span>

              <div style={{ marginTop: 10, fontSize: "0.76rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                {b.prompt.slice(0, 80)}...
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 6, marginTop: 12 }}>
                <button onClick={() => handleGenerateBg(b)} disabled={generatingId === b.id}
                  style={{
                    padding: "8px 0", borderRadius: 8, border: "none",
                    background: generatingId === b.id ? "var(--border)" : "var(--primary)",
                    color: "#fff", cursor: generatingId === b.id ? "not-allowed" : "pointer",
                    fontWeight: 700, fontSize: "0.78rem", fontFamily: "var(--font-body)"
                  }}>
                  {generatingId === b.id ? "⏳" : b.imageUrl ? "🔄 Vẽ lại" : "🎨 Sinh ảnh"}
                </button>
                <button onClick={() => openEdit(b)} style={{
                  padding: "8px 12px", borderRadius: 8,
                  border: "1.5px solid var(--border)", background: "var(--surface)",
                  cursor: "pointer", fontSize: "0.78rem", fontFamily: "var(--font-body)"
                }}>✏️</button>
                <button onClick={() => handleDelete(b.id, b.nameVi)} style={{
                  padding: "8px 12px", borderRadius: 8,
                  border: "1.5px solid #fee2e2", background: "#fff5f5",
                  cursor: "pointer", fontSize: "0.78rem", color: "#dc2626"
                }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16
        }}>
          <div style={{
            background: "var(--bg-card)", borderRadius: 20, padding: 24,
            maxWidth: 560, width: "100%", maxHeight: "92vh", overflowY: "auto"
          }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.15rem", marginBottom: 18 }}>
              {editId ? "✏️ Sửa bối cảnh" : "✨ Tạo bối cảnh mới"}
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={lbl}>Key (snake_case) *</label>
                <input value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                  style={inp} placeholder="morning_village" disabled={!!editId} />
              </div>
              <div>
                <label style={lbl}>Emoji</label>
                <input value={form.thumbnailEmoji} onChange={(e) => setForm((f) => ({ ...f, thumbnailEmoji: e.target.value }))}
                  style={inp} placeholder="🌄" />
              </div>
              <div>
                <label style={lbl}>Tên tiếng Việt *</label>
                <input value={form.nameVi} onChange={(e) => setForm((f) => ({ ...f, nameVi: e.target.value }))}
                  style={inp} placeholder="Làng buổi sáng" />
              </div>
              <div>
                <label style={lbl}>Tên tiếng Anh</label>
                <input value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                  style={inp} placeholder="Morning village" />
              </div>
              <div>
                <label style={lbl}>Danh mục</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as BackgroundCategory }))} style={inp}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Dân tộc</label>
                <select value={form.ethnicGroupId} onChange={(e) => setForm((f) => ({ ...f, ethnicGroupId: e.target.value }))} style={inp}>
                  <option value="">-- Không chọn --</option>
                  {ethnicGroups.map((g) => <option key={g.id} value={g.id}>{g.nameVi}</option>)}
                </select>
              </div>

              {/* Upload ảnh tham chiếu */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>📸 Ảnh tham chiếu bối cảnh (tuỳ chọn)</label>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <input ref={fileRef} type="file" accept="image/*"
                      onChange={(e) => { if (e.target.files?.[0]) handleUploadRef(e.target.files[0]); }}
                      style={{ display: "none" }} />
                    <button onClick={() => fileRef.current?.click()} disabled={uploadingRef}
                      style={{
                        width: "100%", padding: "10px 0", borderRadius: 10,
                        border: "2px dashed var(--border)", background: "var(--surface)",
                        cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "0.85rem",
                        color: "var(--text-muted)", fontWeight: 600
                      }}>
                      {uploadingRef ? "⏳ Đang upload..." : "🖼️ Chọn ảnh tham chiếu bối cảnh"}
                    </button>
                  </div>
                  {pendingRefUrl && (
                    <img src={pendingRefUrl} alt="ref" style={{
                      width: 72, height: 72, objectFit: "cover", borderRadius: 10,
                      border: "1.5px solid var(--border)", flexShrink: 0,
                    }} />
                  )}
                </div>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>Prompt sinh ảnh (tiếng Anh) *</label>
                <textarea value={form.prompt} onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
                  style={{ ...inp, minHeight: 90, resize: "vertical" }}
                  placeholder="K'Ho highland village at sunrise, traditional wooden stilt houses, morning mist, golden light..." />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                border: "1.5px solid var(--border)", background: "var(--surface)",
                cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-body)"
              }}>Hủy</button>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 2, padding: "11px 0", borderRadius: 10,
                background: saving ? "var(--border)" : "var(--primary)", color: "#fff", border: "none",
                cursor: saving ? "not-allowed" : "pointer", fontWeight: 700,
                fontFamily: "var(--font-body)", fontSize: "0.95rem"
              }}>
                {saving ? "Đang lưu..." : editId ? "Cập nhật" : "Tạo bối cảnh"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
