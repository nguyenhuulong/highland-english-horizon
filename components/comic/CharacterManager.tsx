"use client";

import { useState, useRef } from "react";
import { showToast } from "@/components/ui/Feedback";
import type { ComicCharacterDTO } from "@/types";

interface Props {
  initialCharacters: ComicCharacterDTO[];
  ethnicGroups: { id: string; slug: string; nameVi: string }[];
}

const emptyForm = {
  name: "", nameEn: "", role: "child", gender: "female",
  ethnicGroupId: "", descriptionVi: "", descriptionEn: "",
  costumePrompt: "", appearancePrompt: "", thumbnailEmoji: "🧒",
};

const ROLES = [
  { value: "child", label: "Trẻ em" },
  { value: "adult", label: "Người lớn" },
  { value: "elder", label: "Người già" },
];

export default function CharacterManager({ initialCharacters, ethnicGroups }: Props) {
  const [chars, setChars] = useState<ComicCharacterDTO[]>(initialCharacters);
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [filterGroup, setFilterGroup] = useState("");
  const [uploadingRef, setUploadingRef] = useState(false);
  const [pendingRefUrl, setPendingRefUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const displayed = filterGroup ? chars.filter((c) => c.ethnicGroupId === filterGroup) : chars;

  function openCreate() {
    setForm({ ...emptyForm });
    setEditId(null);
    setPendingRefUrl(null);
    setShowForm(true);
  }

  function openEdit(c: ComicCharacterDTO) {
    setForm({
      name: c.name, nameEn: c.nameEn, role: c.role, gender: c.gender,
      ethnicGroupId: c.ethnicGroupId ?? "", descriptionVi: c.descriptionVi,
      descriptionEn: c.descriptionEn, costumePrompt: c.costumePrompt,
      appearancePrompt: c.appearancePrompt, thumbnailEmoji: c.thumbnailEmoji,
    });
    setPendingRefUrl(c.referenceImageUrl ?? null);
    setEditId(c.id);
    setShowForm(true);
  }

  async function handleUploadRef(file: File) {
    setUploadingRef(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "character");
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
    if (!form.name || !form.descriptionVi || !form.costumePrompt || !form.appearancePrompt) {
      showToast("Vui lòng điền đầy đủ các trường bắt buộc", "error");
      return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/comic/characters/${editId}` : "/api/comic/characters";
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
      const saved = data.character as ComicCharacterDTO;
      if (editId) {
        setChars((p) => p.map((c) => (c.id === editId ? saved : c)));
        showToast("Đã cập nhật nhân vật", "success");
      } else {
        setChars((p) => [...p, saved]);
        showToast("Đã tạo nhân vật mới", "success");
      }
      setShowForm(false);
    } catch {
      showToast("Lỗi lưu dữ liệu", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Xóa nhân vật "${name}"?`)) return;
    try {
      await fetch(`/api/comic/characters/${id}`, { method: "DELETE" });
      setChars((p) => p.filter((c) => c.id !== id));
      showToast("Đã xóa", "success");
    } catch {
      showToast("Không thể xóa", "error");
    }
  }

  async function handleGenerateSheet(char: ComicCharacterDTO) {
    setGeneratingId(char.id);
    try {
      const res = await fetch("/api/comic/generate-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: char.id }),
      });
      if (!res.ok) throw new Error("Lỗi sinh ảnh");
      const data = await res.json();
      setChars((p) =>
        p.map((c) => (c.id === char.id ? { ...c, characterImageUrl: data.characterImageUrl } : c))
      );
      showToast("Đã sinh ảnh nhân vật!", "success");
    } catch (e) {
      showToast(`Không thể sinh ảnh: ${e instanceof Error ? e.message : "lỗi"}`, "error");
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
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}
          style={{ ...inp, width: "auto" }}>
          <option value="">Tất cả dân tộc</option>
          {ethnicGroups.map((g) => <option key={g.id} value={g.id}>{g.nameVi}</option>)}
        </select>
        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{displayed.length} nhân vật</span>
        <div style={{ flex: 1 }} />
        <button onClick={openCreate} style={{
          background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10,
          padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)",
        }}>+ Tạo nhân vật mới</button>
      </div>

      {displayed.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
          Chưa có nhân vật nào.
        </div>
      )}

      {/* Grid cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {displayed.map((c) => (
          <div key={c.id} style={{
            background: "var(--bg-card)", borderRadius: 16, border: "1.5px solid var(--border)",
            overflow: "hidden", boxShadow: "var(--shadow)",
          }}>
            {/* Ảnh character sheet hoặc reference */}
            <div style={{ height: 200, position: "relative", background: "var(--surface)", overflow: "hidden" }}>
              {c.characterImageUrl ? (
                <img src={c.characterImageUrl} alt={c.name}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : c.referenceImageUrl ? (
                <>
                  <img src={c.referenceImageUrl} alt="reference"
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
                  <div style={{
                    position: "absolute", inset: 0, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "2.5rem"
                  }}>{c.thumbnailEmoji}</div>
                </>
              ) : (
                <div style={{
                  height: "100%", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "4rem"
                }}>{c.thumbnailEmoji}</div>
              )}
              {generatingId === c.id && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(255,255,255,0.85)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8
                }}>
                  <div style={{
                    width: 36, height: 36, border: "3px solid var(--border)",
                    borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite"
                  }} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>AI đang vẽ...</span>
                </div>
              )}
            </div>

            <div style={{ padding: 14 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem" }}>{c.name}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{c.nameEn}</div>
                  <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                    {[c.role, c.gender, ethnicGroups.find((g) => g.id === c.ethnicGroupId)?.nameVi].filter(Boolean).map((tag) => (
                      <span key={tag} style={{
                        background: "var(--surface)", borderRadius: 6,
                        padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600
                      }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                {c.descriptionVi.slice(0, 80)}{c.descriptionVi.length > 80 ? "..." : ""}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 12 }}>
                <button onClick={() => handleGenerateSheet(c)} disabled={generatingId === c.id}
                  style={{
                    padding: "8px 0", borderRadius: 8, border: "none",
                    background: generatingId === c.id ? "var(--border)" : "var(--primary)",
                    color: "#fff", cursor: generatingId === c.id ? "not-allowed" : "pointer",
                    fontWeight: 700, fontSize: "0.78rem", fontFamily: "var(--font-body)",
                    gridColumn: "1 / -1"
                  }}>
                  {generatingId === c.id ? "⏳ Đang sinh..." : c.characterImageUrl ? "🔄 Sinh lại ảnh" : "🎨 Sinh ảnh 2D"}
                </button>
                <button onClick={() => openEdit(c)} style={{
                  padding: "7px 0", borderRadius: 8,
                  border: "1.5px solid var(--border)", background: "var(--surface)",
                  cursor: "pointer", fontWeight: 600, fontSize: "0.78rem", fontFamily: "var(--font-body)"
                }}>
                  ✏️ Sửa
                </button>
                <button onClick={() => handleDelete(c.id, c.name)} style={{
                  padding: "7px 0", borderRadius: 8,
                  border: "1.5px solid #fee2e2", background: "#fff5f5",
                  cursor: "pointer", fontWeight: 600, fontSize: "0.78rem",
                  fontFamily: "var(--font-body)", color: "#dc2626"
                }}>
                  🗑️ Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal form */}
      {showForm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16
        }}>
          <div style={{
            background: "var(--bg-card)", borderRadius: 20, padding: 24,
            maxWidth: 620, width: "100%", maxHeight: "92vh", overflowY: "auto"
          }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.15rem", marginBottom: 18 }}>
              {editId ? "✏️ Sửa nhân vật" : "✨ Tạo nhân vật mới"}
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={lbl}>Tên tiếng Việt *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  style={inp} placeholder="Ya Đin" />
              </div>
              <div>
                <label style={lbl}>Tên tiếng Anh *</label>
                <input value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                  style={inp} placeholder="Ya Din" />
              </div>
              <div>
                <label style={lbl}>Vai trò</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} style={inp}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Giới tính</label>
                <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} style={inp}>
                  <option value="female">Nữ</option>
                  <option value="male">Nam</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Dân tộc</label>
                <select value={form.ethnicGroupId} onChange={(e) => setForm((f) => ({ ...f, ethnicGroupId: e.target.value }))} style={inp}>
                  <option value="">-- Không chọn --</option>
                  {ethnicGroups.map((g) => <option key={g.id} value={g.id}>{g.nameVi}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Emoji đại diện</label>
                <input value={form.thumbnailEmoji} onChange={(e) => setForm((f) => ({ ...f, thumbnailEmoji: e.target.value }))}
                  style={inp} placeholder="🧒" />
              </div>

              {/* Upload ảnh trang phục tham chiếu */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>📸 Ảnh trang phục tham chiếu</label>
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
                      {uploadingRef ? "⏳ Đang upload..." : "🖼️ Chọn ảnh trang phục (JPG/PNG, tối đa 10MB)"}
                    </button>
                    <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: 4 }}>
                      Upload ảnh quần áo truyền thống để AI tham chiếu khi sinh ảnh nhân vật
                    </p>
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
                <label style={lbl}>Mô tả ngoại hình (tiếng Anh, dùng cho AI) *</label>
                <textarea value={form.appearancePrompt}
                  onChange={(e) => setForm((f) => ({ ...f, appearancePrompt: e.target.value }))}
                  style={{ ...inp, minHeight: 60, resize: "vertical" }}
                  placeholder="10-year-old girl, round face, dark brown eyes, black hair in two braids, warm skin tone" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>Mô tả trang phục (tiếng Anh, dùng cho AI) *</label>
                <textarea value={form.costumePrompt}
                  onChange={(e) => setForm((f) => ({ ...f, costumePrompt: e.target.value }))}
                  style={{ ...inp, minHeight: 60, resize: "vertical" }}
                  placeholder="wearing K'Ho traditional red blouse with gold geometric patterns, silver bead necklace, dark blue skirt" />
              </div>
              <div>
                <label style={lbl}>Mô tả (tiếng Việt) *</label>
                <textarea value={form.descriptionVi}
                  onChange={(e) => setForm((f) => ({ ...f, descriptionVi: e.target.value }))}
                  style={{ ...inp, minHeight: 56, resize: "vertical" }}
                  placeholder="Bé gái K'Ho 10 tuổi, vui vẻ, tò mò..." />
              </div>
              <div>
                <label style={lbl}>Description (English)</label>
                <textarea value={form.descriptionEn}
                  onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))}
                  style={{ ...inp, minHeight: 56, resize: "vertical" }}
                  placeholder="10-year-old K'Ho girl, cheerful, curious..." />
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
                {saving ? "Đang lưu..." : editId ? "Cập nhật" : "Tạo nhân vật"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
