"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { VILLAGE_MAP_POINTS, type VillageMapPoint, type MapStoryPanel } from "@/data/villageMap";
import { showToast, spawnConfetti } from "@/components/ui/Feedback";
import { useSettings, useTTS } from "@/lib/hooks";

interface CompletedPoints {
  [pointId: string]: { completedAt: number; xpEarned: number };
}

// ─── Story Modal ──────────────────────────────────────────────────────────────
function VillagePointModal({
  point, isCompleted, onClose, onComplete,
}: {
  point: VillageMapPoint;
  isCompleted: boolean;
  onClose: () => void;
  onComplete: (pointId: string, xp: number) => void;
}) {
  const { settings } = useSettings();
  const { speak } = useTTS(settings.ttsEnabled);
  const [phase, setPhase] = useState<"story" | "vocab" | "quiz">("story");
  const [panelIdx, setPanelIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [completing, setCompleting] = useState(false);

  const panel: MapStoryPanel = point.story[panelIdx];
  const isLastPanel = panelIdx === point.story.length - 1;

  async function handleFinish() {
    if (isCompleted || completing) return;
    setCompleting(true);
    try {
      await fetch("/api/village/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pointId: point.id, xpReward: point.xpReward }),
      });
      spawnConfetti();
      onComplete(point.id, point.xpReward);
      showToast(`+${point.xpReward} XP — Khám phá xong "${point.titleVi}"! 🎉`, "success");
    } catch {
      showToast("Lỗi lưu tiến độ", "error");
    } finally {
      setCompleting(false);
      onClose();
    }
  }

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "var(--bg-card)", borderRadius: 20, maxWidth: 580, width: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.35)", position: "relative" }}>

        {/* Header */}
        <div style={{
          width: "100%", height: 300,
          backgroundImage: "url('/images/village_map.png')",
          backgroundSize: "300%",
          backgroundPosition: `${point.mapPosition.x}% ${point.mapPosition.y}%`,
          borderRadius: "0",
        }} />
        <div style={{ padding: "20px 20px 0", background: "linear-gradient(135deg, var(--surface), #fff8f0)", borderRadius: "20px 20px 0 0" }}>
          <button onClick={onClose}
            style={{ position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--bg-card)", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: "2.2rem" }}>{point.emoji}</span>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: "1.15rem", fontFamily: "var(--font-display)" }}>{point.titleVi}</h2>
              <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{point.titleEn}</div>
            </div>
            {isCompleted && (
              <span style={{ background: "#D1FAE5", color: "#065F46", padding: "4px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, flexShrink: 0 }}>
                ✅ Đã khám phá
              </span>
            )}
          </div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border)" }}>
            {(["story", "vocab", "quiz"] as const).map((tab, i) => (
              <button key={tab} onClick={() => setPhase(tab)}
                style={{
                  flex: 1, padding: "9px 0", border: "none", cursor: "pointer",
                  background: "transparent",
                  borderBottom: phase === tab ? "3px solid var(--primary)" : "3px solid transparent",
                  color: phase === tab ? "var(--primary)" : "var(--text-muted)",
                  fontWeight: phase === tab ? 800 : 500,
                  fontSize: "0.82rem", fontFamily: "var(--font-body)",
                  marginBottom: -2,
                }}>
                {i === 0 ? "📖 Câu chuyện" : i === 1 ? "📚 Từ vựng" : "❓ Quiz"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "18px 20px 22px" }}>

          {/* ── Story phase ─────────────────────────────────────────── */}
          {phase === "story" && (
            <div>
              {/* Panel indicator */}
              <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
                {point.story.map((_, i) => (
                  <div key={i} onClick={() => setPanelIdx(i)}
                    style={{ flex: 1, height: 4, borderRadius: 2, background: i <= panelIdx ? "var(--primary)" : "var(--border)", cursor: "pointer", transition: "background 0.2s" }} />
                ))}
              </div>

              {/* Story panel */}
              <div style={{ background: "var(--surface)", borderRadius: 14, padding: "18px 18px", marginBottom: 16, minHeight: 140 }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Phần {panelIdx + 1} / {point.story.length}
                </div>

                {/* English — main reading */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1, background: "#EFF6FF", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: "1rem", lineHeight: 1.65, color: "var(--text)", fontWeight: 500 }}>
                      {panel.en}
                    </div>
                  </div>
                  <button onClick={() => speak(panel.en)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", flexShrink: 0, paddingTop: 10 }}>
                    🔊
                  </button>
                </div>

                {/* Vietnamese */}
                <div style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6, paddingLeft: 2 }}>
                  {panel.vi}
                </div>
              </div>

              {/* Navigation */}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setPanelIdx(p => Math.max(0, p - 1))} disabled={panelIdx === 0}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: panelIdx === 0 ? "not-allowed" : "pointer", opacity: panelIdx === 0 ? 0.4 : 1, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.88rem" }}>
                  ← Trước
                </button>
                {isLastPanel ? (
                  <button onClick={() => setPhase("vocab")}
                    style={{ flex: 2, padding: "10px 0", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", cursor: "pointer", fontWeight: 800, fontFamily: "var(--font-body)", fontSize: "0.88rem" }}>
                    Học từ vựng →
                  </button>
                ) : (
                  <button onClick={() => setPanelIdx(p => p + 1)}
                    style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-body)", fontSize: "0.88rem" }}>
                    Tiếp →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Vocab phase ─────────────────────────────────────────── */}
          {phase === "vocab" && (
            <div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: 14 }}>
                Những từ vựng xuất hiện trong câu chuyện — nhấn 🔊 để nghe phát âm.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
                {point.vocabulary.map((v, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", borderRadius: 10, padding: "11px 14px" }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 800, fontSize: "0.98rem", color: "var(--primary)" }}>{v.en}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginLeft: 10 }}>— {v.vi}</span>
                    </div>
                    <button onClick={() => speak(v.en)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}>🔊</button>
                  </div>
                ))}
              </div>
              <button onClick={() => setPhase("quiz")}
                style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", cursor: "pointer", fontWeight: 800, fontFamily: "var(--font-body)" }}>
                Làm quiz →
              </button>
            </div>
          )}

          {/* ── Quiz phase ──────────────────────────────────────────── */}
          {phase === "quiz" && (
            <div>
              <p style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 16, lineHeight: 1.55 }}>
                {point.quiz.question_en}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {point.quiz.options.map((opt, i) => {
                  const isCorrect = i === point.quiz.answer;
                  const isSelected = selectedAnswer === i;
                  let bg = "var(--surface)", border = "1.5px solid var(--border)", color = "var(--text)";
                  if (answered && isSelected && isCorrect) { bg = "#D1FAE5"; border = "2px solid #10B981"; color = "#065F46"; }
                  else if (answered && isSelected && !isCorrect) { bg = "#FEE2E2"; border = "2px solid #EF4444"; color = "#991B1B"; }
                  else if (answered && isCorrect) { bg = "#D1FAE5"; border = "2px solid #10B981"; color = "#065F46"; }
                  return (
                    <button key={i} onClick={() => { if (!answered) { setSelectedAnswer(i); setAnswered(true); } }}
                      disabled={answered}
                      style={{ padding: "12px 16px", borderRadius: 10, border, background: bg, cursor: answered ? "default" : "pointer", textAlign: "left", fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: isSelected ? 700 : 500, color, transition: "all 0.15s" }}>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Fun fact after answer */}
              {answered && (
                <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: selectedAnswer === point.quiz.answer ? "#ECFDF5" : "#FFFBEB", border: `1.5px solid ${selectedAnswer === point.quiz.answer ? "#10B981" : "#F59E0B"}` }}>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 6 }}>
                    {selectedAnswer === point.quiz.answer ? "✅ Đúng rồi!" : `💡 Đáp án đúng: ${point.quiz.options[point.quiz.answer]}`}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text)", lineHeight: 1.55, marginBottom: 6 }}>{point.funFact.vi}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5, fontStyle: "italic" }}>{point.funFact.en}</div>
                </div>
              )}

              {answered && (
                <button onClick={isCompleted ? onClose : handleFinish} disabled={completing}
                  style={{ width: "100%", padding: "13px 0", borderRadius: 10, border: "none", background: isCompleted ? "var(--surface)" : "linear-gradient(135deg, var(--primary), var(--accent))", color: isCompleted ? "var(--text)" : "#fff", cursor: completing ? "not-allowed" : "pointer", fontWeight: 800, fontFamily: "var(--font-body)", fontSize: "0.95rem" }}>
                  {completing ? "Đang lưu..." : isCompleted ? "Đóng" : `🎉 Hoàn thành — Nhận ${point.xpReward} XP`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function VillagePage() {
  const { data: session, status } = useSession();
  const [selectedPoint, setSelectedPoint] = useState<VillageMapPoint | null>(null);
  const [completed, setCompleted] = useState<CompletedPoints>({});
  const [loading, setLoading] = useState(true);

  const isStudent = session?.user?.role === "STUDENT";

  useEffect(() => {
    if (status === "loading") return;
    if (!isStudent) { setLoading(false); return; }
    fetch("/api/village/progress")
      .then(r => r.json())
      .then(d => { setCompleted(d.completed ?? {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status, isStudent]);

  function handleComplete(pointId: string, xp: number) {
    setCompleted(prev => ({ ...prev, [pointId]: { completedAt: Date.now(), xpEarned: xp } }));
  }

  const completedCount = Object.keys(completed).length;
  const totalPoints = VILLAGE_MAP_POINTS.length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.7rem", margin: 0 }}>
              🗺️ Learn English Through My Village
            </h1>
            <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: "0.9rem" }}>
              Khám phá 6 buôn làng Tây Nguyên — đọc câu chuyện, học từ mới, làm quiz
            </p>
          </div>
          {isStudent && !loading && (
            <div style={{ background: "var(--surface)", borderRadius: 14, padding: "12px 20px", textAlign: "center", border: "1.5px solid var(--border)", minWidth: 120 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, color: "var(--primary)" }}>
                {completedCount}/{totalPoints}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>Đã khám phá</div>
              <div style={{ height: 5, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(completedCount / totalPoints) * 100}%`, background: "var(--primary)", borderRadius: 3, transition: "width 0.5s" }} />
              </div>
            </div>
          )}
          {!isStudent && status === "authenticated" && (
            <div style={{ background: "#FFF8E7", border: "1.5px solid #F0D080", borderRadius: 12, padding: "10px 16px", fontSize: "0.83rem", color: "#7A5C00" }}>
              👁️ Chế độ xem — tiến độ chỉ lưu cho học sinh
            </div>
          )}
          {status === "unauthenticated" && (
            <div style={{ background: "#FFF8E7", border: "1.5px solid #F0D080", borderRadius: 12, padding: "10px 16px", fontSize: "0.83rem", color: "#7A5C00" }}>
              📖 <a href="/login" style={{ color: "var(--primary)", fontWeight: 700 }}>Đăng nhập</a> để lưu tiến độ khám phá
            </div>
          )}
        </div>
      </div>

      {/* MAP */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 16px" }}>
        <div style={{ position: "relative", width: "100%", borderRadius: 20, overflow: "hidden", border: "2px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
          {/* Background — thay bằng ảnh thật khi có */}
          <div style={{
            width: "100%", paddingTop: "56.25%", position: "relative",
            // ── Đặt ảnh bản đồ tại public/images/village-map.png rồi thay dòng dưới ──
            background: "url('/images/village_map.png') center/cover no-repeat, linear-gradient(135deg,#8BC34A 0%,#4CAF50 30%,#A5D6A7 60%,#FF9800 100%)",
          }}>
            {/* Hotspot buttons */}
            {VILLAGE_MAP_POINTS.map(point => {
              const done = !!completed[point.id];
              return (
                <button key={point.id}
                  onClick={() => setSelectedPoint(point)}
                  title={point.titleVi}
                  style={{
                    position: "absolute",
                    left: `${point.mapPosition.x}%`,
                    top: `${point.mapPosition.y}%`,
                    transform: "translate(-50%, -50%)",
                    width: 52, height: 52, borderRadius: "50%",
                    background: done ? "rgba(16,185,129,0.95)" : "rgba(255,255,255,0.95)",
                    border: `3px solid ${done ? "#10B981" : "var(--primary)"}`,
                    cursor: "pointer", zIndex: 10,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.4rem",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.28)",
                    transition: "transform 0.18s, box-shadow 0.18s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translate(-50%,-50%) scale(1.2)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.38)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translate(-50%,-50%) scale(1)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.28)"; }}>
                  {done ? "✅" : point.emoji}
                </button>
              );
            })}

            {/* Labels */}
            {VILLAGE_MAP_POINTS.map(point => {
              const done = !!completed[point.id];
              const flipLeft = point.mapPosition.x > 60;
              return (
                <div key={`lbl-${point.id}`} style={{
                  position: "absolute",
                  left: flipLeft ? `calc(${point.mapPosition.x}% - 36px)` : `calc(${point.mapPosition.x}% + 32px)`,
                  top: `${point.mapPosition.y}%`,
                  transform: flipLeft ? "translate(-100%, -50%)" : "translate(0, -50%)",
                  background: "rgba(255,255,255,0.92)",
                  borderRadius: 7, padding: "3px 8px",
                  fontSize: "0.68rem", fontWeight: 700,
                  color: done ? "#065F46" : "var(--primary)",
                  pointerEvents: "none", whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}>
                  {point.titleVi}
                </div>
              );
            })}

            <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(255,255,255,0.9)", borderRadius: 10, padding: "7px 12px", fontSize: "0.73rem", color: "var(--text)", fontWeight: 600 }}>
              👆 Nhấn vào điểm trên bản đồ để bắt đầu
            </div>
          </div>
        </div>
      </div>

      {/* Grid cards */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "8px 24px 48px" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", marginBottom: 14 }}>
          📍 6 buôn làng cần khám phá
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {VILLAGE_MAP_POINTS.map(point => {
            const done = !!completed[point.id];
            return (
              <button key={point.id} onClick={() => setSelectedPoint(point)}
                style={{
                  background: done ? "#F0FDF4" : "var(--bg-card)",
                  borderRadius: 14, border: `2px solid ${done ? "#10B981" : "var(--border)"}`,
                  padding: "14px 16px", cursor: "pointer", textAlign: "left",
                  fontFamily: "var(--font-body)", transition: "transform 0.15s, box-shadow 0.15s",
                  boxShadow: "var(--shadow)",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow)"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: "1.6rem" }}>{done ? "✅" : point.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.88rem" }}>{point.titleVi}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.73rem" }}>{point.titleEn}</div>
                  </div>
                </div>
                <div style={{ fontSize: "0.79rem", color: "var(--text-muted)", marginBottom: 8, lineHeight: 1.45 }}>
                  {point.descriptionVi}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.73rem", color: done ? "#065F46" : "var(--primary)", fontWeight: 700 }}>
                    {done ? "✓ Đã hoàn thành" : `+${point.xpReward} XP`}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    {point.story.length} phần · {point.vocabulary.length} từ
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {selectedPoint && (
        <VillagePointModal
          point={selectedPoint}
          isCompleted={!!completed[selectedPoint.id]}
          onClose={() => setSelectedPoint(null)}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
