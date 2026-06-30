"use client";

import { useState, useEffect } from "react";
import { showToast } from "@/components/ui/Feedback";
import type {
  ComicCharacterDTO,
  ComicBackgroundDTO,
  ComicStoryDTO,
  StoryTemplateKey,
} from "@/types";

interface Props {
  ethnicGroups: { id: string; slug: string; nameVi: string; nameEn: string; emoji: string }[];
  onStoryReady?: (story: ComicStoryDTO) => void;
}

const TEMPLATES: {
  key: StoryTemplateKey;
  nameVi: string;
  emoji: string;
  panelCount: number;
  description: string;
}[] = [
  { key: "INTRO_4", nameVi: "Giới thiệu", emoji: "👋", panelCount: 4, description: "4 panel — nhập môn, phù hợp bài học đầu tiên" },
  { key: "DIALOGUE_6", nameVi: "Hội thoại", emoji: "💬", panelCount: 6, description: "6 panel — tập trung giao tiếp, hỏi đáp" },
  { key: "ADVENTURE_6", nameVi: "Phiêu lưu", emoji: "🌄", panelCount: 6, description: "6 panel — khám phá địa điểm, vượt thử thách" },
  { key: "FESTIVAL_8", nameVi: "Lễ hội", emoji: "🎉", panelCount: 8, description: "8 panel — lễ hội văn hóa dân tộc, nhiều hoạt động" },
];

type Step = "setup" | "characters" | "backgrounds" | "generate";

