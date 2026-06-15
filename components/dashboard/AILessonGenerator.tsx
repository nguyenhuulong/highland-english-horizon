"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/Feedback";
import { CULTURAL_GROUPS } from "@/data/culture";
import type { AILessonInput, LessonDTO } from "@/types";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: "2px solid var(--border)", background: "var(--bg-card)", color: "var(--text)",
  fontFamily: "var(--font-body)", fontSize: "0.92rem", outline: "none",
};

const labelStyle: React.CSSProperties = { display: "block", fontWeight: 700, marginBottom: 6, fontSize: "0.88rem" };

export default function AILessonGenerator() {
  const router = useRouter();
  const [form, setForm] = useState<AILessonInput>({
    topic: "Lễ hội cồng chiêng",
    ethnicGroup: "M'Nông",
    ageGroup: 10,
    vocabulary: ["festival", "music", "dance", "gong"],
    objective: "Luyện kỹ năng đọc hiểu và từ vựng.",
    level: 1,
  });
  const [vocabText, setVocabText] = useState(form.vocabulary.join(", "));
  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState<LessonDTO | null>(null);
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    setLoading(true);
    setLesson(null);
    const res = await fetch("/api/ai/generate-lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        vocabulary: vocabText.split(",").map((w) => w.trim()).filter(Boolean),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      showToast(data.error || "Không thể tạo bài học. Kiểm tra cấu hình AI_BASE_URL/AI_API_KEY trong .env.", "error");
      return;
    }
    setLesson(data.lesson);
    showToast("AI đã tạo xong bài học! Hãy xem trước bên dưới.", "success");
  };

  const save = async (status: "DRAFT" | "PUBLISHED") => {
    if (!lesson) return;
    setSaving(true);
    const res = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lesson, status }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      showToast(data.error || "Không thể lưu bài học", "error");
      return;
    }
    showToast(status === "PUBLISHED" ? "Đã xuất bản bài học! 🎉" : "Đã lưu bản nháp!", "success");
    router.push("/dashboard/teacher/lessons");
  };

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>🤖 AI Lesson Generator</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
        Nhập chủ đề bài học, AI sẽ tự động tạo truyện tranh song ngữ, từ vựng, đố vui và nhiệm vụ khám phá văn hóa.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "flex-start" }}>
        <div style={{ background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 14, padding: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Chủ đề bài học</label>
            <input style={inputStyle} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="VD: Lễ hội cồng chiêng" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Nhóm dân tộc</label>
              <select style={inputStyle} value={form.ethnicGroup} onChange={(e) => setForm({ ...form, ethnicGroup: e.target.value })}>
                {CULTURAL_GROUPS.map((g) => <option key={g.slug} value={g.nameVi}>{g.emoji} {g.nameVi}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Độ tuổi học sinh</label>
              <input style={inputStyle} type="number" min={5} max={18} value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: parseInt(e.target.value) || 10 })} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Cấp độ</label>
            <select style={inputStyle} value={form.level} onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) as 1 | 2 | 3 })}>
              <option value={1}>Cấp độ 1 — Cơ bản</option>
              <option value={2}>Cấp độ 2 — Trung bình</option>
              <option value={3}>Cấp độ 3 — Nâng cao</option>
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Từ vựng mục tiêu (cách nhau bởi dấu phẩy)</label>
            <input style={inputStyle} value={vocabText} onChange={(e) => setVocabText(e.target.value)} placeholder="festival, music, dance, gong" />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Mục tiêu bài học</label>
            <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} />
          </div>

          <button onClick={generate} disabled={loading} style={{ width: "100%", padding: "12px 24px", borderRadius: 10, background: "var(--primary)", color: "white", border: "none", fontWeight: 800, fontSize: "1rem", cursor: "pointer", fontFamily: "var(--font-body)" }}>
            {loading ? "✨ AI đang sáng tạo..." : "✨ Tạo bài học bằng AI"}
          </button>
        </div>

        <div>
          {!lesson && !loading && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", border: "2px dashed var(--border)", borderRadius: 14 }}>
              Kết quả xem trước sẽ hiển thị ở đây.
            </div>
          )}
          {loading && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", border: "2px dashed var(--border)", borderRadius: 14 }}>
              🦜 AI đang viết truyện, soạn từ vựng, câu hỏi và nhiệm vụ văn hóa...
            </div>
          )}
          {lesson && (
            <div style={{ background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 14, padding: 20, maxHeight: 640, overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: "1.6rem" }}>{lesson.emoji}</span>
                <div>
                  <div style={{ fontWeight: 800 }}>{lesson.titleVi}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{lesson.titleEn}</div>
                </div>
              </div>
              <p style={{ fontSize: "0.88rem", color: "var(--text-light)", marginBottom: 14 }}>{lesson.descriptionVi}</p>

              <div style={{ marginBottom: 14 }}>
                <strong style={{ fontSize: "0.85rem" }}>📝 Từ vựng ({lesson.vocabulary.length})</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {lesson.vocabulary.map((v, i) => (
                    <span key={i} style={{ fontSize: "0.78rem", padding: "4px 10px", borderRadius: 20, background: "var(--surface)", fontWeight: 600 }}>
                      {v.en} – {v.vi}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <strong style={{ fontSize: "0.85rem" }}>🖼️ Truyện tranh ({lesson.panels.length} cảnh)</strong>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                  {lesson.panels.map((p, i) => (
                    <div key={i} style={{ padding: 10, borderRadius: 10, background: "var(--surface)", fontSize: "0.82rem" }}>
                      <div style={{ fontWeight: 700, marginBottom: 4, color: "var(--text-muted)" }}>Cảnh {i + 1}: {p.scene}</div>
                      {p.dialogue.map((d, j) => (
                        <div key={j} style={{ marginBottom: 2 }}>
                          <strong>{d.character}:</strong> {d.en} <span style={{ color: "var(--text-muted)" }}>— {d.vi}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <strong style={{ fontSize: "0.85rem" }}>🎯 Đố vui ({lesson.quiz.length} câu)</strong>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                  {lesson.quiz.map((q, i) => (
                    <div key={i} style={{ fontSize: "0.82rem", padding: 8, background: "var(--surface)", borderRadius: 8 }}>
                      {i + 1}. {q.question_en}
                    </div>
                  ))}
                </div>
              </div>

              {lesson.missions.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <strong style={{ fontSize: "0.85rem" }}>🧭 Nhiệm vụ văn hóa</strong>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                    {lesson.missions.map((m, i) => (
                      <div key={i} style={{ fontSize: "0.82rem", padding: 8, background: "var(--surface)", borderRadius: 8 }}>
                        <strong>{m.title}</strong> — {m.prompt}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button onClick={() => save("DRAFT")} disabled={saving} style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "1.5px solid var(--border)", background: "none", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                  Lưu bản nháp
                </button>
                <button onClick={() => save("PUBLISHED")} disabled={saving} style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "none", background: "var(--secondary)", color: "white", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                  {saving ? "Đang lưu..." : "Xuất bản ngay"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
