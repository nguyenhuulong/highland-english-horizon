"use client";

import { useState, useEffect } from "react";
import { showToast } from "@/components/ui/Feedback";
import type { Panel, ComicCharacterDTO, ComicBackgroundDTO } from "@/types";
import { Background, Character, resolveBackground } from "./ComicAssets";

interface PanelImageGeneratorProps {
  panel: Panel & { characters?: string[]; backgroundKey?: string; characterAction?: string; generatedImageUrl?: string };
  panelIndex: number;
  lessonId?: string;
  ethnicCulture: string;
  onImageGenerated: (imageUrl: string) => void;
}

const BG_OPTIONS = [
  "morning_village","forest_entrance","big_tree","market_morning","cloth_stall",
  "vegetable_stall","bargain","harvest","costume","drum","dance","birds","butterfly","festival_ground",
];

export default function PanelImageGenerator({
  panel, panelIndex, lessonId, ethnicCulture, onImageGenerated,
}: PanelImageGeneratorProps) {
  const [characters, setCharacters] = useState<ComicCharacterDTO[]>([]);
  const [backgrounds, setBackgrounds] = useState<ComicBackgroundDTO[]>([]);
  const [selectedChars, setSelectedChars] = useState<string[]>(panel.characters ?? []);
  const [selectedBg, setSelectedBg] = useState(panel.backgroundKey ?? panel.scene ?? "morning_village");
  const [action, setAction] = useState(panel.characterAction ?? panel.dialogue.map((d) => d.en).join(". ").slice(0, 100));
  const [imageUrl, setImageUrl] = useState<string | null>(panel.generatedImageUrl ?? null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/comic/characters").then((r) => r.json()).catch(() => ({ characters: [] })),
      fetch("/api/comic/backgrounds").then((r) => r.json()).catch(() => ({ backgrounds: [] })),
    ]).then(([c, b]) => {
      setCharacters(c.characters ?? []);
      setBackgrounds(b.backgrounds ?? []);
    });
  }, []);

  function toggleChar(name: string) {
    setSelectedChars((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/comic/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          panelId: panel.id,
          lessonId,
          characterNames: selectedChars,
          backgroundKey: selectedBg,
          action,
          ethnicCulture,
          saveToPanel: !!lessonId,
        }),
      });
      if (!res.ok) throw new Error("Lỗi");
      const data = await res.json();
      setImageUrl(data.imageUrl);
      onImageGenerated(data.imageUrl);
    } catch {
      showToast("Không thể sinh ảnh. Thử lại sau.", "error");
    } finally {
      setGenerating(false);
    }
  }

  const bgType = resolveBackground(selectedBg);
  const ethnicSlug = ethnicCulture.toLowerCase().replace(/[^a-z]/g, "");
  const panelChars = characters.filter((c) => selectedChars.includes(c.name));

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "7px 10px", borderRadius: 8,
    border: "1.5px solid var(--border)", background: "var(--surface)",
    color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "0.82rem",
    boxSizing: "border-box",
  };

  return (
    <div style={{ border: "1.5px solid var(--border)", borderRadius: 14, overflow: "hidden", background: "var(--bg-card)" }}>
      <div style={{ position: "relative", height: 200, background: panel.bg }}>
        {imageUrl ? (
          <img src={imageUrl} alt={`panel-${panelIndex}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <Background type={bgType} />
            {panelChars.length > 0 ? (
              panelChars.map((c, i) => {
                const pos = panelChars.length === 1 ? "center" : i === 0 ? "left" : "right";
                return <Character key={c.id} ethnicGroup={ethnicSlug} role={c.role as "child"|"adult"|"elder"} gender={c.gender as "male"|"female"} position={pos as "left"|"center"|"right"} />;
              })
            ) : (
              <Character ethnicGroup={ethnicSlug} role="child" position="center" />
            )}
          </div>
        )}
        {generating && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
            <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>AI đang vẽ...</span>
          </div>
        )}
        <span style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.5)", color: "white", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800 }}>
          {panelIndex + 1}
        </span>
      </div>

      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>Nhân vật xuất hiện</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {characters.length === 0 && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Chưa có nhân vật trong DB</span>}
            {characters.map((c) => (
              <button key={c.id} onClick={() => toggleChar(c.name)}
                style={{
                  padding: "3px 10px", borderRadius: 20, border: "1.5px solid",
                  borderColor: selectedChars.includes(c.name) ? "var(--primary)" : "var(--border)",
                  background: selectedChars.includes(c.name) ? "var(--primary)" : "var(--surface)",
                  color: selectedChars.includes(c.name) ? "white" : "var(--text-muted)",
                  cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, fontFamily: "var(--font-body)",
                }}>
                {c.thumbnailEmoji} {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>Bối cảnh</div>
          <select value={selectedBg} onChange={(e) => setSelectedBg(e.target.value)} style={inputStyle}>
            {backgrounds.length > 0
              ? backgrounds.map((b) => <option key={b.key} value={b.key}>{b.thumbnailEmoji} {b.nameVi}</option>)
              : BG_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)
            }
          </select>
        </div>

        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>Mô tả hành động (EN)</div>
          <input value={action} onChange={(e) => setAction(e.target.value)} style={inputStyle} placeholder="child is talking to elder near the house" />
        </div>

        <button onClick={handleGenerate} disabled={generating}
          style={{
            padding: "8px 0", borderRadius: 8, border: "none",
            background: generating ? "var(--border)" : "var(--primary)", color: "white",
            cursor: generating ? "not-allowed" : "pointer", fontWeight: 700,
            fontFamily: "var(--font-body)", fontSize: "0.85rem",
          }}>
          {generating ? "⏳ Đang sinh ảnh..." : "🎨 Sinh ảnh AI"}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