export default function StoryCreator({ ethnicGroups, onStoryReady }: Props) {
  const [step, setStep] = useState<Step>("setup");
  const [topic, setTopic] = useState("");
  const [titleVi, setTitleVi] = useState("");
  const [selectedEthnic, setSelectedEthnic] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplateKey>("INTRO_4");
  const [allChars, setAllChars] = useState<ComicCharacterDTO[]>([]);
  const [allBgs, setAllBgs] = useState<ComicBackgroundDTO[]>([]);
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
  const [selectedBgIds, setSelectedBgIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState("");

  const template = TEMPLATES.find((t) => t.key === selectedTemplate)!;

  useEffect(() => {
    if (step === "characters" || step === "backgrounds") {
      Promise.all([
        fetch(selectedEthnic ? `/api/comic/characters?ethnicGroupId=${selectedEthnic}` : "/api/comic/characters")
          .then((r) => r.json()).catch(() => ({ characters: [] })),
        fetch(selectedEthnic ? `/api/comic/backgrounds?ethnicGroupId=${selectedEthnic}` : "/api/comic/backgrounds")
          .then((r) => r.json()).catch(() => ({ backgrounds: [] })),
      ]).then(([cd, bd]) => {
        setAllChars(cd.characters ?? []);
        setAllBgs(bd.backgrounds ?? []);
      });
    }
  }, [step, selectedEthnic]);

  function toggleChar(id: string) {
    setSelectedCharIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length < 4 ? [...p, id] : p
    );
  }

  function toggleBg(id: string) {
    const needed = template.panelCount;
    setSelectedBgIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length < needed ? [...p, id] : p
    );
  }

  async function handleGenerate() {
    if (!topic.trim()) { showToast("Nhập chủ đề truyện", "error"); return; }
    if (selectedCharIds.length === 0) { showToast("Chọn ít nhất 1 nhân vật", "error"); return; }
    if (selectedBgIds.length === 0) { showToast("Chọn ít nhất 1 bối cảnh", "error"); return; }

    setGenerating(true);
    setGeneratingStep("Đang tạo truyện trong database...");

    try {
      // 1. Tạo story record
      const createRes = await fetch("/api/comic/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleVi || topic,
          titleEn: topic,
          topic,
          templateKey: selectedTemplate,
          ethnicGroupId: selectedEthnic || null,
          characterIds: selectedCharIds,
          backgroundIds: selectedBgIds,
        }),
      });
      if (!createRes.ok) throw new Error("Không thể tạo truyện");
      const { story } = await createRes.json();

      setGeneratingStep("LLM đang viết kịch bản...");

      // 2. Gen toàn bộ (LLM script + images)
      const genRes = await fetch(`/api/comic/stories/${story.id}/generate`, {
        method: "POST",
      });
      if (!genRes.ok) {
        const err = await genRes.json();
        throw new Error(err.error || "Lỗi sinh truyện");
      }
      const { story: readyStory } = await genRes.json();

      setGeneratingStep("Hoàn thành!");
      showToast("Truyện đã sẵn sàng! 🎉", "success");
      onStoryReady?.(readyStory);
      setStep("setup");
      setTopic("");
      setTitleVi("");
      setSelectedCharIds([]);
      setSelectedBgIds([]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Lỗi tạo truyện", "error");
    } finally {
      setGenerating(false);
      setGeneratingStep("");
    }
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid var(--border)", background: "var(--surface)",
    color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "0.92rem",
    boxSizing: "border-box",
  };

  // ── Step indicator ───────────────────────────────────────────────────────────
  const steps: { key: Step; label: string }[] = [
    { key: "setup", label: "1. Thiết lập" },
    { key: "characters", label: "2. Nhân vật" },
    { key: "backgrounds", label: "3. Bối cảnh" },
    { key: "generate", label: "4. Tạo truyện" },
  ];

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      {/* Step bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 28, borderRadius: 12,
        overflow: "hidden", border: "1.5px solid var(--border)" }}>
        {steps.map((s, i) => (
          <button key={s.key} onClick={() => { if (s.key !== "generate") setStep(s.key); }}
            disabled={s.key === "generate"}
            style={{
              flex: 1, padding: "12px 8px", border: "none", cursor: s.key === "generate" ? "default" : "pointer",
              background: step === s.key ? "var(--primary)" : "var(--surface)",
              color: step === s.key ? "#fff" : "var(--text-muted)",
              fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.82rem",
              borderRight: i < steps.length - 1 ? "1px solid var(--border)" : "none",
              transition: "background 0.2s",
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── STEP 1: Thiết lập ─────────────────────────────────────────────────── */}
      {step === "setup" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Chủ đề truyện *
            </label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} style={inp}
              placeholder="vd: Đi chợ phiên, Lễ hội cồng chiêng, Hái rau rừng..." />
          </div>
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Tên truyện (tuỳ chọn)
            </label>
            <input value={titleVi} onChange={(e) => setTitleVi(e.target.value)} style={inp}
              placeholder="Tên truyện tiếng Việt (để trống AI sẽ tự đặt)" />
          </div>
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Dân tộc
            </label>
            <select value={selectedEthnic} onChange={(e) => setSelectedEthnic(e.target.value)} style={inp}>
              <option value="">-- Chọn dân tộc (lọc nhân vật/bối cảnh) --</option>
              {ethnicGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.emoji} {g.nameVi}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 10 }}>
              Chọn template *
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10 }}>
              {TEMPLATES.map((t) => (
                <button key={t.key} onClick={() => setSelectedTemplate(t.key)}
                  style={{
                    padding: "14px 12px", borderRadius: 12, cursor: "pointer",
                    border: `2px solid ${selectedTemplate === t.key ? "var(--primary)" : "var(--border)"}`,
                    background: selectedTemplate === t.key ? "#fff5f0" : "var(--surface)",
                    textAlign: "left", fontFamily: "var(--font-body)",
                  }}>
                  <div style={{ fontSize: "1.8rem", marginBottom: 4 }}>{t.emoji}</div>
                  <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text)" }}>{t.nameVi}</div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: 3 }}>{t.description}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => { if (!topic.trim()) { showToast("Nhập chủ đề truyện", "error"); return; } setStep("characters"); }}
            style={{ padding: "13px 0", borderRadius: 12, background: "var(--primary)", color: "#fff",
              border: "none", cursor: "pointer", fontWeight: 800, fontFamily: "var(--font-body)", fontSize: "1rem" }}>
            Tiếp theo → Chọn nhân vật
          </button>
        </div>
      )}

      {/* ── STEP 2: Chọn nhân vật ─────────────────────────────────────────────── */}
      {step === "characters" && (
        <div>
          <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem" }}>
                Chọn nhân vật xuất hiện trong truyện
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 2 }}>
                Đã chọn: {selectedCharIds.length}/4 nhân vật (tối đa 4)
              </p>
            </div>
          </div>

          {allChars.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
              Chưa có nhân vật nào. Hãy tạo nhân vật trong mục <strong>Nhân vật truyện tranh</strong> trước.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
              {allChars.map((c) => {
                const selected = selectedCharIds.includes(c.id);
                return (
                  <button key={c.id} onClick={() => toggleChar(c.id)}
                    style={{
                      padding: 0, borderRadius: 14, cursor: "pointer", overflow: "hidden",
                      border: `2.5px solid ${selected ? "var(--primary)" : "var(--border)"}`,
                      background: selected ? "#fff5f0" : "var(--bg-card)",
                      transition: "border-color 0.15s", textAlign: "left",
                    }}>
                    <div style={{ height: 130, background: "var(--surface)", position: "relative" }}>
                      {c.characterImageUrl ? (
                        <img src={c.characterImageUrl} alt={c.name}
                          style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : (
                        <div style={{ height: "100%", display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: "3rem" }}>{c.thumbnailEmoji}</div>
                      )}
                      {selected && (
                        <div style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22,
                          borderRadius: "50%", background: "var(--primary)", color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.75rem", fontWeight: 800 }}>✓</div>
                      )}
                    </div>
                    <div style={{ padding: "8px 10px" }}>
                      <div style={{ fontWeight: 800, fontSize: "0.85rem" }}>{c.name}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{c.role}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep("setup")} style={{ flex: 1, padding: "12px 0", borderRadius: 10,
              border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer",
              fontWeight: 700, fontFamily: "var(--font-body)" }}>← Quay lại</button>
            <button onClick={() => { if (selectedCharIds.length === 0) { showToast("Chọn ít nhất 1 nhân vật", "error"); return; } setStep("backgrounds"); }}
              style={{ flex: 2, padding: "12px 0", borderRadius: 10, background: "var(--primary)", color: "#fff",
                border: "none", cursor: "pointer", fontWeight: 800, fontFamily: "var(--font-body)" }}>
              Tiếp theo → Chọn bối cảnh
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Chọn bối cảnh ─────────────────────────────────────────────── */}
      {step === "backgrounds" && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem" }}>
              Chọn bối cảnh cho truyện
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 2 }}>
              Đã chọn: {selectedBgIds.length}/{template.panelCount} bối cảnh (tối đa {template.panelCount} — 1 per panel, LLM sẽ tự phân phối)
            </p>
          </div>

          {allBgs.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
              Chưa có bối cảnh nào. Hãy tạo bối cảnh trong mục <strong>Bối cảnh truyện tranh</strong> trước.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
              {allBgs.map((b) => {
                const selected = selectedBgIds.includes(b.id);
                return (
                  <button key={b.id} onClick={() => toggleBg(b.id)}
                    style={{
                      padding: 0, borderRadius: 14, cursor: "pointer", overflow: "hidden",
                      border: `2.5px solid ${selected ? "var(--primary)" : "var(--border)"}`,
                      background: selected ? "#fff5f0" : "var(--bg-card)",
                      transition: "border-color 0.15s", textAlign: "left",
                    }}>
                    <div style={{ height: 110, background: "var(--surface)", position: "relative" }}>
                      {b.imageUrl ? (
                        <img src={b.imageUrl} alt={b.nameVi}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ height: "100%", display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: "2.8rem" }}>{b.thumbnailEmoji}</div>
                      )}
                      {selected && (
                        <div style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22,
                          borderRadius: "50%", background: "var(--primary)", color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.75rem", fontWeight: 800 }}>
                          {selectedBgIds.indexOf(b.id) + 1}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "8px 10px" }}>
                      <div style={{ fontWeight: 800, fontSize: "0.82rem" }}>{b.nameVi}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{b.nameEn}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep("characters")} style={{ flex: 1, padding: "12px 0", borderRadius: 10,
              border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer",
              fontWeight: 700, fontFamily: "var(--font-body)" }}>← Quay lại</button>
            <button onClick={() => { if (selectedBgIds.length === 0) { showToast("Chọn ít nhất 1 bối cảnh", "error"); return; } setStep("generate"); }}
              style={{ flex: 2, padding: "12px 0", borderRadius: 10, background: "var(--primary)", color: "#fff",
                border: "none", cursor: "pointer", fontWeight: 800, fontFamily: "var(--font-body)" }}>
              Tiếp theo → Xem lại & tạo
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Tạo truyện ────────────────────────────────────────────────── */}
      {step === "generate" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem" }}>
            Xem lại và tạo truyện
          </h3>

          {/* Summary */}
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: 18,
            border: "1.5px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700 }}>Chủ đề</span>
              <span style={{ fontSize: "0.9rem", fontWeight: 800 }}>{topic}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700 }}>Template</span>
              <span style={{ fontSize: "0.9rem", fontWeight: 800 }}>
                {TEMPLATES.find((t) => t.key === selectedTemplate)?.emoji}{" "}
                {TEMPLATES.find((t) => t.key === selectedTemplate)?.nameVi}{" "}
                ({template.panelCount} panel)
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700 }}>Nhân vật</span>
              <span style={{ fontSize: "0.9rem", fontWeight: 800 }}>
                {allChars.filter((c) => selectedCharIds.includes(c.id)).map((c) => c.name).join(", ")}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700 }}>Bối cảnh</span>
              <span style={{ fontSize: "0.9rem", fontWeight: 800 }}>
                {allBgs.filter((b) => selectedBgIds.includes(b.id)).map((b) => b.nameVi).join(", ")}
              </span>
            </div>
          </div>

          <div style={{ background: "#fff8e7", borderRadius: 12, padding: 14,
            border: "1.5px solid #f0d080", fontSize: "0.82rem", color: "#7a5c00" }}>
            <strong>⏱ Ước tính thời gian:</strong> {template.panelCount} panel × ~15–30s = {Math.round(template.panelCount * 20 / 60)} phút.
            Hệ thống sẽ: (1) LLM viết kịch bản → (2) sinh ảnh từng panel bằng Replicate FLUX-dev → (3) lưu vào Supabase.
          </div>

          {generating && (
            <div style={{ background: "var(--surface)", borderRadius: 14, padding: 24,
              border: "1.5px solid var(--border)", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, border: "4px solid var(--border)",
                borderTopColor: "var(--primary)", borderRadius: "50%",
                animation: "spin 0.9s linear infinite", margin: "0 auto 14px" }} />
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>{generatingStep}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 6 }}>
                Đừng đóng trang này trong khi đang tạo...
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep("backgrounds")} disabled={generating}
              style={{ flex: 1, padding: "13px 0", borderRadius: 10,
                border: "1.5px solid var(--border)", background: "var(--surface)",
                cursor: generating ? "not-allowed" : "pointer", fontWeight: 700, fontFamily: "var(--font-body)" }}>
              ← Quay lại
            </button>
            <button onClick={handleGenerate} disabled={generating}
              style={{ flex: 3, padding: "13px 0", borderRadius: 10,
                background: generating ? "var(--border)" : "var(--primary)", color: "#fff",
                border: "none", cursor: generating ? "not-allowed" : "pointer",
                fontWeight: 800, fontFamily: "var(--font-body)", fontSize: "1rem" }}>
              {generating ? "⏳ Đang tạo truyện..." : "🚀 Tạo truyện ngay!"}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
