"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useCallback } from "react";
import type { ReactElement } from "react";
import Link from "next/link";
import { SCENE_EMOJIS } from "@/data/stories";
import { useProgress, useSettings, useTTS } from "@/lib/hooks";
import { lessonToStory } from "@/lib/lesson";
import { spawnConfetti } from "@/components/ui/Feedback";
import CulturalMissionCard from "@/components/missions/CulturalMissionCard";
import SpeakChallenge from "@/components/speak/SpeakChallenge";
import ComicPanel from "@/components/comic/ComicPanel";
import type { Story, LangMode, ComicCharacterDTO, ComicBackgroundDTO } from "@/types";

// ---- Vocab highlight ----
function HighlightedText({ text, vocab, onSpeak }: { text: string; vocab: { en: string; vi: string }[]; onSpeak: (t: string) => void }) {
  const sorted = [...vocab].sort((a, b) => b.en.length - a.en.length);

  function split(s: string): ReactElement[] {
    if (!s) return [];
    for (const v of sorted) {
      const idx = s.toLowerCase().indexOf(v.en.toLowerCase());
      if (idx !== -1) {
        const before = s.slice(0, idx);
        const match = s.slice(idx, idx + v.en.length);
        const after = s.slice(idx + v.en.length);
        return [
          ...split(before),
          <VocabWord key={`${v.en}-${idx}`} word={match} meaning={v.vi} onSpeak={onSpeak} />,
          ...split(after),
        ];
      }
    }
    return [<span key={s}>{s}</span>];
  }

  return <>{split(text)}</>;
}

