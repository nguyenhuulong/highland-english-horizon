"use client";

import { useState, useEffect } from "react";
import { showToast } from "@/components/ui/Feedback";
import type { ComicCharacterDTO, ComicBackgroundDTO, ComicStoryDTO, StoryTemplateKey } from "@/types";

interface Props {
  ethnicGroups: { id: string; slug: string; nameVi: string; nameEn: string; emoji: string }[];
  onStoryReady?: (story: ComicStoryDTO, lessonId?: string) => void;
}

const TEMPLATES: {
  key: StoryTemplateKey; nameVi: string; emoji: string; panelCount: number; description: string;
}[] = [
    { key: "INTRO_4", nameVi: "Giới thiệu", emoji: "👋", panelCount: 4, description: "4 panel — nhập môn, bài học đầu tiên về chủ đề" },
    { key: "DIALOGUE_6", nameVi: "Hội thoại", emoji: "💬", panelCount: 6, description: "6 panel — giao tiếp sâu, trao đổi văn hóa" },
    { key: "ADVENTURE_6", nameVi: "Phiêu lưu", emoji: "🌄", panelCount: 6, description: "6 panel — khám phá địa điểm, vượt thử thách" },
    { key: "FESTIVAL_8", nameVi: "Lễ hội", emoji: "🎉", panelCount: 8, description: "8 panel — bài học toàn diện về lễ hội văn hóa" },
  ];

type Step = "setup" | "characters" | "backgrounds" | "generate";

