"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useProgress } from "@/lib/hooks";
import { lessonToStory } from "@/lib/lesson";
import type { LessonDTO, Story } from "@/types";

interface ServerBadge { id: string; icon: string; name: string; description: string }
interface LeaderboardEntry { rank: number; id: string; name: string; avatar: string; xp: number; streak: number; ethnicGroup: string | null }

export default function ProgressPage() {
  const { status, data: session } = useSession();
  const { getStoryProgress, getStoriesRead, getTotalWords } = useProgress();

  const [stories, setStories] = useState<Story[]>([]);
  const [serverXP, setServerXP] = useState<number | null>(null);
  const [serverStreak, setServerStreak] = useState<number>(0);
  const [serverBadges, setServerBadges] = useState<ServerBadge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lessons")
      .then((r) => r.json())
      .then((data) => {
        const lessons: LessonDTO[] = data.lessons || [];
        setStories(lessons.map(lessonToStory));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/leaderboard?limit=10")
      .then((r) => r.json())
      .then((data) => setLeaderboard(data.leaderboard || []))
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/progress")
      .then((r) => r.json())
      .then((data) => {
        setServerXP(data.xp ?? 0);
        setServerStreak(data.streak ?? 0);
        setServerBadges((data.badges || []).map((b: { badge: ServerBadge }) => b.badge));
      })
      .catch(() => { });
  }, [status]);

  const isGuest = status !== "authenticated";
  const storiesRead = getStoriesRead(stories);
  const wordsLearned = getTotalWords(stories);
  const gamesPlayed = stories.filter((s) => {
    const p = getStoryProgress(s.id);
    return p.quizScore !== undefined || p.matchScore !== undefined;
  }).length;

  const stats = [
    { icon: "📖", num: storiesRead, label: "Truyện đã đọc" },
    { icon: "📝", num: wordsLearned, label: "Từ đã học" },
    { icon: "🎮", num: gamesPlayed, label: "Game đã chơi" },
    !isGuest && serverXP != null
      ? { icon: "⭐", num: serverXP, label: "Điểm kinh nghiệm (XP)" }
      : { icon: "🔥", num: serverStreak, label: "Ngày liên tiếp" },
  ];

  if (loading) {
    return <div style={{ padding: 60, textAlign: "center" }}>⏳ Đang tải...</div>;
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <h1 style={{ marginBottom: 8 }}>📊 Tiến độ học tập</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
        {isGuest ? "Đăng nhập để lưu tiến độ và xếp hạng cùng các bạn khác." : "Theo dõi hành trình học tiếng Anh của bạn."}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 16, marginBottom: 32 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "var(--bg-card)", borderRadius: 16, border: "1.5px solid var(--border)", padding: "24px 16px", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: 800, color: "var(--primary)" }}>{s.num}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {stories.length > 0 && (
        <>
          <h2 style={{ marginBottom: 16, fontSize: "1.3rem" }}>📚 Tiến độ từng truyện</h2>
          <div style={{ marginBottom: 32 }}>
            {stories.map((s) => {
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
        </>
      )}

      {!isGuest && serverBadges.length > 0 && (
        <>
          <h2 style={{ marginBottom: 16, fontSize: "1.3rem" }}>🏆 Huy hiệu</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 12, marginBottom: 32 }}>
            {serverBadges.map((b) => (
              <div key={b.id} title={b.description} style={{ padding: "16px 12px", textAlign: "center", borderRadius: 16, border: "2px solid var(--accent)", background: "#FFFDE7" }}>
                <div style={{ fontSize: "2.2rem", marginBottom: 6 }}>{b.icon}</div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text)" }}>{b.name}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 style={{ marginBottom: 16, fontSize: "1.3rem" }}>🏅 Bảng xếp hạng</h2>
      {leaderboard.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", background: "var(--bg-card)", borderRadius: 14, border: "1.5px solid var(--border)" }}>
          Chưa có dữ liệu xếp hạng.
        </div>
      ) : (
        <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1.5px solid var(--border)", overflow: "hidden" }}>
          {leaderboard.map((u) => {
            const isMe = session?.user?.id === u.id;
            return (
              <div
                key={u.id}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "12px 18px",
                  borderBottom: "1px solid var(--border)",
                  background: isMe ? "#fff3ec" : "transparent",
                }}
              >
                <div style={{ width: 28, textAlign: "center", fontWeight: 800, color: u.rank <= 3 ? "var(--primary)" : "var(--text-muted)" }}>
                  {u.rank === 1 ? "🥇" : u.rank === 2 ? "🥈" : u.rank === 3 ? "🥉" : u.rank}
                </div>
                <span style={{ fontSize: "1.5rem" }}>{u.avatar}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>
                    {u.name} {isMe && <span style={{ color: "var(--primary)", fontSize: "0.78rem" }}>(bạn)</span>}
                  </div>
                  {u.ethnicGroup && <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>{u.ethnicGroup}</div>}
                </div>
                {u.streak > 0 && <span style={{ fontSize: "0.8rem", color: "#f59e0b", fontWeight: 700 }}>🔥{u.streak}</span>}
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--primary)" }}>{u.xp} XP</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
