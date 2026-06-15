"use client";

import { useState, useCallback } from "react";
import { showToast } from "@/components/ui/Feedback";
import type { CreatorPanel, CreatorDialogue } from "@/types";

import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function CreatorPage() {
  const session = await auth();

  if (
    !session ||
    !["TEACHER", "ADMIN", "SUPER_ADMIN"].includes(
      session.user.role
    )
  ) {
    redirect("/login");
  }

  return <CreatorEditor />;
}

function CreatorEditor() {
  const [titleVi, setTitleVi] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [level, setLevel] = useState(1);
  const [ethnic, setEthnic] = useState("K'Ho");
  const [vocabRaw, setVocabRaw] = useState("");
  const [panels, setPanels] = useState<CreatorPanel[]>([
    { id: 1, scene: "", dialogues: [{ char: "", vi: "", en: "" }] },
  ]);

  const addPanel = () =>
    setPanels(prev => [...prev, { id: prev.length + 1, scene: "", dialogues: [{ char: "", vi: "", en: "" }] }]);

  const removePanel = (idx: number) =>
    setPanels(prev => prev.filter((_, i) => i !== idx));

  const updatePanel = useCallback((idx: number, field: "scene", value: string) => {
    setPanels(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }, []);

  const addDialogue = (panelIdx: number) =>
    setPanels(prev => prev.map((p, i) => i === panelIdx ? { ...p, dialogues: [...p.dialogues, { char: "", vi: "", en: "" }] } : p));

  const updateDialogue = (panelIdx: number, dIdx: number, field: keyof CreatorDialogue, value: string) =>
    setPanels(prev => prev.map((p, i) => i === panelIdx
      ? { ...p, dialogues: p.dialogues.map((d, di) => di === dIdx ? { ...d, [field]: value } : d) }
      : p
    ));

  const exportStory = () => {
    const vocab = vocabRaw.split("\n").filter(l => l.includes("|")).map(l => {
      const [en, vi] = l.split("|").map(s => s.trim());
      return { en, vi };
    });
    const story = {
      id: "story-custom-" + Date.now(),
      title: { vi: titleVi || "Truyện mới", en: titleEn || "New Story" },
      level, ethnic_culture: ethnic,
      color: "#888888", emoji: "📖",
      description_vi: "",
      vocabulary: vocab,
      panels: panels.map(p => ({
        id: p.id, bg: "#FFF8F0", scene: p.scene,
        dialogue: p.dialogues.filter(d => d.en).map(d => ({ character: d.char, vi: d.vi, en: d.en })),
      })),
      quiz: [],
    };
    const blob = new Blob([JSON.stringify(story, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${story.id}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast("✅ Đã xuất file JSON thành công!", "success");
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
      <h1 style={{ marginBottom: 8 }}>✏️ Tự sáng tác truyện</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 32 }}>
        Dành cho giáo viên — tạo truyện tranh song ngữ phù hợp văn hóa địa phương. Không cần biết lập trình!
      </p>

      {/* Metadata */}
      <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1.5px solid var(--border)", padding: 24, marginBottom: 20 }}>
        <h2 style={{ marginBottom: 20, fontSize: "1.2rem" }}>📋 Thông tin truyện</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FormGroup label="Tên truyện (tiếng Việt)">
            <input className="form-input" style={inputStyle} value={titleVi} onChange={e => setTitleVi(e.target.value)} placeholder="Ví dụ: Ngày hội của làng" />
          </FormGroup>
          <FormGroup label="Tên truyện (tiếng Anh)">
            <input className="form-input" style={inputStyle} value={titleEn} onChange={e => setTitleEn(e.target.value)} placeholder="The Village Festival" />
          </FormGroup>
          <FormGroup label="Cấp độ">
            <select style={inputStyle} value={level} onChange={e => setLevel(parseInt(e.target.value))}>
              <option value={1}>🌱 Starter (Dễ)</option>
              <option value={2}>🌿 Basic (Trung bình)</option>
              <option value={3}>🌳 Intermediate (Khó hơn)</option>
            </select>
          </FormGroup>
          <FormGroup label="Dân tộc">
            <select style={inputStyle} value={ethnic} onChange={e => setEthnic(e.target.value)}>
              {["K'Ho", "Mạ", "M'Nông", "H'Mông", "Tày", "Nùng"].map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </FormGroup>
        </div>
        <FormGroup label="Từ vựng mục tiêu (mỗi dòng: tiếng Anh | tiếng Việt)" style={{ marginTop: 16 }}>
          <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} value={vocabRaw} onChange={e => setVocabRaw(e.target.value)} placeholder={"festival | lễ hội\nvillage | làng\ntraditional | truyền thống"} />
        </FormGroup>
      </div>

      {/* Panels */}
      <h2 style={{ marginBottom: 16, fontSize: "1.2rem" }}>📄 Các trang truyện</h2>
      {panels.map((panel, pi) => (
        <div key={pi} style={{ background: "var(--surface)", borderRadius: 16, padding: 20, marginBottom: 16, border: "2px dashed var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3>Trang {panel.id}</h3>
            {pi > 0 && (
              <button onClick={() => removePanel(pi)} style={{ padding: "6px 14px", borderRadius: 8, background: "#FFEBEE", color: "#F44336", border: "none", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-body)" }}>✕ Xóa</button>
            )}
          </div>
          <FormGroup label="Mô tả cảnh (emoji hoặc mô tả ngắn)">
            <input style={inputStyle} value={panel.scene} onChange={e => updatePanel(pi, "scene", e.target.value)} placeholder="Ví dụ: Buổi sáng trong làng 🌅" />
          </FormGroup>
          {panel.dialogues.map((d, di) => (
            <div key={di} style={{ background: "var(--bg)", borderRadius: 10, padding: 14, marginBottom: 10, border: "1px solid var(--border)" }}>
              <FormGroup label="Nhân vật">
                <input style={inputStyle} value={d.char} onChange={e => updateDialogue(pi, di, "char", e.target.value)} placeholder="Tên nhân vật" />
              </FormGroup>
              <FormGroup label="Lời thoại tiếng Việt">
                <input style={inputStyle} value={d.vi} onChange={e => updateDialogue(pi, di, "vi", e.target.value)} placeholder="Nhập lời thoại..." />
              </FormGroup>
              <FormGroup label="Lời thoại tiếng Anh">
                <input style={inputStyle} value={d.en} onChange={e => updateDialogue(pi, di, "en", e.target.value)} placeholder="Enter dialogue in English..." />
              </FormGroup>
            </div>
          ))}
          <button onClick={() => addDialogue(pi)} style={{ padding: "7px 15px", borderRadius: 8, background: "var(--surface)", color: "var(--text)", border: "1.5px solid var(--border)", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-body)" }}>+ Thêm lời thoại</button>
        </div>
      ))}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={addPanel} style={{ padding: "12px 24px", borderRadius: 10, background: "var(--surface)", color: "var(--text)", border: "2px solid var(--border)", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-body)" }}>
          + Thêm trang mới
        </button>
        <button onClick={exportStory} style={{ padding: "12px 24px", borderRadius: 10, background: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "1rem", fontFamily: "var(--font-body)" }}>
          💾 Xuất file JSON
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 15px", borderRadius: 10,
  border: "2px solid var(--border)", background: "var(--bg-card)", color: "var(--text)",
  fontFamily: "var(--font-body)", fontSize: "0.95rem", outline: "none",
};

function FormGroup({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ marginBottom: 12, ...style }}>
      <label style={{ display: "block", fontWeight: 700, marginBottom: 6, fontSize: "0.9rem", color: "var(--text-light)" }}>{label}</label>
      {children}
    </div>
  );
}
