import Link from "next/link";
import type { Story, StoryProgress } from "@/types";

const LEVEL_LABELS: Record<number, string> = { 1: "🌱 Starter", 2: "🌿 Basic", 3: "🌳 Intermediate" };
const LEVEL_CLASSES: Record<number, { bg: string; color: string }> = {
  1: { bg: "#E8F5E9", color: "#4CAF50" },
  2: { bg: "#FFF3E0", color: "#FF9800" },
  3: { bg: "#F3E5F5", color: "#9C27B0" },
};

interface Props {
  story: Story;
  progress: StoryProgress;
}

export default function StoryCard({ story, progress }: Props) {
  const levelStyle = LEVEL_CLASSES[story.level];
  const pct = progress.read
    ? progress.quizScore != null && progress.quizTotal
      ? Math.round((progress.quizScore / progress.quizTotal) * 100)
      : 50
    : 0;

  return (
    <Link
      href={`/reader?id=${story.id}`}
      style={{
        display: "block", textDecoration: "none", color: "inherit",
        background: "var(--bg-card)", borderRadius: 16,
        border: "1.5px solid var(--border)", boxShadow: "var(--shadow)",
        overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s",
      }}
      className="story-card-link"
    >
      {/* Thumbnail */}
      <div
        style={{
          height: 180, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "5rem", position: "relative",
          background: `linear-gradient(135deg, ${story.color}22, ${story.color}44)`,
        }}
      >
        <span className="animate-float">{story.emoji}</span>
        {progress.read && (
          <span
            style={{
              position: "absolute", top: 10, right: 10,
              background: "#2E7D32", color: "white",
              padding: "3px 8px", borderRadius: 10, fontSize: "0.72rem", fontWeight: 700,
            }}
          >
            ✓ Đã đọc
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ ...levelStyle, padding: "3px 10px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 700 }}>
            {LEVEL_LABELS[story.level]}
          </span>
          <span
            style={{
              background: "var(--surface)", color: "var(--primary)",
              border: "1px solid var(--border)", padding: "3px 10px",
              borderRadius: 20, fontSize: "0.78rem", fontWeight: 700,
            }}
          >
            {story.ethnic_culture}
          </span>
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, marginBottom: 4 }}>
          {story.title.vi}
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8, fontStyle: "italic" }}>
          {story.title.en}
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-light)", lineHeight: 1.5 }}>
          {story.description_vi}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderTop: "1px solid var(--border)",
        }}
      >
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
          📝 {story.vocabulary.length} từ vựng
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 60, height: 5, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "var(--primary)", borderRadius: 3, transition: "width 0.5s" }} />
          </div>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)" }}>{pct}%</span>
        </div>
      </div>
    </Link>
  );
}
