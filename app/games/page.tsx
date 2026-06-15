"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
// import { STORIES } from "@/data/stories";
import { useProgress, useSettings, useTTS } from "@/lib/hooks";
import { lessonToStory } from "@/lib/lesson";
import { spawnConfetti, showToast } from "@/components/ui/Feedback";
import type { Story, GameMode, LessonDTO } from "@/types";

// ---- Match Game ----
interface MatchItem { en: string; vi: string; matched: boolean }
interface SelectedItem { type: "en" | "vi"; en: string; vi: string }

function MatchGame({ story, onSave }: { story: Story; onSave: (score: number) => void }) {
  const { settings } = useSettings();
  const { speak } = useTTS(settings.ttsEnabled);
  const vocab = story.vocabulary.slice(0, 6);
  const [pairs, setPairs] = useState<MatchItem[]>(vocab.map(v => ({ en: v.en, vi: v.vi, matched: false })));
  const [shuffledVi] = useState(() => [...vocab].sort(() => Math.random() - 0.5));
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const matchedEnSet = new Set(pairs.filter(p => p.matched).map(p => p.en));
  const matchedViSet = new Set(pairs.filter(p => p.matched).map(p => p.vi));

  const select = useCallback((type: "en" | "vi", en: string, vi: string) => {
    if (matchedEnSet.has(en)) return;
    if (!selected) {
      setSelected({ type, en, vi });
      if (type === "en") speak(en);
    } else {
      if (selected.type === type) {
        setSelected({ type, en, vi });
        if (type === "en") speak(en);
        return;
      }
      const enVal = type === "vi" ? selected.en : en;
      const viVal = type === "en" ? selected.vi : vi;
      const pair = pairs.find(p => p.en === enVal);
      if (pair && pair.vi === viVal) {
        speak(enVal);
        const newScore = score + 1;
        setPairs(prev => prev.map(p => p.en === enVal ? { ...p, matched: true } : p));
        setScore(newScore);
        setSelected(null);
        if (newScore === vocab.length) {
          onSave(newScore);
          setTimeout(() => { spawnConfetti(); showToast("🎉 Xuất sắc! Bạn ghép đúng tất cả!", "success"); }, 400);
        }
      } else {
        setWrong(enVal + viVal);
        setTimeout(() => { setWrong(null); setSelected(null); }, 600);
      }
    }
  }, [selected, pairs, score, vocab.length, speak, matchedEnSet, onSave]);

  const reset = () => {
    setPairs(vocab.map(v => ({ en: v.en, vi: v.vi, matched: false })));
    setSelected(null); setWrong(null); setScore(0);
  };

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, marginBottom: 8 }}>🔗 Ghép đôi từ vựng</div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Nối từ tiếng Anh với nghĩa tiếng Việt</div>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--primary)" }}>{score}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Ghép đúng</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-muted)" }}>{vocab.length}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Tổng số</div>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pairs.map(p => {
            const isSelected = selected?.type === "en" && selected.en === p.en;
            const isWrong = wrong?.startsWith(p.en);
            return (
              <div key={p.en} onClick={() => !p.matched && select("en", p.en, p.vi)}
                style={{ padding: "14px 18px", borderRadius: 10, border: `2px solid ${p.matched ? "#2E7D32" : isWrong ? "#F44336" : isSelected ? "var(--primary)" : "var(--border)"}`, background: p.matched ? "#E8F5E9" : isWrong ? "#FFEBEE" : isSelected ? "var(--surface)" : "var(--bg-card)", cursor: p.matched ? "default" : "pointer", fontWeight: 700, textAlign: "center", transition: "all 0.2s", color: p.matched ? "#2E7D32" : "var(--primary)", animation: isWrong ? "shake 0.3s" : undefined }}>
                🔊 {p.en}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {shuffledVi.map(v => {
            const isMatched = matchedViSet.has(v.vi);
            const isSelected = selected?.type === "vi" && selected.vi === v.vi;
            const isWrong = wrong?.endsWith(v.vi) && !wrong.startsWith(pairs.find(p=>p.vi===v.vi)?.en || "___");
            return (
              <div key={v.vi} onClick={() => !isMatched && select("vi", v.en, v.vi)}
                style={{ padding: "14px 18px", borderRadius: 10, border: `2px solid ${isMatched ? "#2E7D32" : isSelected ? "var(--secondary)" : "var(--border)"}`, background: isMatched ? "#E8F5E9" : isSelected ? "#E8F5E9" : "var(--bg-card)", cursor: isMatched ? "default" : "pointer", fontWeight: 700, textAlign: "center", transition: "all 0.2s", color: isMatched ? "#2E7D32" : "var(--secondary)" }}>
                {v.vi}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <button onClick={reset} style={{ padding: "10px 24px", borderRadius: 10, border: "2px solid var(--primary)", background: "transparent", color: "var(--primary)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>🔄 Chơi lại</button>
      </div>
    </div>
  );
}

// ---- Quiz Game ----
function QuizGame({ story, onSave }: { story: Story; onSave: (score: number, total: number) => void }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const answer = useCallback((chosen: number) => {
    if (answered !== null) return;
    setAnswered(chosen);
    const correct = story.quiz[idx].answer;
    const ns = chosen === correct ? score + 1 : score;
    setTimeout(() => {
      if (idx + 1 >= story.quiz.length) {
        setFinalScore(ns); onSave(ns, story.quiz.length); setDone(true);
        if (ns === story.quiz.length) spawnConfetti();
      } else { setScore(ns); setIdx(i => i + 1); setAnswered(null); }
    }, 900);
  }, [answered, idx, score, story, onSave]);

  const reset = () => { setIdx(0); setScore(0); setAnswered(null); setDone(false); setFinalScore(0); };

  const q = story.quiz[idx];
  const stars = finalScore === story.quiz.length ? 3 : finalScore >= story.quiz.length / 2 ? 2 : 1;

  return (
    <div>
      {done ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "4rem", marginBottom: 16 }}>{"⭐".repeat(stars)}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, marginBottom: 8 }}>
            {finalScore === story.quiz.length ? "Hoàn hảo! 🎉" : "Giỏi lắm! 👏"}
          </div>
          <div style={{ color: "var(--text-muted)", marginBottom: 28 }}>
            Đúng <strong style={{ color: "var(--primary)", fontSize: "1.2rem" }}>{finalScore}/{story.quiz.length}</strong> câu
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={reset} style={{ padding: "10px 22px", borderRadius: 10, border: "2px solid var(--primary)", background: "transparent", color: "var(--primary)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>🔄 Chơi lại</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ textAlign: "center", marginBottom: 8, fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700 }}>Câu {idx + 1}/{story.quiz.length} · Điểm: {score}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700, textAlign: "center", marginBottom: 28 }}>{q.question_en}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {q.options.map((opt, i) => {
              let bg = "var(--bg-card)", border = "var(--border)", color = "var(--text)";
              if (answered !== null) {
                if (i === q.answer) { bg = "#E8F5E9"; border = "#2E7D32"; color = "#2E7D32"; }
                else if (i === answered) { bg = "#FFEBEE"; border = "#F44336"; color = "#F44336"; }
              }
              return (
                <div key={i} onClick={() => answer(i)}
                  style={{ padding: 16, borderRadius: 10, border: `2px solid ${border}`, background: bg, cursor: answered === null ? "pointer" : "default", fontWeight: 600, textAlign: "center", transition: "all 0.2s", fontSize: "0.95rem", color }}>
                  {opt}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ---- Main Games Page ----
function GamesInner() {
  const searchParams = useSearchParams();
  const storyId = searchParams.get("story");
  const modeParam = searchParams.get("mode") as GameMode | null;

  const [allStories, setAllStories] = useState<Story[]>([]);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [mode, setMode] = useState<GameMode>(modeParam || "match");
  const [key, setKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const { saveMatchScore, saveQuizScore } = useProgress();

  useEffect(() => {
    let mounted = true;

    fetch("/api/lessons")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;

        const lessons: LessonDTO[] = data.lessons || [];

        const stories = lessons
          .filter(
            (l) =>
              l.vocabulary?.length &&
              l.quiz?.length &&
              l.panels?.length
          )
          .map(lessonToStory);

        setAllStories(stories);

        if (stories.length === 0) {
          setCurrentStory(null);
          return;
        }

        if (storyId) {
          const found = stories.find((s) => s.id === storyId);
          setCurrentStory(found || stories[0]);
        } else {
          setCurrentStory(stories[0]);
        }
      })
      .catch((err) => {
        console.error("Failed to load lessons:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [storyId]);

  const changeStory = (id: string) => {
    const story = allStories.find((s) => s.id === id);

    if (story) {
      setCurrentStory(story);
      setKey((k) => k + 1);
    }
  };

  const changeMode = (m: GameMode) => {
    setMode(m);
    setKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
        }}
      >
        ⏳ Đang tải bài học...
      </div>
    );
  }

  if (!currentStory) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
        }}
      >
        📚 Chưa có bài học nào
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "32px 24px",
      }}
    >
      <h1 style={{ marginBottom: 24 }}>
        🎮 Trò chơi từ vựng
      </h1>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <select
          value={currentStory.id}
          onChange={(e) => changeStory(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "2px solid var(--border)",
            background: "var(--bg-card)",
            color: "var(--text)",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {allStories.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title.vi}
            </option>
          ))}
        </select>

        <div
          style={{
            display: "flex",
            border: "2px solid var(--border)",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {(["match", "quiz"] as GameMode[]).map((m) => (
            <button
              key={m}
              onClick={() => changeMode(m)}
              style={{
                padding: "10px 20px",
                background:
                  mode === m ? "var(--primary)" : "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                color:
                  mode === m
                    ? "white"
                    : "var(--text-muted)",
                fontFamily: "var(--font-body)",
                transition: "all 0.2s",
              }}
            >
              {m === "match"
                ? "🔗 Ghép đôi"
                : "📝 Đố vui"}
            </button>
          ))}
        </div>
      </div>

      <div
        key={key}
        style={{
          background: "var(--bg-card)",
          borderRadius: 16,
          border: "1.5px solid var(--border)",
          boxShadow: "var(--shadow)",
          padding: 32,
        }}
      >
        {mode === "match" ? (
          <MatchGame
            story={currentStory}
            onSave={(score) =>
              saveMatchScore(currentStory.id, score)
            }
          />
        ) : (
          <QuizGame
            story={currentStory}
            onSave={(score, total) =>
              saveQuizScore(
                currentStory.id,
                score,
                total
              )
            }
          />
        )}
      </div>
    </div>
  );
}

export default function GamesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>⏳ Đang tải...</div>}>
      <GamesInner />
    </Suspense>
  );
}
