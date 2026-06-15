"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { STORIES } from "@/data/stories";
import { useProgress } from "@/lib/hooks";
import type { Badge } from "@/types";

interface ServerBadge { id: string; icon: string; name: string; description: string }

export default function ProgressPage() {
  const { status } = useSession();
  const { getStoryProgress, getStoriesRead, getTotalWords } = useProgress();
  const [serverXP, setServerXP] = useState<number | null>(null);
  const [serverBadges, setServerBadges] = useState<ServerBadge[]>([]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/progress")
      .then((r) => r.json())
      .then((data) => {
        setServerXP(data.xp ?? 0);
        setServerBadges((data.badges || []).map((b: { badge: ServerBadge }) => b.badge));
      })
      .catch(() => {});
  }, [status]);

  const storiesRead = getStoriesRead(STORIES);
  const wordsLearned = getTotalWords(STORIES);
  const gamesPlayed = STORIES.filter(s => {
    const p = getStoryProgress(s.id);
    return p.quizScore !== undefined || p.matchScore !== undefined;
  }).length;

  const stats = [
    { icon: "📖", num: storiesRead, label: "Truyện đã đọc" },
    { icon: "📝", num: wordsLearned, label: "Từ đã học" },
    { icon: "🎮", num: gamesPlayed, label: "Game đã chơi" },
    serverXP != null
      ? { icon: "⭐", num: serverXP, label: "Điểm kinh nghiệm (XP)" }
      : { icon: "🔥", num: 1, label: "Ngày liên tiếp" },
  ];

  const badges: Badge[] = [
    { id: "b1", icon: "🌱", name: "Người mới", earned: storiesRead >= 1 },
    { id: "b2", icon: "📖", name: "Ham đọc", earned: storiesRead >= 2 },
    { id: "b3", icon: "🏆", name: "Hoàn thành", earned: storiesRead >= 3 },
    {
      id: "b4", icon: "🎯", name: "Quiz 100%",
      earned: STORIES.some(s => {
        const p = getStoryProgress(s.id);
        return p.quizScore !== undefined && p.quizTotal !== undefined && p.quizScore === p.quizTotal && p.quizTotal > 0;
      }),
    },
    { id: "b5", icon: "🦋", name: "Rừng thông", earned: !!getStoryProgress("story-002").read },
    { id: "b6", icon: "🎋", name: "Lễ hội K'Ho", earned: !!getStoryProgress("story-001").read },
    { id: "b7", icon: "🛍️", name: "Chợ phiên", earned: !!getStoryProgress("story-003").read },
    { id: "b8", icon: "🌄", name: "Tây Nguyên", earned: storiesRead === 3 && gamesPlayed >= 2 },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <h1 style={{ marginBottom: 8 }}>📊 Tiến độ học tập</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>Theo dõi hành trình học tiếng Anh của bạn.</p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 16, marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "var(--bg-card)", borderRadius: 16, border: "1.5px solid var(--border)", padding: "24px 16px", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: 800, color: "var(--primary)" }}>{s.num}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Learning Map */}
      <h2 style={{ marginBottom: 16, fontSize: "1.3rem" }}>🗺️ Bản đồ khám phá Tây Nguyên</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto", padding: "20px 8px", marginBottom: 32, background: "var(--surface)", borderRadius: 16, border: "1.5px solid var(--border)" }}>
        {STORIES.map((s, i) => {
          const p = getStoryProgress(s.id);
          const done = !!p.read;
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 90 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.6rem", background: done ? "var(--primary)" : "var(--bg-card)", border: `3px solid ${done ? "var(--primary)" : "var(--border)"}`,
                  color: done ? "white" : "inherit", boxShadow: done ? "var(--shadow)" : "none",
                }}>
                  {done ? "✅" : s.emoji}
                </div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, textAlign: "center", color: done ? "var(--primary)" : "var(--text-muted)" }}>{s.title.vi}</div>
              </div>
              {i < STORIES.length - 1 && <div style={{ width: 32, height: 3, background: done ? "var(--primary)" : "var(--border)", borderRadius: 2 }} />}
            </div>
          );
        })}
      </div>

      {/* Story progress */}
      <h2 style={{ marginBottom: 16, fontSize: "1.3rem" }}>📚 Tiến độ từng truyện</h2>
      <div style={{ marginBottom: 32 }}>
        {STORIES.map(s => {
          const p = getStoryProgress(s.id);
          let pct = 0;
          if (p.read) pct = 50;
          if (p.quizScore !== undefined && p.quizTotal) pct = Math.round(50 + (p.quizScore / p.quizTotal) * 50);
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg-card)", marginBottom: 10 }}>
              <span style={{ fontSize: "1.8rem" }}>{s.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  {s.title.vi} <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>— {s.ethnic_culture}</span>
                </div>
                <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden", marginTop: 6 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, var(--primary), var(--accent))", borderRadius: 3, transition: "width 0.6s" }} />
                </div>
                {p.quizScore !== undefined && (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 3 }}>
                    Quiz: {p.quizScore}/{p.quizTotal} câu đúng
                  </div>
                )}
                {p.pronScore !== undefined && (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 3 }}>
                    Phát âm: {p.pronScore}/100
                  </div>
                )}
              </div>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--primary)" }}>{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Badges */}
      <h2 style={{ marginBottom: 16, fontSize: "1.3rem" }}>🏅 Huy hiệu</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 12, marginBottom: serverBadges.length ? 32 : 0 }}>
        {badges.map(b => (
          <div key={b.id} style={{ padding: "16px 12px", textAlign: "center", borderRadius: 16, border: `2px solid ${b.earned ? "var(--accent)" : "var(--border)"}`, background: b.earned ? "#FFFDE7" : "var(--bg-card)", opacity: b.earned ? 1 : 0.4, transition: "all 0.2s" }}>
            <div style={{ fontSize: "2.2rem", marginBottom: 6 }}>{b.icon}</div>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text)" }}>{b.name}</div>
            {b.earned && <div style={{ fontSize: "0.7rem", color: "#2E7D32", fontWeight: 700, marginTop: 2 }}>Đã nhận</div>}
          </div>
        ))}
      </div>

      {serverBadges.length > 0 && (
        <>
          <h2 style={{ marginBottom: 16, fontSize: "1.3rem" }}>🏆 Huy hiệu hệ thống</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 12 }}>
            {serverBadges.map(b => (
              <div key={b.id} title={b.description} style={{ padding: "16px 12px", textAlign: "center", borderRadius: 16, border: "2px solid var(--accent)", background: "#FFFDE7" }}>
                <div style={{ fontSize: "2.2rem", marginBottom: 6 }}>{b.icon}</div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text)" }}>{b.name}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