export default function StoryCreator({ ethnicGroups, onStoryReady }: Props) {
  const [step, setStep] = useState<Step>("setup");
  const [topic, setTopic] = useState("");
  const [titleVi, setTitleVi] = useState("");
  const [selectedEthnic, setSelectedEthnic] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplateKey>("DIALOGUE_6");
  const [allChars, setAllChars] = useState<ComicCharacterDTO[]>([]);
  const [allBgs, setAllBgs] = useState<ComicBackgroundDTO[]>([]);
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
  const [selectedBgIds, setSelectedBgIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState("");

  const template = TEMPLATES.find((t) => t.key === selectedTemplate)!;

  useEffect(() => {
    if (step !== "characters" && step !== "backgrounds") return;
    const q = selectedEthnic ? `?ethnicGroupId=${selectedEthnic}` : "";
    Promise.all([
      fetch(`/api/comic/characters${q}`).then((r) => r.json()).catch(() => ({ characters: [] })),
      fetch(`/api/comic/backgrounds${q}`).then((r) => r.json()).catch(() => ({ backgrounds: [] })),
    ]).then(([cd, bd]) => {
      setAllChars(cd.characters ?? []);
      setAllBgs(bd.backgrounds ?? []);
    });
  }, [step, selectedEthnic]);

  function toggleChar(id: string) {
    setSelectedCharIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length < 4 ? [...p, id] : p
    );
  }

  function toggleBg(id: string) {
    setSelectedBgIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length < template.panelCount ? [...p, id] : p
    );
  }

  async function handleGenerate() {
    if (!topic.trim()) { showToast("Nhập mô tả nội dung câu chuyện", "error"); return; }
    if (selectedCharIds.length === 0) { showToast("Chọn ít nhất 1 nhân vật", "error"); return; }

    setGenerating(true);
    setGenStep("Đang tạo bài học trong hệ thống...");

    try {
      const createRes = await fetch("/api/comic/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleVi || topic.slice(0, 80),
          titleEn: topic.slice(0, 80),
          topic,
          templateKey: selectedTemplate,
          ethnicGroupId: selectedEthnic || null,
          characterIds: selectedCharIds,
          backgroundIds: selectedBgIds,
        }),
      });
      if (!createRes.ok) throw new Error("Không thể tạo bài học");
      const { story } = await createRes.json();

      setGenStep("AI đang viết kịch bản truyện tranh...");

      const genRes = await fetch(`/api/comic/stories/${story.id}/generate`, { method: "POST" });
      if (!genRes.ok) {
        const err = await genRes.json();
        throw new Error(err.error || "Lỗi sinh bài học");
      }
      const { story: readyStory, lessonId } = await genRes.json();

      setGenStep("Hoàn thành!");
      showToast(lessonId ? "Bài học đã được xuất bản vào thư viện! 🎉" : "Truyện đã sẵn sàng! 🎉", "success");
      onStoryReady?.(readyStory, lessonId);
      setStep("setup");
      setTopic(""); setTitleVi(""); setSelectedCharIds([]); setSelectedBgIds([]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Lỗi tạo bài học", "error");
    } finally {
      setGenerating(false);
      setGenStep("");
    }
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid var(--border)", background: "var(--surface)",
    color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "0.92rem",
    boxSizing: "border-box",
  };

  const steps: { key: Step; label: string }[] = [
    { key: "setup", label: "1. Nội dung" },
    { key: "characters", label: "2. Nhân vật" },
    { key: "backgrounds", label: "3. Bối cảnh" },
    { key: "generate", label: "4. Tạo bài học" },
  ];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* Step bar */}
      <div style={{ display: "flex", marginBottom: 28, borderRadius: 12, overflow: "hidden", border: "1.5px solid var(--border)" }}>
        {steps.map((s, i) => (
          <button key={s.key}
            onClick={() => { if (s.key !== "generate") setStep(s.key); }}
            disabled={s.key === "generate"}
            style={{
              flex: 1, padding: "12px 8px", border: "none",
              cursor: s.key === "generate" ? "default" : "pointer",
              background: step === s.key ? "var(--primary)" : "var(--surface)",
              color: step === s.key ? "#fff" : "var(--text-muted)",
              fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.82rem",
              borderRight: i < steps.length - 1 ? "1px solid var(--border)" : "none",
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ─── STEP 1: Nội dung ─────────────────────────────────────────────────── */}
      {step === "setup" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Mô tả nội dung câu chuyện *
            </label>
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)}
              style={{ ...inp, minHeight: 110, resize: "vertical" }}
              placeholder={"Ví dụ:\nYa Đin (10 tuổi, K'Ho) theo bà ngoại học dệt thổ cẩm tại nhà sàn. Em học tên các hoa văn truyền thống (hoa văn hươu nai, chim chóc), màu sắc từ cây rừng và ý nghĩa từng hoa văn bằng tiếng Anh. Có cảnh bà giải thích tại sao hoa văn quan trọng với người K'Ho.\n\nMô tả càng chi tiết → AI tạo kịch bản càng hay!"} />
          </div>

          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Tên bài học (để trống AI sẽ tự đặt)
            </label>
            <input value={titleVi} onChange={(e) => setTitleVi(e.target.value)} style={inp}
              placeholder="Tên bài học tiếng Việt — hấp dẫn, không generic" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                Dân tộc
              </label>
              <select value={selectedEthnic} onChange={(e) => setSelectedEthnic(e.target.value)} style={inp}>
                <option value="">-- Chọn dân tộc --</option>
                {ethnicGroups.map((g) => <option key={g.id} value={g.id}>{g.emoji} {g.nameVi}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 10 }}>
              Mẫu cấu trúc *
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10 }}>
              {TEMPLATES.map((t) => (
                <button key={t.key} onClick={() => setSelectedTemplate(t.key)}
                  style={{
                    padding: "14px 12px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                    border: `2px solid ${selectedTemplate === t.key ? "var(--primary)" : "var(--border)"}`,
                    background: selectedTemplate === t.key ? "#fff5f0" : "var(--surface)",
                    fontFamily: "var(--font-body)",
                  }}>
                  <div style={{ fontSize: "1.8rem", marginBottom: 4 }}>{t.emoji}</div>
                  <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text)" }}>{t.nameVi}</div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: 3 }}>{t.description}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => { if (!topic.trim()) { showToast("Nhập mô tả nội dung", "error"); return; } setStep("characters"); }}
            style={{ padding: "13px 0", borderRadius: 12, background: "var(--primary)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 800, fontFamily: "var(--font-body)", fontSize: "1rem" }}>
            Tiếp theo → Chọn nhân vật
          </button>
        </div>
      )}

      {/* ─── STEP 2: Nhân vật ─────────────────────────────────────────────────── */}
      {step === "characters" && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem" }}>Chọn nhân vật *</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 2 }}>
              Đã chọn: {selectedCharIds.length}/4 — các nhân vật sẽ xuất hiện và nói chuyện trong bài học
            </p>
          </div>

          {allChars.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", background: "var(--surface)", borderRadius: 12 }}>
              Chưa có nhân vật nào. Tạo nhân vật trong <strong>Nhân vật truyện tranh</strong> trước.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 12, marginBottom: 20 }}>
              {allChars.map((c) => {
                const sel = selectedCharIds.includes(c.id);
                return (
                  <button key={c.id} onClick={() => toggleChar(c.id)}
                    style={{
                      padding: 0, borderRadius: 14, cursor: "pointer", overflow: "hidden", textAlign: "left",
                      border: `2.5px solid ${sel ? "var(--primary)" : "var(--border)"}`,
                      background: sel ? "#fff5f0" : "var(--bg-card)"
                    }}>
                    <div style={{ height: 130, background: "var(--surface)", position: "relative" }}>
                      {c.characterImageUrl
                        ? <img src={c.characterImageUrl} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>{c.thumbnailEmoji}</div>
                      }
                      {sel && (
                        <div style={{
                          position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%",
                          background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: "0.75rem", fontWeight: 800
                        }}>✓</div>
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
            <button onClick={() => setStep("setup")} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-body)" }}>← Quay lại</button>
            <button onClick={() => { if (selectedCharIds.length === 0) { showToast("Chọn ít nhất 1 nhân vật", "error"); return; } setStep("backgrounds"); }}
              style={{ flex: 2, padding: "12px 0", borderRadius: 10, background: "var(--primary)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 800, fontFamily: "var(--font-body)" }}>
              Tiếp theo → Chọn bối cảnh
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Bối cảnh (không bắt buộc) ───────────────────────────────── */}
      {step === "backgrounds" && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem" }}>
              Chọn bối cảnh <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.85rem" }}>(tùy chọn)</span>
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 2 }}>
              Đã chọn: {selectedBgIds.length}/{template.panelCount} —
              {" "}{selectedBgIds.length === 0 ? "AI sẽ tự sinh ảnh theo mô tả của bạn" : "AI sẽ dùng ảnh bối cảnh đã chọn"}
            </p>
          </div>

          {allBgs.length === 0 ? (
            <div style={{ padding: 28, textAlign: "center", color: "var(--text-muted)", background: "var(--surface)", borderRadius: 12, border: "1.5px dashed var(--border)", marginBottom: 20 }}>
              Không có bối cảnh nào — AI sẽ tự sinh ảnh dựa trên mô tả câu chuyện bạn đã nhập. Không cần lo!
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 12, marginBottom: 20 }}>
              {allBgs.map((b) => {
                const sel = selectedBgIds.includes(b.id);
                return (
                  <button key={b.id} onClick={() => toggleBg(b.id)}
                    style={{
                      padding: 0, borderRadius: 14, cursor: "pointer", overflow: "hidden", textAlign: "left",
                      border: `2.5px solid ${sel ? "var(--primary)" : "var(--border)"}`,
                      background: sel ? "#fff5f0" : "var(--bg-card)"
                    }}>
                    <div style={{ height: 110, background: "var(--surface)", position: "relative" }}>
                      {b.imageUrl
                        ? <img src={b.imageUrl} alt={b.nameVi} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.8rem" }}>{b.thumbnailEmoji}</div>
                      }
                      {sel && (
                        <div style={{
                          position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%",
                          background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: "0.75rem", fontWeight: 800
                        }}>
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
            <button onClick={() => setStep("characters")} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-body)" }}>← Quay lại</button>
            <button onClick={() => setStep("generate")}
              style={{ flex: 2, padding: "12px 0", borderRadius: 10, background: "var(--primary)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 800, fontFamily: "var(--font-body)" }}>
              Tiếp theo → Xem lại &amp; tạo
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 4: Tạo ──────────────────────────────────────────────────────── */}
      {step === "generate" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem" }}>Xem lại và tạo bài học</h3>

          <div style={{ background: "var(--surface)", borderRadius: 14, padding: 18, border: "1.5px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["Mô tả nội dung", topic],
              ["Mẫu", `${template.emoji} ${template.nameVi} (${template.panelCount} panel)`],
              ["Nhân vật", allChars.filter((c) => selectedCharIds.includes(c.id)).map((c) => c.name).join(", ") || "—"],
              ["Bối cảnh", selectedBgIds.length > 0 ? allBgs.filter((b) => selectedBgIds.includes(b.id)).map((b) => b.nameVi).join(", ") : "AI tự sinh theo mô tả"],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: "0.83rem", color: "var(--text-muted)", fontWeight: 700, minWidth: 110, flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: "0.87rem", fontWeight: 600, lineHeight: 1.4 }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff8e7", borderRadius: 12, padding: 14, border: "1.5px solid #f0d080", fontSize: "0.82rem", color: "#7a5c00" }}>
            <strong>⏱ Dự tính:</strong> {template.panelCount} panel × ~20s = khoảng {Math.ceil(template.panelCount * 20 / 60)} phút.
            AI sẽ viết kịch bản có chiều sâu → sinh ảnh từng panel → tạo từ vựng, quiz, nhiệm vụ văn hóa → tự động xuất bản vào thư viện.
          </div>

          {generating && (
            <div style={{ background: "var(--surface)", borderRadius: 14, padding: 28, border: "1.5px solid var(--border)", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, border: "4px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 14px" }} />
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{genStep}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 6 }}>Đừng đóng trang này...</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep("backgrounds")} disabled={generating}
              style={{ flex: 1, padding: "13px 0", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: generating ? "not-allowed" : "pointer", fontWeight: 700, fontFamily: "var(--font-body)" }}>
              ← Quay lại
            </button>
            <button onClick={handleGenerate} disabled={generating}
              style={{ flex: 3, padding: "13px 0", borderRadius: 10, background: generating ? "var(--border)" : "var(--primary)", color: "#fff", border: "none", cursor: generating ? "not-allowed" : "pointer", fontWeight: 800, fontFamily: "var(--font-body)", fontSize: "1rem" }}>
              {generating ? "⏳ Đang tạo bài học..." : "🚀 Tạo và xuất bản bài học!"}
            </button>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  );
}
