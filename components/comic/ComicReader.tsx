"use client";

import { useState, useCallback } from "react";
import type { ComicStoryDTO, ComicStoryPanel } from "@/types";

interface Props {
  story: ComicStoryDTO;
  ethnicEmoji?: string;
}

export default function ComicReader({ story, ethnicEmoji = "🌄" }: Props) {
  const [currentPanel, setCurrentPanel] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [showVocab, setShowVocab] = useState(false);

  const panel: ComicStoryPanel | undefined = story.panels[currentPanel];
  const total = story.panels.length;

  // ── TTS ────────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string, onDone?: () => void) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "en-US";
    utt.rate = 0.85;
    utt.pitch = 1.1;
    // Ưu tiên giọng trẻ em nếu có
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith("en") && (v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Google"))
    );
    if (preferred) utt.voice = preferred;
    utt.onend = () => onDone?.();
    window.speechSynthesis.speak(utt);
  }, []);

  // Đọc lần lượt tất cả dialogue trong panel
  async function playPanel() {
    if (!panel || speaking) return;
    setSpeaking(true);

    for (let i = 0; i < panel.dialogue.length; i++) {
      setSpeakingIdx(i);
      await new Promise<void>((resolve) => {
        speak(panel.dialogue[i].en, resolve);
      });
      await new Promise((r) => setTimeout(r, 300));
    }

    setSpeaking(false);
    setSpeakingIdx(null);
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setSpeakingIdx(null);
  }

  function goPanel(dir: number) {
    stopSpeaking();
    setCurrentPanel((p) => Math.max(0, Math.min(total - 1, p + dir)));
  }

  if (!panel) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
        Truyện chưa có panel nào.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "2rem" }}>{ethnicEmoji}</span>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.3rem", margin: 0 }}>
            {story.title}
          </h2>
          <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{story.titleEn}</div>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowVocab((v) => !v)}
          style={{ padding: "7px 14px", borderRadius: 20, border: "1.5px solid var(--border)",
            background: showVocab ? "var(--primary)" : "var(--surface)",
            color: showVocab ? "#fff" : "var(--text)", cursor: "pointer",
            fontWeight: 700, fontSize: "0.8rem", fontFamily: "var(--font-body)" }}>
          📚 Từ vựng
        </button>
      </div>

      {/* Vocab panel */}
      {showVocab && story.vocabulary.length > 0 && (
        <div style={{ background: "#fffbf0", borderRadius: 14, padding: 16, marginBottom: 16,
          border: "1.5px solid #f0e0a0" }}>
          <div style={{ fontWeight: 800, fontSize: "0.85rem", marginBottom: 10, color: "#7a5c00" }}>
            📚 Từ vựng trong truyện
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {story.vocabulary.map((v, i) => (
              <div key={i} style={{ background: "white", borderRadius: 10, padding: "6px 12px",
                border: "1px solid #f0d080" }}>
                <span style={{ fontWeight: 800, color: "var(--primary)" }}>{v.en}</span>
                <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>—</span>
                <span style={{ fontSize: "0.88rem" }}>{v.vi}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {story.panels.map((_, i) => (
          <button key={i} onClick={() => { stopSpeaking(); setCurrentPanel(i); }}
            style={{ flex: 1, height: 6, borderRadius: 3, border: "none", cursor: "pointer",
              background: i === currentPanel ? "var(--primary)" : i < currentPanel ? "#fdb89a" : "var(--border)",
              transition: "background 0.2s" }} />
        ))}
      </div>

      {/* Panel ảnh */}
      <div style={{ borderRadius: 18, overflow: "hidden", border: "2px solid var(--border)",
        boxShadow: "var(--shadow-lg)", marginBottom: 0, position: "relative" }}>
        {panel.generatedImageUrl ? (
          <img src={panel.generatedImageUrl} alt={`Panel ${currentPanel + 1}`}
            style={{ width: "100%", display: "block", minHeight: 280, objectFit: "cover" }} />
        ) : panel.backgroundImageUrl ? (
          <img src={panel.backgroundImageUrl} alt="background"
            style={{ width: "100%", display: "block", minHeight: 280, objectFit: "cover", opacity: 0.7 }} />
        ) : (
          <div style={{ minHeight: 280, background: "linear-gradient(135deg, #ffecd2, #fcb69f)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "5rem" }}>
            {ethnicEmoji}
          </div>
        )}

        {/* Panel number badge */}
        <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.55)",
          color: "#fff", borderRadius: 20, padding: "3px 12px",
          fontSize: "0.78rem", fontWeight: 800, fontFamily: "var(--font-display)" }}>
          {currentPanel + 1} / {total}
        </div>

        {/* Play / Stop button overlay */}
        <button onClick={speaking ? stopSpeaking : playPanel}
          style={{ position: "absolute", bottom: 12, right: 12,
            width: 44, height: 44, borderRadius: "50%", border: "none",
            background: speaking ? "#ef4444" : "var(--primary)",
            color: "#fff", cursor: "pointer", fontSize: "1.1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
          {speaking ? "⏹" : "▶"}
        </button>
      </div>

      {/* Dialogue bubbles */}
      <div style={{ background: "var(--bg-card)", borderRadius: "0 0 18px 18px",
        border: "2px solid var(--border)", borderTop: "none",
        padding: "14px 18px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        {panel.dialogue.map((d, i) => {
          const isActive = speakingIdx === i;
          const isLeft = i % 2 === 0;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column",
              alignItems: isLeft ? "flex-start" : "flex-end" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)",
                marginBottom: 3, paddingLeft: isLeft ? 4 : 0, paddingRight: isLeft ? 0 : 4 }}>
                {d.characterName}
              </div>
              <div style={{
                maxWidth: "85%", padding: "10px 14px", borderRadius: isLeft ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                background: isActive ? "var(--primary)" : isLeft ? "#fff3ec" : "var(--surface)",
                border: `1.5px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
                transition: "background 0.2s, border-color 0.2s",
                cursor: "pointer",
              }}
                onClick={() => speak(d.en)}>
                {/* Tiếng Anh */}
                <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "1rem",
                  color: isActive ? "#fff" : "var(--text)", lineHeight: 1.4 }}>
                  {d.en}
                </div>
                {/* Transcript tiếng Việt */}
                <div style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem",
                  color: isActive ? "rgba(255,255,255,0.85)" : "var(--text-muted)",
                  marginTop: 4, lineHeight: 1.3 }}>
                  {d.vi}
                </div>
              </div>
            </div>
          );
        })}

        {/* Gợi ý TTS */}
        <div style={{ textAlign: "center", fontSize: "0.74rem", color: "var(--text-muted)", marginTop: 4 }}>
          ▶ nhấn để nghe toàn panel &nbsp;·&nbsp; nhấn vào bong bóng để nghe từng câu
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button onClick={() => goPanel(-1)} disabled={currentPanel === 0}
          style={{ flex: 1, padding: "13px 0", borderRadius: 12,
            border: "1.5px solid var(--border)", background: "var(--surface)",
            cursor: currentPanel === 0 ? "not-allowed" : "pointer",
            opacity: currentPanel === 0 ? 0.4 : 1,
            fontWeight: 800, fontFamily: "var(--font-body)", fontSize: "0.95rem" }}>
          ← Panel trước
        </button>
        <button onClick={() => goPanel(1)} disabled={currentPanel === total - 1}
          style={{ flex: 1, padding: "13px 0", borderRadius: 12,
            background: currentPanel === total - 1 ? "var(--border)" : "var(--primary)",
            color: currentPanel === total - 1 ? "var(--text-muted)" : "#fff",
            border: "none", cursor: currentPanel === total - 1 ? "not-allowed" : "pointer",
            fontWeight: 800, fontFamily: "var(--font-body)", fontSize: "0.95rem" }}>
          Panel tiếp →
        </button>
      </div>
    </div>
  );
}