function VocabWord({ word, meaning, onSpeak }: { word: string; meaning: string; onSpeak: (t: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative" }}>
      <span
        onClick={() => { setShow(!show); onSpeak(word); }}
        style={{ textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "var(--primary)", cursor: "pointer" }}
      >
        {word}
      </span>
      {show && (
        <span
          onClick={() => setShow(false)}
          style={{
            position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
            background: "var(--text)", color: "var(--bg-card)", padding: "6px 12px", borderRadius: 8,
            fontSize: "0.78rem", whiteSpace: "nowrap", zIndex: 50, pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          {meaning}
          <span style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", border: "5px solid transparent", borderTopColor: "var(--text)" }} />
        </span>
      )}
    </span>
  );
}

// ---- Learning journey modal: Understand (quiz) -> Cultural Missions -> Speak ----
function LearningJourneyModal({ story, onClose, onSaveQuiz, onSavePron }: {
  story: Story; onClose: () => void;
  onSaveQuiz: (score: number, total: number) => void;
  onSavePron: (score: number, sentenceEn: string, transcript: string) => void;
}) {
  const [stage, setStage] = useState<"quiz" | "missions" | "speak" | "done">(story.quiz.length ? "quiz" : story.missions?.length ? "missions" : "speak");
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [missionIdx, setMissionIdx] = useState(0);

  const answer = useCallback((chosen: number) => {
    if (answered !== null) return;
    setAnswered(chosen);
    const correct = story.quiz[qIdx].answer;
    const newScore = chosen === correct ? score + 1 : score;
    setTimeout(() => {
      const nextIdx = qIdx + 1;
      if (nextIdx >= story.quiz.length) {
        setFinalScore(newScore);
        onSaveQuiz(newScore, story.quiz.length);
        if (newScore === story.quiz.length) spawnConfetti();
        setStage(story.missions?.length ? "missions" : "speak");
      } else {
        setScore(newScore);
        setQIdx(nextIdx);
        setAnswered(null);
      }
    }, 900);
  }, [answered, qIdx, score, story, onSaveQuiz]);

  const q = story.quiz[qIdx];
  const stars = finalScore === story.quiz.length ? 3 : finalScore >= story.quiz.length / 2 ? 2 : 1;
  const speakSentence = story.panels.flatMap((p) => p.dialogue)[0];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg-card)", borderRadius: 24, padding: 32, maxWidth: 560, width: "100%", boxShadow: "var(--shadow-lg)", animation: "slideUp 0.3s ease", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: "1.3rem" }}>
            {stage === "quiz" && "📝 Đố vui"}
            {stage === "missions" && "🧭 Nhiệm vụ khám phá văn hóa"}
            {stage === "speak" && "🎙️ Luyện nói"}
            {stage === "done" && "🎉 Hoàn thành"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
        </div>

        {stage === "quiz" && story.quiz.length > 0 && (
          <>
            <div style={{ textAlign: "center", marginBottom: 8, fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700 }}>
              Câu {qIdx + 1} / {story.quiz.length}
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, textAlign: "center", marginBottom: 28 }}>{q.question_en}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {q.options.map((opt, i) => {
                let bg = "var(--bg-card)";
                let border = "var(--border)";
                let color = "var(--text)";
                if (answered !== null) {
                  if (i === q.answer) { bg = "#E8F5E9"; border = "#2E7D32"; color = "#2E7D32"; }
                  else if (i === answered) { bg = "#FFEBEE"; border = "#F44336"; color = "#F44336"; }
                }
                return (
                  <div key={i} onClick={() => answer(i)}
                    style={{ padding: 16, borderRadius: 10, border: `2px solid ${border}`, background: bg, cursor: answered === null ? "pointer" : "default", fontWeight: 600, textAlign: "center", transition: "all 0.2s", color }}
                  >{opt}</div>
                );
              })}
            </div>
          </>
        )}

        {stage === "missions" && story.missions && story.missions.length > 0 && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 12, fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700 }}>
              Nhiệm vụ {missionIdx + 1} / {story.missions.length}
            </div>
            <CulturalMissionCard
              key={story.missions[missionIdx].id}
              mission={story.missions[missionIdx]}
              lessonId={story.id}
              onComplete={() => {
                setTimeout(() => {
                  if (missionIdx + 1 < (story.missions?.length || 0)) {
                    setMissionIdx((i) => i + 1);
                  } else {
                    setStage("speak");
                  }
                }, 1200);
              }}
            />
          </div>
        )}

        {stage === "speak" && speakSentence && (
          <div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: 12, textAlign: "center" }}>
              Đọc to câu thoại sau bằng tiếng Anh để luyện phát âm:
            </p>
            <SpeakChallenge
              sentenceEn={speakSentence.en}
              sentenceVi={speakSentence.vi}
              onComplete={(s, t) => {
                onSavePron(s, speakSentence.en, t);
                if (s >= 60) spawnConfetti();
              }}
            />
            <div style={{ textAlign: "center", marginTop: 18 }}>
              <button onClick={() => setStage("done")} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "var(--primary)", color: "white", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                Hoàn thành →
              </button>
            </div>
          </div>
        )}

        {(stage === "done" || (stage === "quiz" && story.quiz.length === 0)) && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: 12 }}>{story.quiz.length > 0 ? "⭐".repeat(stars) : "🎉"}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, marginBottom: 8 }}>
              {story.quiz.length === 0 || finalScore === story.quiz.length ? "Xuất sắc! 🎉" : "Tốt lắm! 👏"}
            </div>
            {story.quiz.length > 0 && (
              <div style={{ color: "var(--text-muted)", marginBottom: 20 }}>
                Bạn trả lời đúng <strong style={{ color: "var(--primary)" }}>{finalScore}/{story.quiz.length}</strong> câu
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={onClose} style={{ padding: "10px 22px", borderRadius: 10, border: "2px solid var(--primary)", background: "transparent", color: "var(--primary)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>Đóng</button>
              <Link href={`/games?story=${story.id}&mode=match`} style={{ padding: "10px 22px", borderRadius: 10, background: "var(--secondary)", color: "white", fontWeight: 700, textDecoration: "none" }}>🎮 Chơi Ghép đôi</Link>
              <Link href="/progress" style={{ padding: "10px 22px", borderRadius: 10, background: "var(--primary)", color: "white", fontWeight: 700, textDecoration: "none" }}>📊 Tiến độ</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Main reader ----
function ReaderInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [story, setStory] =
    useState<Story | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [comicCharacters, setComicCharacters] = useState<ComicCharacterDTO[]>([]);
  const [comicBackgrounds, setComicBackgrounds] = useState<ComicBackgroundDTO[]>([]);
  const [isTeacher, setIsTeacher] = useState(false);

  // HOOKS PHẢI ĐẶT Ở ĐÂY
  const { settings, updateSettings } =
    useSettings();

  const { speak } =
    useTTS(settings.ttsEnabled);

  const {
    markRead,
    saveQuizScore,
    savePronunciationScore,
  } = useProgress();

  const [panelIdx, setPanelIdx] =
    useState(0);

  const [showJourney, setShowJourney] =
    useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    fetch(`/api/lessons/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.lesson) {
          setStory(
            lessonToStory(data.lesson)
          );
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!story) return;

    markRead(story.id);
  }, [story, markRead]);

  useEffect(() => {
    if (!story) return;
    Promise.all([
      fetch("/api/comic/characters").then((r) => r.json()).catch(() => ({ characters: [] })),
      fetch("/api/comic/backgrounds").then((r) => r.json()).catch(() => ({ backgrounds: [] })),
      fetch("/api/auth/session").then((r) => r.json()).catch(() => null),
    ]).then(([charData, bgData, sessionData]) => {
      setComicCharacters(charData.characters ?? []);
      setComicBackgrounds(bgData.backgrounds ?? []);
      const role = sessionData?.user?.role ?? "";
      setIsTeacher(["TEACHER", "ADMIN"].includes(role));
    });
  }, [story?.id]);

  useEffect(() => {
    setPanelIdx(0);
  }, [story?.id]);

  // RETURN ĐẶT SAU TOÀN BỘ HOOK

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        ⏳ Đang tải bài học...
      </div>
    );
  }

  if (!story) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        ❌ Không tìm thấy bài học
      </div>
    );
  }

  const panel = story.panels[panelIdx];
  const isLast =
    panelIdx === story.panels.length - 1;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Toolbar */}
      <div style={{ background: "var(--bg-card)", borderBottom: "2px solid var(--border)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Link href="/library" style={{ color: "var(--text-muted)", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>← Thư viện</Link>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem" }}>
          {story.title.vi} / {story.title.en}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {/* Lang toggle */}
          <div style={{ display: "flex", border: "2px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            {(["both", "vi", "en"] as LangMode[]).map((l) => (
              <button key={l} onClick={() => updateSettings({ lang: l })}
                style={{ padding: "7px 14px", background: settings.lang === l ? "var(--primary)" : "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", color: settings.lang === l ? "white" : "var(--text-muted)", fontFamily: "var(--font-body)", transition: "all 0.2s" }}>
                {l === "both" ? "VI+EN" : l.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={() => updateSettings({ ttsEnabled: !settings.ttsEnabled })}
            style={{ padding: "7px 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: settings.ttsEnabled ? "var(--primary)" : "var(--surface)", color: settings.ttsEnabled ? "white" : "var(--text-muted)", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-body)" }}>
            🔊 TTS
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>
          {/* Comic panel */}
          <div>
            <div key={panelIdx} style={{ borderRadius: 24, overflow: "hidden", border: "2px solid var(--border)", boxShadow: "var(--shadow)", animation: "slideUp 0.3s ease", background: "var(--bg-card)" }}>
              {/* Scene */}
              <div style={{ position: "relative", minHeight: 280, background: panel.bg }}>
                <ComicPanel
                  panel={panel}
                  characters={comicCharacters}
                  backgrounds={comicBackgrounds}
                  ethnicCulture={story.ethnic_culture}
                  lessonId={id ?? undefined}
                  isTeacherMode={isTeacher}
                />
                <span style={{ position: "absolute", top: 12, left: 12, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.5)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, fontFamily: "var(--font-display)" }}>
                  {panelIdx + 1}
                </span>
              </div>
              {/* Dialogues */}
              <div style={{ padding: 20, borderTop: "2px solid var(--border)" }}>
                {panel.dialogue.map((d, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < panel.dialogue.length - 1 ? 14 : 0, alignItems: "flex-start" }}>
                    <span style={{ background: "var(--primary)", color: "white", padding: "4px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap", marginTop: 2, fontFamily: "var(--font-display)" }}>
                      {d.character}
                    </span>
                    <div style={{ flex: 1 }}>
                      {settings.lang !== "en" && (
                        <div style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: 3 }}>{d.vi}</div>
                      )}
                      {settings.lang !== "vi" && (
                        <div
                          onClick={() => speak(d.en)}
                          style={{
                            fontSize: "1rem",
                            color: "var(--text)",
                            fontWeight: 700,
                            lineHeight: 1.5,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              color: "var(--primary-light)",
                              fontSize: "0.9rem",
                              flexShrink: 0,
                            }}
                          >
                            🔊
                          </span>

                          <span>
                            <HighlightedText
                              text={d.en}
                              vocab={story.vocabulary}
                              onSpeak={speak}
                            />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: 20 }}>
              <button onClick={() => setPanelIdx(p => Math.max(0, p - 1))} disabled={panelIdx === 0}
                style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid var(--border)", background: "var(--bg-card)", cursor: panelIdx === 0 ? "not-allowed" : "pointer", fontSize: "1.3rem", opacity: panelIdx === 0 ? 0.3 : 1, transition: "all 0.2s" }}>◀</button>
              <div style={{ display: "flex", gap: 8 }}>
                {story.panels.map((_, i) => (
                  <span key={i} onClick={() => setPanelIdx(i)}
                    style={{ width: 10, height: 10, borderRadius: "50%", background: i === panelIdx ? "var(--primary)" : "var(--border)", cursor: "pointer", transition: "all 0.2s", transform: i === panelIdx ? "scale(1.3)" : "scale(1)", display: "inline-block" }} />
                ))}
              </div>
              <button onClick={() => isLast ? setShowJourney(true) : setPanelIdx(p => p + 1)}
                style={{ width: isLast ? "auto" : 44, height: 44, padding: isLast ? "0 16px" : 0, borderRadius: isLast ? 10 : "50%", border: "2px solid var(--primary)", background: isLast ? "var(--primary)" : "var(--bg-card)", color: isLast ? "white" : "var(--text)", cursor: "pointer", fontSize: isLast ? "0.9rem" : "1.3rem", fontWeight: 700, transition: "all 0.2s", fontFamily: "var(--font-body)" }}>
                {isLast ? "🎯 Tiếp theo" : "▶"}
              </button>
            </div>
          </div>

          {/* Vocab sidebar */}
          <div style={{ background: "var(--surface)", borderRadius: 16, padding: 20, border: "1.5px solid var(--border)", position: "sticky", top: 80 }}>
            <h3 style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              📝 Từ vựng <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>(nhấn để nghe)</span>
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 8 }}>
              {story.vocabulary.map((v) => (
                <div key={v.en} onClick={() => speak(v.en)}
                  style={{ background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 10, padding: "8px 12px", cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--primary)" }}>{v.en}</span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{v.vi}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showJourney && (
        <LearningJourneyModal
          story={story}
          onClose={() => setShowJourney(false)}
          onSaveQuiz={(score, total) => saveQuizScore(story.id, score, total)}
          onSavePron={(score, sentenceEn, transcript) => savePronunciationScore(story.id, score, sentenceEn, transcript)}
        />
      )}
    </div>
  );
}

export default function ReaderPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>⏳ Đang tải...</div>}>
      <ReaderInner />
    </Suspense>
  );
}
