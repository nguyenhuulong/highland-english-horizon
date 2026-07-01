"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useProgress, useSettings, useTTS } from "@/lib/hooks";
import { lessonToStory } from "@/lib/lesson";
import { spawnConfetti, showToast } from "@/components/ui/Feedback";
import type { Story, GameMode, LessonDTO } from "@/types";

// ─── Shared helpers ────────────────────────────────────────────────────────────
function XPBadge({ xp }: { xp: number }) {
  if (!xp) return null;
  return (
    <span style={{ display: "inline-block", marginLeft: 8, padding: "2px 10px", borderRadius: 20, background: "#fff3", color: "#fff", fontSize: "0.78rem", fontWeight: 800 }}>
      +{xp} XP
    </span>
  );
}

function ProgressBar({ value, max, color = "var(--primary)" }: { value: number; max: number; color?: string }) {
  return (
    <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, (value / max) * 100)}%`, background: color, borderRadius: 3, transition: "width 0.4s ease" }} />
    </div>
  );
}

function TimerBar({ seconds, total, onEnd }: { seconds: number; total: number; onEnd: () => void }) {
  const [left, setLeft] = useState(() => seconds);
  const leftRef = useRef(seconds);
  const onEndRef = useRef(onEnd);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);

  useEffect(() => {
    leftRef.current = seconds;
    const id = setInterval(() => {
      leftRef.current -= 1;
      if (leftRef.current <= 0) { clearInterval(id); setLeft(0); onEndRef.current(); return; }
      setLeft(leftRef.current);
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);
  const pct = (left / total) * 100;
  const color = pct > 50 ? "#22c55e" : pct > 25 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ position: "relative", marginBottom: 16 }}>
      <div style={{ height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 1s linear" }} />
      </div>
      <span style={{ position: "absolute", right: 0, top: -18, fontSize: "0.78rem", fontWeight: 800, color }}>{left}s</span>
    </div>
  );
}

function ScoreBoard({ current, best, label }: { current: number; best: number; label: string }) {
  return (
    <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 20 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, color: "var(--primary)" }}>{current}</div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
      </div>
      {best > 0 && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, color: "var(--text-muted)" }}>🏆 {best}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Kỷ lục</div>
        </div>
      )}
    </div>
  );
}

// ─── 1. FLIPCARD (nâng cấp từ MatchGame cũ) ───────────────────────────────────
interface FlipCard { id: string; text: string; type: "en" | "vi"; pairId: number; matched: boolean; flipped: boolean; }

function FlipCardGame({ story, bestScore, onSave }: { story: Story; bestScore: number; onSave: (score: number, timeLeft: number) => void }) {
  const { settings } = useSettings();
  const { speak } = useTTS(settings.ttsEnabled);
  const vocab = story.vocabulary.slice(0, 8);
  const TIMER = 90;

  function makeCards(): FlipCard[] {
    const cards: FlipCard[] = [];
    vocab.forEach((v, i) => {
      cards.push({ id: `en-${i}`, text: v.en, type: "en", pairId: i, matched: false, flipped: false });
      cards.push({ id: `vi-${i}`, text: v.vi, type: "vi", pairId: i, matched: false, flipped: false });
    });
    return cards.sort(() => Math.random() - 0.5);
  }

  const [cards, setCards] = useState<FlipCard[]>(makeCards);
  const [selected, setSelected] = useState<FlipCard | null>(null);
  const [locked, setLocked] = useState(false);
  const [matched, setMatched] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [timeKey, setTimeKey] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER);
  const timeRef = useRef(TIMER);

  useEffect(() => { timeRef.current = TIMER; }, [timeKey]);

  const handleTimeout = useCallback(() => {
    setTimedOut(true);
    onSave(matched, 0);
  }, [matched, onSave]);

  function tick() { timeRef.current = Math.max(0, timeRef.current - 1); setTimeLeft(timeRef.current); }

  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timeKey]);

  function click(card: FlipCard) {
    if (locked || card.matched || card.flipped) return;
    speak(card.type === "en" ? card.text : "");
    const newCards = cards.map((c) => c.id === card.id ? { ...c, flipped: true } : c);
    setCards(newCards);
    if (!selected) { setSelected(card); return; }
    if (selected.id === card.id) { setSelected(null); return; }
    setLocked(true);
    if (selected.pairId === card.pairId && selected.type !== card.type) {
      speak(card.type === "en" ? card.text : selected.text);
      const next = newCards.map((c) => c.pairId === card.pairId ? { ...c, matched: true } : c);
      setCards(next);
      const newMatched = matched + 1;
      setMatched(newMatched);
      setSelected(null);
      setLocked(false);
      if (newMatched === vocab.length) {
        spawnConfetti();
        onSave(newMatched, timeRef.current);
      }
    } else {
      setTimeout(() => {
        setCards((prev) => prev.map((c) => (c.id === card.id || c.id === selected.id) ? { ...c, flipped: false } : c));
        setSelected(null);
        setLocked(false);
      }, 900);
    }
  }

  function reset() {
    setCards(makeCards());
    setSelected(null); setLocked(false); setMatched(0); setTimedOut(false);
    setTimeKey((k) => k + 1); setTimeLeft(TIMER); timeRef.current = TIMER;
  }

  const done = matched === vocab.length;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, marginBottom: 4 }}>🃏 Lật thẻ ghi nhớ</div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Lật 2 thẻ có cùng nghĩa — EN ↔ VI</div>
      </div>

      {!done && !timedOut && (
        <TimerBar key={timeKey} seconds={TIMER} total={TIMER} onEnd={handleTimeout} />
      )}

      <ScoreBoard current={matched} best={bestScore} label="Cặp đúng" />

      {(done || timedOut) ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>{done ? "🎉" : "⏰"}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, marginBottom: 8 }}>
            {done ? "Xuất sắc!" : "Hết giờ!"}
          </div>
          <div style={{ color: "var(--text-muted)", marginBottom: 20 }}>Ghép đúng {matched}/{vocab.length} cặp{done && ` — còn ${timeLeft}s`}</div>
          <button onClick={reset} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>🔄 Chơi lại</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {cards.map((c) => (
            <div key={c.id} onClick={() => click(c)}
              style={{
                aspectRatio: "1/1.1", borderRadius: 12, cursor: c.matched || c.flipped ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
                padding: 8, fontSize: "0.82rem", fontWeight: 700, transition: "all 0.25s",
                border: `2.5px solid ${c.matched ? "#22c55e" : c.flipped ? "var(--primary)" : "var(--border)"}`,
                background: c.matched ? "#dcfce7" : c.flipped ? (c.type === "en" ? "#eff6ff" : "#fdf4ff") : "var(--surface)",
                color: c.matched ? "#166534" : c.flipped ? (c.type === "en" ? "#1d4ed8" : "#7c3aed") : "transparent",
                boxShadow: c.flipped && !c.matched ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
                transform: c.flipped || c.matched ? "scale(1)" : "scale(0.97)",
              }}>
              {(c.flipped || c.matched) ? c.text : "?"}
            </div>
          ))}
        </div>
      )}

      {!done && !timedOut && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={reset} style={{ padding: "8px 20px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 600, fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>🔄 Bắt đầu lại</button>
        </div>
      )}
    </div>
  );
}

// ─── 2. MATCH (giữ lại bản cũ, cải tiến XP) ──────────────────────────────────
function MatchGame({ story, bestScore, onSave }: { story: Story; bestScore: number; onSave: (score: number) => void }) {
  const { settings } = useSettings();
  const { speak } = useTTS(settings.ttsEnabled);
  const vocab = story.vocabulary.slice(0, 6);
  type MatchItem = { en: string; vi: string; matched: boolean };
  type Sel = { type: "en" | "vi"; en: string; vi: string };
  const [pairs, setPairs] = useState<MatchItem[]>(vocab.map((v) => ({ en: v.en, vi: v.vi, matched: false })));
  const [shuffledVi] = useState(() => [...vocab].sort(() => Math.random() - 0.5));
  const [selected, setSelected] = useState<Sel | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const matchedEnSet = new Set(pairs.filter((p) => p.matched).map((p) => p.en));
  const matchedViSet = new Set(pairs.filter((p) => p.matched).map((p) => p.vi));

  const select = useCallback((type: "en" | "vi", en: string, vi: string) => {
    if (matchedEnSet.has(en)) return;
    if (!selected) { setSelected({ type, en, vi }); if (type === "en") speak(en); return; }
    if (selected.type === type) { setSelected({ type, en, vi }); if (type === "en") speak(en); return; }
    const enVal = type === "vi" ? selected.en : en;
    const viVal = type === "en" ? selected.vi : vi;
    const pair = pairs.find((p) => p.en === enVal);
    if (pair && pair.vi === viVal) {
      speak(enVal);
      const ns = score + 1;
      setPairs((prev) => prev.map((p) => p.en === enVal ? { ...p, matched: true } : p));
      setScore(ns); setSelected(null);
      if (ns === vocab.length) { onSave(ns); setTimeout(() => { spawnConfetti(); showToast("🎉 Xuất sắc! Ghép đúng tất cả!", "success"); }, 300); }
    } else {
      setWrong(enVal + viVal);
      setTimeout(() => { setWrong(null); setSelected(null); }, 600);
    }
  }, [selected, pairs, score, vocab.length, speak, matchedEnSet, onSave]);

  const reset = () => { setPairs(vocab.map((v) => ({ en: v.en, vi: v.vi, matched: false }))); setSelected(null); setWrong(null); setScore(0); };

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, marginBottom: 4 }}>🔗 Ghép đôi từ vựng</div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Nối từ tiếng Anh với nghĩa tiếng Việt</div>
      </div>
      <ScoreBoard current={score} best={bestScore} label="Ghép đúng" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {pairs.map((p) => {
            const isSel = selected?.type === "en" && selected.en === p.en;
            const isWr = wrong?.startsWith(p.en);
            return (
              <div key={p.en} onClick={() => !p.matched && select("en", p.en, p.vi)}
                style={{ padding: "13px 16px", borderRadius: 10, border: `2px solid ${p.matched ? "#22c55e" : isWr ? "#ef4444" : isSel ? "var(--primary)" : "var(--border)"}`, background: p.matched ? "#dcfce7" : isWr ? "#fef2f2" : isSel ? "#eff6ff" : "var(--bg-card)", cursor: p.matched ? "default" : "pointer", fontWeight: 700, textAlign: "center", color: p.matched ? "#166534" : "var(--primary)", transition: "all 0.15s" }}>
                🔊 {p.en}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {shuffledVi.map((v) => {
            const isM = matchedViSet.has(v.vi);
            const isSel = selected?.type === "vi" && selected.vi === v.vi;
            return (
              <div key={v.vi} onClick={() => !isM && select("vi", v.en, v.vi)}
                style={{ padding: "13px 16px", borderRadius: 10, border: `2px solid ${isM ? "#22c55e" : isSel ? "var(--secondary)" : "var(--border)"}`, background: isM ? "#dcfce7" : isSel ? "#f0fdf4" : "var(--bg-card)", cursor: isM ? "default" : "pointer", fontWeight: 700, textAlign: "center", color: isM ? "#166534" : "var(--secondary)", transition: "all 0.15s" }}>
                {v.vi}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <button onClick={reset} style={{ padding: "9px 22px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 600, fontFamily: "var(--font-body)" }}>🔄 Chơi lại</button>
      </div>
    </div>
  );
}

// ─── 3. QUIZ (thêm timer + streak) ───────────────────────────────────────────
function QuizGame({ story, bestScore, onSave }: { story: Story; bestScore: number; onSave: (score: number, total: number) => void }) {
  const TIMER_PER_Q = 15;
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [final, setFinal] = useState(0);
  const [timerKey, setTimerKey] = useState(0);

  const finish = useCallback((ns: number) => {
    setFinal(ns); onSave(ns, story.quiz.length); setDone(true);
    if (ns === story.quiz.length) spawnConfetti();
  }, [story.quiz.length, onSave]);

  const next = useCallback((ns: number, nStreak: number) => {
    setTimeout(() => {
      const ni = idx + 1;
      if (ni >= story.quiz.length) { finish(ns); }
      else { setScore(ns); setStreak(nStreak); setIdx(ni); setAnswered(null); setTimerKey((k) => k + 1); }
    }, 900);
  }, [idx, story.quiz.length, finish]);

  const answer = useCallback((chosen: number) => {
    if (answered !== null) return;
    setAnswered(chosen);
    const correct = story.quiz[idx].answer;
    const isRight = chosen === correct;
    const ns = isRight ? score + 1 : score;
    const nStreak = isRight ? streak + 1 : 0;
    if (nStreak >= 3 && isRight) showToast(`🔥 Streak x${nStreak}! +${3} XP bonus`, "success");
    next(ns, nStreak);
  }, [answered, idx, score, streak, story.quiz, next]);

  const handleTimeout = useCallback(() => {
    if (answered !== null) return;
    setAnswered(-1);
    next(score, 0);
  }, [answered, score, next]);

  const reset = () => { setIdx(0); setScore(0); setStreak(0); setAnswered(null); setDone(false); setFinal(0); setTimerKey((k) => k + 1); };
  const q = story.quiz[idx];
  const stars = final === story.quiz.length ? 3 : final >= Math.ceil(story.quiz.length / 2) ? 2 : 1;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, marginBottom: 4 }}>📝 Đố vui nhanh</div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Trả lời trước khi hết giờ — chuỗi đúng nhận thêm XP!</div>
      </div>

      {done ? (
        <div style={{ textAlign: "center", padding: "28px 0" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: 12 }}>{"⭐".repeat(stars)}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, marginBottom: 8 }}>
            {final === story.quiz.length ? "Hoàn hảo! 🎉" : "Tốt lắm! 👏"}
          </div>
          <div style={{ color: "var(--text-muted)", marginBottom: 8 }}>Đúng <strong style={{ color: "var(--primary)", fontSize: "1.2rem" }}>{final}/{story.quiz.length}</strong> câu</div>
          {bestScore > 0 && final >= bestScore && <div style={{ color: "#f59e0b", fontWeight: 700, marginBottom: 20 }}>🏆 Kỷ lục mới!</div>}
          <button onClick={reset} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>🔄 Chơi lại</button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 700 }}>
            <span>Câu {idx + 1}/{story.quiz.length}</span>
            <span>Điểm: {score} {streak >= 3 ? `🔥×${streak}` : ""}</span>
          </div>
          {answered === null && <TimerBar key={timerKey} seconds={TIMER_PER_Q} total={TIMER_PER_Q} onEnd={handleTimeout} />}
          <ProgressBar value={idx} max={story.quiz.length} />
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700, textAlign: "center", margin: "22px 0 24px" }}>{q.question_en}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {q.options.map((opt, i) => {
              let bg = "var(--bg-card)", border = "var(--border)", color = "var(--text)";
              if (answered !== null) {
                if (i === q.answer) { bg = "#dcfce7"; border = "#22c55e"; color = "#166534"; }
                else if (i === answered) { bg = "#fef2f2"; border = "#ef4444"; color = "#dc2626"; }
              }
              return (
                <div key={i} onClick={() => answer(i)}
                  style={{ padding: 16, borderRadius: 10, border: `2px solid ${border}`, background: bg, cursor: answered === null ? "pointer" : "default", fontWeight: 600, textAlign: "center", transition: "all 0.2s", color, fontSize: "0.93rem" }}>
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

// ─── 4. FILL IN THE BLANK ─────────────────────────────────────────────────────
interface FillQuestion { sentence: string; blank: string; hint: string; answer: string; source: "dialogue" | "vocab"; }

function buildFillQuestions(story: Story): FillQuestion[] {
  const questions: FillQuestion[] = [];
  const vocab = story.vocabulary;

  story.panels.forEach((panel) => {
    panel.dialogue.forEach((d) => {
      if (!d.en || d.en.split(" ").length < 5) return;
      const words = d.en.split(" ");
      // Find longest word that matches vocabulary
      const vocabMatch = vocab.find((v) => words.some((w) => w.toLowerCase().replace(/[^a-z]/g, "") === v.en.toLowerCase()));
      if (vocabMatch) {
        const targetWord = vocabMatch.en;
        const blanked = d.en.replace(new RegExp(`\\b${targetWord}\\b`, "i"), "___");
        if (blanked !== d.en) {
          questions.push({ sentence: blanked, blank: targetWord, hint: vocabMatch.vi, answer: targetWord.toLowerCase(), source: "dialogue" });
        }
      }
    });
  });

  // Thêm từ vocab chưa xuất hiện trong panel
  vocab.forEach((v) => {
    if (!questions.find((q) => q.blank.toLowerCase() === v.en.toLowerCase()) && v.en.split(" ").length === 1) {
      questions.push({
        sentence: `The word for "${v.vi}" in English is ___.`,
        blank: v.en, hint: v.vi, answer: v.en.toLowerCase(), source: "vocab",
      });
    }
  });

  return questions.slice(0, 8).sort(() => Math.random() - 0.5);
}

function FillGame({ story, bestScore, onSave }: { story: Story; bestScore: number; onSave: (score: number, total: number) => void }) {
  const { settings } = useSettings();
  const { speak } = useTTS(settings.ttsEnabled);
  const questions = useState(() => buildFillQuestions(story))[0];
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [final, setFinal] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!done) setTimeout(() => inputRef.current?.focus(), 100); }, [idx, done]);

  if (questions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
        Bài học này chưa có đủ nội dung để tạo câu điền từ. Hãy thử bài học khác!
      </div>
    );
  }

  const q = questions[idx];

  function submit() {
    if (!input.trim() || result !== null) return;
    const isRight = input.trim().toLowerCase() === q.answer;
    setResult(isRight ? "correct" : "wrong");
    if (isRight) { speak(q.blank); spawnConfetti(); }
    const ns = isRight ? score + 1 : score;
    setTimeout(() => {
      const ni = idx + 1;
      if (ni >= questions.length) { setFinal(ns); onSave(ns, questions.length); setDone(true); }
      else { setScore(ns); setIdx(ni); setInput(""); setResult(null); }
    }, 1100);
  }

  function skip() {
    setResult("wrong");
    setTimeout(() => {
      const ni = idx + 1;
      if (ni >= questions.length) { setFinal(score); onSave(score, questions.length); setDone(true); }
      else { setIdx(ni); setInput(""); setResult(null); }
    }, 800);
  }

  function reset() { setIdx(0); setInput(""); setResult(null); setScore(0); setDone(false); setFinal(0); }

  const stars = final === questions.length ? 3 : final >= Math.ceil(questions.length / 2) ? 2 : 1;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, marginBottom: 4 }}>✏️ Điền từ vào chỗ trống</div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Gõ từ tiếng Anh phù hợp vào chỗ ___</div>
      </div>

      {done ? (
        <div style={{ textAlign: "center", padding: "28px 0" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: 12 }}>{"⭐".repeat(stars)}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, marginBottom: 8 }}>
            {final === questions.length ? "Xuất sắc! 🎉" : "Tốt lắm! 👏"}
          </div>
          <div style={{ color: "var(--text-muted)", marginBottom: 20 }}>Điền đúng <strong style={{ color: "var(--primary)", fontSize: "1.2rem" }}>{final}/{questions.length}</strong> từ</div>
          <button onClick={reset} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>🔄 Chơi lại</button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 700 }}>
            <span>Câu {idx + 1}/{questions.length}</span>
            <span>Điểm: {score}</span>
          </div>
          <ProgressBar value={idx} max={questions.length} />

          <div style={{ margin: "24px 0", padding: "22px 24px", background: "var(--surface)", borderRadius: 16, border: "1.5px solid var(--border)" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 600, lineHeight: 1.7, marginBottom: 10 }}>
              {q.sentence.split("___").map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span style={{
                      display: "inline-block", minWidth: 80, borderBottom: `2px solid ${result === "correct" ? "#22c55e" : result === "wrong" ? "#ef4444" : "var(--primary)"}`,
                      color: result ? (result === "correct" ? "#166534" : "#dc2626") : "transparent",
                      fontWeight: 800, padding: "0 4px", textAlign: "center",
                    }}>
                      {result ? q.blank : ""}
                    </span>
                  )}
                </span>
              ))}
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>💡 Gợi ý: <strong>{q.hint}</strong></div>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              disabled={result !== null}
              placeholder="Gõ từ tiếng Anh tại đây..."
              style={{
                flex: 1, padding: "12px 16px", borderRadius: 10,
                border: `2px solid ${result === "correct" ? "#22c55e" : result === "wrong" ? "#ef4444" : "var(--border)"}`,
                background: "var(--bg-card)", color: "var(--text)",
                fontFamily: "var(--font-body)", fontSize: "1rem", outline: "none",
              }} />
            <button onClick={submit} disabled={!input.trim() || result !== null}
              style={{ padding: "12px 20px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              ✓
            </button>
          </div>

          {result !== null && (
            <div style={{ padding: "10px 16px", borderRadius: 10, background: result === "correct" ? "#dcfce7" : "#fef2f2", border: `1.5px solid ${result === "correct" ? "#22c55e" : "#ef4444"}`, fontWeight: 700, color: result === "correct" ? "#166534" : "#dc2626", marginBottom: 10 }}>
              {result === "correct" ? "✅ Chính xác!" : `❌ Sai rồi! Đáp án: "${q.blank}"`}
            </div>
          )}

          {result === null && (
            <div style={{ textAlign: "right" }}>
              <button onClick={skip} style={{ padding: "7px 16px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, fontFamily: "var(--font-body)" }}>Bỏ qua →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── 5. SPEAK CHALLENGE (trò chơi luyện nói đầy đủ) ─────────────────────────
function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).filter(Boolean);
}
function similarity(target: string, transcript: string) {
  const a = normalize(target), b = normalize(transcript);
  if (!a.length) return 0;
  let m = 0; const bc = [...b];
  for (const w of a) { const i = bc.indexOf(w); if (i !== -1) { m++; bc.splice(i, 1); } }
  return Math.round((m / a.length) * 100);
}

interface SpeechRec extends EventTarget {
  lang: string; interimResults: boolean; maxAlternatives: number;
  start(): void; stop(): void;
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null; onend: (() => void) | null;
}
declare const webkitSpeechRecognition: new () => SpeechRec;

function SpeakGame({ story, bestScore, onSave }: { story: Story; bestScore: number; onSave: (score: number, sentence: string, transcript: string) => void }) {
  const { settings } = useSettings();
  const { speak } = useTTS(settings.ttsEnabled);

  const sentences = story.panels
    .flatMap((p) => p.dialogue)
    .filter((d) => d.en && d.en.split(" ").length >= 3)
    .slice(0, 8);

  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [transcript, setTranscript] = useState("");
  const [curScore, setCurScore] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [done, setDone] = useState(false);
  const [supported, setSupported] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const waveHeights = [28, 36, 24, 40, 32];
  const recRef = useRef<SpeechRec | null>(null);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function getSR(): (new () => SpeechRec) | null {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    return w.SpeechRecognition || w.webkitSpeechRecognition || null;
  }

  function startCountdown() {
    setCountdown(3);
    countRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c === null || c <= 1) { clearInterval(countRef.current!); setCountdown(null); startListening(); return null; }
        return c - 1;
      });
    }, 1000);
  }

  function startListening() {
    const SR = getSR();
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.lang = "en-US"; rec.interimResults = false; rec.maxAlternatives = 3;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      const s = similarity(sentences[idx].en, text);
      setCurScore(s);
    };
    rec.onerror = () => { setListening(false); };
    rec.onend = () => { setListening(false); };
    recRef.current = rec;
    setTranscript(""); setCurScore(null); setListening(true);
    try { rec.start(); } catch { setListening(false); }
  }

  function stop() { recRef.current?.stop(); setListening(false); }

  function acceptScore() {
    if (curScore === null) return;
    const s = curScore;
    const sent = sentences[idx].en;
    onSave(s, sent, transcript);
    const ns = [...scores, s];
    setScores(ns);
    const ni = idx + 1;
    if (ni >= sentences.length) { setDone(true); if (s >= 80) spawnConfetti(); }
    else { setIdx(ni); setCurScore(null); setTranscript(""); }
  }

  function skip() {
    const ns = [...scores, 0];
    setScores(ns);
    const ni = idx + 1;
    if (ni >= sentences.length) { setDone(true); }
    else { setIdx(ni); setCurScore(null); setTranscript(""); }
  }

  function reset() { setIdx(0); setScores([]); setTranscript(""); setCurScore(null); setListening(false); setDone(false); setCountdown(null); }

  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const sent = sentences[idx];

  if (!supported) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎙️</div>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Trình duyệt chưa hỗ trợ nhận diện giọng nói</div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Hãy thử trên Google Chrome (desktop hoặc Android)</div>
      </div>
    );
  }

  if (sentences.length === 0) {
    return <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Bài học này chưa có câu thoại để luyện nói.</div>;
  }

  const scoreColor = (s: number) => s >= 80 ? "#22c55e" : s >= 60 ? "#f59e0b" : "#ef4444";
  const scoreLabel = (s: number) => s >= 80 ? "🌟 Xuất sắc!" : s >= 60 ? "👍 Khá tốt!" : "💪 Cố lên!";

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, marginBottom: 4 }}>🎙️ Luyện phát âm</div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Đọc to câu tiếng Anh — hệ thống chấm điểm phát âm của bạn</div>
      </div>

      {done ? (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: "4rem", marginBottom: 12 }}>🎙️</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, marginBottom: 8 }}>Hoàn thành luyện nói!</div>
          <div style={{ marginBottom: 8 }}>
            Điểm trung bình: <strong style={{ color: scoreColor(avgScore), fontSize: "1.4rem" }}>{avgScore}/100</strong>
          </div>
          <div style={{ color: "var(--text-muted)", marginBottom: 8 }}>{scoreLabel(avgScore)}</div>
          {bestScore > 0 && avgScore >= bestScore && <div style={{ color: "#f59e0b", fontWeight: 700, marginBottom: 20 }}>🏆 Kỷ lục mới!</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
            {scores.map((s, i) => (
              <div key={i} style={{ textAlign: "center", padding: "6px 14px", borderRadius: 20, background: s >= 80 ? "#dcfce7" : s >= 60 ? "#fef9c3" : "#fef2f2", color: scoreColor(s), fontWeight: 700, fontSize: "0.85rem" }}>
                Câu {i + 1}: {s}
              </div>
            ))}
          </div>
          <button onClick={reset} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>🔄 Luyện lại</button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 700 }}>
            <span>Câu {idx + 1}/{sentences.length}</span>
            {bestScore > 0 && <span>🏆 Kỷ lục: {bestScore}</span>}
          </div>
          <ProgressBar value={idx} max={sentences.length} />

          <div style={{ margin: "20px 0", padding: "20px 24px", background: "var(--surface)", borderRadius: 16, border: "1.5px solid var(--border)", textAlign: "center" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>— {sent?.character || "Nhân vật"} nói —</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: 8, lineHeight: 1.5 }}>&quot;{sent?.en}&quot;</div>
            <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontStyle: "italic", marginBottom: 14 }}>&quot;{sent?.vi}&quot;</div>
            <button onClick={() => speak(sent?.en || "")}
              style={{ padding: "6px 16px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg-card)", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, fontFamily: "var(--font-body)" }}>
              🔊 Nghe mẫu
            </button>
          </div>

          {/* Recording area */}
          {curScore === null ? (
            <div style={{ textAlign: "center" }}>
              {countdown !== null ? (
                <div style={{ fontSize: "4rem", fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--primary)", animation: "ping 0.8s ease", marginBottom: 12 }}>{countdown}</div>
              ) : listening ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 40 }}>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} style={{ width: 8, background: "var(--primary)", borderRadius: 4, animation: `wave 1s ease-in-out infinite`, animationDelay: `${i * 0.15}s`, height: `${waveHeights[i]}px` }} />
                    ))}
                  </div>
                  <div style={{ color: "var(--primary)", fontWeight: 700 }}>Đang nghe...</div>
                  <button onClick={stop} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#ef4444", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>⏹ Dừng</button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={startCountdown}
                    style={{ padding: "14px 28px", borderRadius: 12, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                    🎙️ Bắt đầu nói
                  </button>
                  <button onClick={skip}
                    style={{ padding: "14px 16px", borderRadius: 12, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 600, fontFamily: "var(--font-body)" }}>
                    Bỏ qua
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ padding: 16, borderRadius: 12, background: "var(--surface)", border: `2px solid ${scoreColor(curScore)}`, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontWeight: 700 }}>Bạn nói:</span>
                  <span style={{ fontWeight: 800, fontSize: "1.3rem", color: scoreColor(curScore) }}>{curScore}/100</span>
                </div>
                <div style={{ fontStyle: "italic", marginBottom: 6 }}>&quot;{transcript}&quot;</div>
                <div style={{ fontWeight: 700, color: scoreColor(curScore) }}>{scoreLabel(curScore)}</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={startCountdown}
                  style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-body)" }}>
                  🔁 Đọc lại
                </button>
                <button onClick={acceptScore}
                  style={{ flex: 2, padding: "11px 0", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", cursor: "pointer", fontWeight: 800, fontFamily: "var(--font-body)" }}>
                  Tiếp theo →
                </button>
              </div>
            </div>
          )}
        </>
      )}
      <style>{`
        @keyframes wave { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(2.5)} }
        @keyframes ping { 0%{transform:scale(1)} 50%{transform:scale(1.2)} 100%{transform:scale(1)} }
      `}</style>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
const GAME_TABS: { mode: GameMode; label: string; emoji: string; desc: string }[] = [
  { mode: "flipcard", label: "Lật thẻ", emoji: "🃏", desc: "Ghép cặp EN↔VI trong 90s" },
  { mode: "match", label: "Ghép đôi", emoji: "🔗", desc: "Nối từ cột trái và phải" },
  { mode: "quiz", label: "Đố vui", emoji: "📝", desc: "Trắc nghiệm có đồng hồ" },
  { mode: "fill", label: "Điền từ", emoji: "✏️", desc: "Gõ từ còn thiếu trong câu" },
  { mode: "speak", label: "Luyện nói", emoji: "🎙️", desc: "Đọc to — AI chấm phát âm" },
];

function XP_FOR(mode: GameMode, score: number, total: number) {
  if (mode === "flipcard") return score * 3 + (total > 0 ? 10 : 0);
  if (mode === "match") return score * 3;
  if (mode === "quiz") return score * 5;
  if (mode === "fill") return score * 8;
  if (mode === "speak") return score >= 80 ? 25 : score >= 60 ? 15 : 0;
  return 0;
}

function GamesInner() {
  const searchParams = useSearchParams();
  const storyId = searchParams.get("story");
  const modeParam = searchParams.get("mode") as GameMode | null;

  const [allStories, setAllStories] = useState<Story[]>([]);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [mode, setMode] = useState<GameMode>(modeParam || "flipcard");
  const [gameKey, setGameKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastXP, setLastXP] = useState<number | null>(null);

  const { saveMatchScore, saveQuizScore, saveFillScore, saveSpeakGameScore, getStoryProgress } = useProgress();

  useEffect(() => {
    fetch("/api/lessons")
      .then((r) => r.json())
      .then((data) => {
        const stories = (data.lessons as LessonDTO[] || [])
          .filter((l) => l.vocabulary?.length && l.panels?.length)
          .map(lessonToStory);
        setAllStories(stories);
        if (storyId) setCurrentStory(stories.find((s) => s.id === storyId) || stories[0] || null);
        else setCurrentStory(stories[0] || null);
      })
      .finally(() => setLoading(false));
  }, [storyId]);

  function changeStory(id: string) {
    setCurrentStory(allStories.find((s) => s.id === id) || null);
    setGameKey((k) => k + 1);
    setLastXP(null);
  }

  function changeMode(m: GameMode) {
    setMode(m); setGameKey((k) => k + 1); setLastXP(null);
  }

  function handleFlipSave(score: number, _timeLeft: number) {
    if (!currentStory) return;
    saveMatchScore(currentStory.id, score);
    const xp = XP_FOR("flipcard", score, currentStory.vocabulary.length);
    setLastXP(xp);
  }

  function handleMatchSave(score: number) {
    if (!currentStory) return;
    saveMatchScore(currentStory.id, score);
    setLastXP(XP_FOR("match", score, 0));
  }

  function handleQuizSave(score: number, total: number) {
    if (!currentStory) return;
    saveQuizScore(currentStory.id, score, total);
    setLastXP(XP_FOR("quiz", score, total));
  }

  function handleFillSave(score: number, total: number) {
    if (!currentStory) return;
    saveFillScore(currentStory.id, score, total);
    setLastXP(XP_FOR("fill", score, total));
  }

  function handleSpeakSave(score: number, sentence: string, transcript: string) {
    if (!currentStory) return;
    saveSpeakGameScore(currentStory.id, score, sentence, transcript);
    setLastXP(XP_FOR("speak", score, 0));
  }

  const progress = currentStory ? getStoryProgress(currentStory.id) : {};
  const bestMatch = progress.matchScore ?? 0;
  const bestQuiz = progress.quizScore ?? 0;
  const bestPron = progress.pronScore ?? 0;

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>⏳ Đang tải bài học...</div>;
  if (!currentStory) return <div style={{ padding: 40, textAlign: "center" }}>📚 Chưa có bài học nào. Hãy đọc truyện trước!</div>;

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "28px 20px" }}>
      <h1 style={{ marginBottom: 6 }}>🎮 Trò chơi học tập</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: 22 }}>5 loại trò chơi — chơi theo từng bài học</p>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
        <select value={currentStory.id} onChange={(e) => changeStory(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 10, border: "2px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontFamily: "var(--font-body)", fontWeight: 600, cursor: "pointer", maxWidth: 260 }}>
          {allStories.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.title.vi}</option>)}
        </select>
        {lastXP !== null && lastXP > 0 && (
          <span style={{ padding: "6px 14px", borderRadius: 20, background: "var(--primary)", color: "#fff", fontWeight: 800, fontSize: "0.85rem", animation: "fadeIn 0.4s" }}>
            +{lastXP} XP ✨
          </span>
        )}
      </div>

      {/* Game tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 24 }}>
        {GAME_TABS.map((g) => (
          <button key={g.mode} onClick={() => changeMode(g.mode)}
            style={{
              padding: "10px 4px", borderRadius: 12, border: `2px solid ${mode === g.mode ? "var(--primary)" : "var(--border)"}`,
              background: mode === g.mode ? "var(--primary)" : "var(--surface)",
              color: mode === g.mode ? "#fff" : "var(--text)", cursor: "pointer",
              fontFamily: "var(--font-body)", fontWeight: mode === g.mode ? 800 : 600,
              fontSize: "0.78rem", textAlign: "center", transition: "all 0.2s",
            }}>
            <div style={{ fontSize: "1.3rem", marginBottom: 2 }}>{g.emoji}</div>
            {g.label}
          </button>
        ))}
      </div>

      {/* Game description */}
      <div style={{ marginBottom: 14, fontSize: "0.82rem", color: "var(--text-muted)", textAlign: "center" }}>
        {GAME_TABS.find((g) => g.mode === mode)?.desc}
        {" · "}
        <strong style={{ color: "var(--text)" }}>{currentStory.vocabulary.length} từ · {currentStory.quiz.length} câu quiz</strong>
      </div>

      {/* Game area */}
      <div key={gameKey} style={{ background: "var(--bg-card)", borderRadius: 20, border: "1.5px solid var(--border)", boxShadow: "var(--shadow)", padding: "28px 28px" }}>
        {mode === "flipcard" && <FlipCardGame story={currentStory} bestScore={bestMatch} onSave={handleFlipSave} />}
        {mode === "match" && <MatchGame story={currentStory} bestScore={bestMatch} onSave={handleMatchSave} />}
        {mode === "quiz" && <QuizGame story={currentStory} bestScore={bestQuiz} onSave={handleQuizSave} />}
        {mode === "fill" && <FillGame story={currentStory} bestScore={bestQuiz} onSave={handleFillSave} />}
        {mode === "speak" && <SpeakGame story={currentStory} bestScore={bestPron} onSave={handleSpeakSave} />}
      </div>

      <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }`}</style>
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
