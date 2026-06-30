"use client";

import { useState } from "react";
import { spawnConfetti } from "@/components/ui/Feedback";
import type { CulturalMission } from "@/types";

export default function CulturalMissionCard({
  mission, lessonId, onComplete,
}: { mission: CulturalMission; lessonId: string; onComplete: (correct: boolean) => void }) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const select = (id: string, correct?: boolean) => {
    if (chosen) return;
    setChosen(id);
    setDone(true);
    if (correct) spawnConfetti();
    fetch("/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, missionId: mission.id, correct: !!correct }),
    }).catch(() => { });
    onComplete(!!correct);
  };

  return (
    <div style={{ padding: 18, background: "var(--surface)", borderRadius: 14, border: "1.5px solid var(--border)" }}>
      <div style={{ fontWeight: 800, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
        🧭 {mission.title}
      </div>
      <p style={{ fontSize: "0.9rem", color: "var(--text-light)", marginBottom: 14 }}>{mission.prompt}</p>

      {mission.type === "select" && mission.options && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          {mission.options.map((opt) => {
            let bg = "var(--bg-card)";
            let border = "var(--border)";
            if (done) {
              if (opt.correct) { bg = "#E8F5E9"; border = "#2E7D32"; }
              else if (opt.id === chosen) { bg = "#FFEBEE"; border = "#F44336"; }
            }
            return (
              <div key={opt.id} onClick={() => select(opt.id, opt.correct)}
                style={{ padding: 14, borderRadius: 10, border: `2px solid ${border}`, background: bg, cursor: done ? "default" : "pointer", textAlign: "center", fontWeight: 700, transition: "all 0.2s" }}>
                {opt.emoji && <div style={{ fontSize: "1.6rem", marginBottom: 4 }}>{opt.emoji}</div>}
                {opt.label}
              </div>
            );
          })}
        </div>
      )}

      {mission.type === "info" && (
        <button onClick={() => select("info", true)} disabled={done} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "var(--secondary)", color: "white", fontWeight: 700, cursor: done ? "default" : "pointer", fontFamily: "var(--font-body)" }}>
          {done ? "✅ Đã khám phá" : "Khám phá ngay"}
        </button>
      )}

      {done && mission.fact && (
        <div style={{ marginTop: 14, padding: 12, background: "var(--bg-card)", borderRadius: 10, fontSize: "0.85rem", color: "var(--text-light)", border: "1px dashed var(--border)" }}>
          💡 {mission.fact}
        </div>
      )}
    </div>
  );
}
