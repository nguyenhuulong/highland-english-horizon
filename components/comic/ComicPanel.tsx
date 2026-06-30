"use client";

import { useState } from "react";
import type { Panel, ComicCharacterDTO, ComicBackgroundDTO } from "@/types";
import { Background, Character, resolveBackground } from "./ComicAssets";
import { showToast } from "@/components/ui/Feedback";

interface ComicPanelProps {
  panel: Panel & {
    characters?: string[];
    backgroundKey?: string;
    generatedImageUrl?: string;
    characterAction?: string;
  };
  characters: ComicCharacterDTO[];
  backgrounds: ComicBackgroundDTO[];
  ethnicCulture: string;
  lessonId?: string;
  isTeacherMode?: boolean;
}

export default function ComicPanel({
  panel,
  characters,
  backgrounds,
  ethnicCulture,
  lessonId,
  isTeacherMode,
}: ComicPanelProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(panel.generatedImageUrl ?? null);
  const [generating, setGenerating] = useState(false);

  const panelChars = characters.filter((c) =>
    (panel.characters ?? []).some((name) => name === c.name)
  );
  const bgKey = panel.backgroundKey ?? panel.scene;
  const bgType = resolveBackground(bgKey);
  const ethnicSlug = ethnicCulture.toLowerCase().replace(/[^a-z]/g, "");

  async function handleGenerate() {
    setGenerating(true);
    try {
      const action =
        (panel as { characterAction?: string }).characterAction ??
        panel.dialogue.map((d) => d.en).join(". ").slice(0, 120);
      const res = await fetch("/api/comic/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          panelId: panel.id,
          lessonId,
          characterNames: panel.characters ?? panelChars.map((c) => c.name),
          backgroundKey: bgKey,
          action,
          ethnicCulture,
          saveToPanel: !!lessonId,
        }),
      });
      if (!res.ok) throw new Error("Lỗi sinh ảnh");
      const data = await res.json();
      setImageUrl(data.imageUrl);
    } catch {
      showToast("Không thể sinh ảnh. Thử lại sau.", "error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div style={{ position: "relative", width: "100%", minHeight: 280, background: panel.bg, overflow: "hidden" }}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Panel ${panel.id}`}
          style={{ width: "100%", minHeight: 280, objectFit: "cover", display: "block" }}
          onError={() => setImageUrl(null)}
        />
      ) : (
        <div style={{ position: "relative", width: "100%", height: 280 }}>
          <Background type={bgType} />
          {panelChars.length > 0 ? (
            panelChars.map((char, i) => {
              const positions: Array<"left" | "center" | "right"> = panelChars.length === 1
                ? ["center"]
                : panelChars.length === 2
                ? ["left", "right"]
                : ["left", "center", "right"];
              return (
                <Character
                  key={char.id}
                  ethnicGroup={ethnicSlug}
                  role={char.role as "child" | "adult" | "elder"}
                  gender={char.gender as "male" | "female"}
                  position={positions[i] ?? "center"}
                  speaking={i === 0}
                />
              );
            })
          ) : (
            <Character ethnicGroup={ethnicSlug} role="child" position="center" />
          )}
        </div>
      )}

      {generating && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(255,255,255,0.85)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            border: "4px solid var(--border)", borderTopColor: "var(--primary)",
            animation: "spin 0.8s linear infinite",
          }} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600 }}>
            AI đang vẽ...
          </span>
        </div>
      )}

      {isTeacherMode && !generating && !imageUrl && (
        <button
          onClick={handleGenerate}
          style={{
            position: "absolute", bottom: 10, right: 10,
            background: "var(--primary)", color: "white",
            border: "none", borderRadius: 10, padding: "7px 14px",
            fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
            fontFamily: "var(--font-body)", boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          🎨 Sinh ảnh AI
        </button>
      )}

      {isTeacherMode && !generating && imageUrl && (
        <button
          onClick={handleGenerate}
          title="Sinh lại ảnh"
          style={{
            position: "absolute", top: 10, right: 10,
            background: "rgba(0,0,0,0.45)", color: "white",
            border: "none", borderRadius: 8, padding: "5px 10px",
            fontSize: "0.78rem", cursor: "pointer", fontFamily: "var(--font-body)",
          }}
        >
          🔄 Vẽ lại
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
