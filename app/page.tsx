"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { STORIES } from "@/data/stories";
import { CULTURAL_GROUPS } from "@/data/culture";
import { useProgress } from "@/lib/hooks";
import StoryCard from "@/components/ui/StoryCard";
import EthnicModal from "@/components/ui/EthnicModal";

type CulturalGroup = typeof CULTURAL_GROUPS[0];

const FEATURES = [
  {
    icon: "📖",
    title: "Story World",
    subtitle: "Thư viện truyện tranh",
    desc: "Đọc truyện tranh song ngữ Anh–Việt với ảnh minh họa AI, nhân vật mặc trang phục dân tộc thật, lời thoại tự nhiên.",
    detail: "Mỗi bài học là một câu chuyện có ảnh AI sinh riêng cho từng khung tranh. Bấm nghe phát âm từng câu, tra nghĩa từ vựng ngay trong lúc đọc.",
    color: "#E8F5E9",
  },
  {
    icon: "🌿",
    title: "Culture Hub",
    subtitle: "Kho văn hóa dân tộc",
    desc: "Khám phá lễ hội, trang phục, ẩm thực và ngôn ngữ của 6 dân tộc thiểu số Tây Nguyên qua bài học tương tác.",
    detail: "Dữ liệu văn hóa 6 dân tộc (K'Ho, Mạ, M'Nông, H'Mông, Tày, Nùng) được tích hợp vào từng bài học. Tên lễ hội, nhạc cụ, món ăn đều chính xác theo nghiên cứu thực địa.",
    color: "#F3E5F5",
  },
  {
    icon: "🎮",
    title: "Learn & Play",
    subtitle: "5 trò chơi từ vựng",
    desc: "Ôn tập từ vựng qua trò chơi tương tác: lật thẻ, ghép đôi, đố vui có đồng hồ, điền từ vào câu, luyện phát âm.",
    detail: "5 loại trò chơi mỗi bài: Lật thẻ (90 giây), Ghép đôi, Đố vui (15 giây/câu, streak bonus), Điền từ (dùng câu thoại thật trong truyện), Luyện nói (Web Speech API chấm điểm 0–100).",
    color: "#FFF8E1",
  },
  {
    icon: "🤖",
    title: "AI-Powered",
    subtitle: "Học liệu do AI tạo",
    desc: "Giáo viên mô tả chủ đề — AI tự viết kịch bản, sinh ảnh nhân vật 2D, tạo từ vựng và bài tập trong vài phút.",
    detail: "AI trong hệ thống: Together.ai FLUX sinh ảnh nhân vật hoạt hình và ảnh bối cảnh. Groq LLM viết kịch bản song ngữ và bài tập. Vision LLM đọc ảnh trang phục tham khảo để giữ tính chính xác văn hóa.",
    color: "#E3F2FD",
  },
];

export default function HomePage() {
  const { getStoryProgress, getStoriesRead, getTotalWords } = useProgress();
  const storiesRead = getStoriesRead(STORIES);
  const wordsLearned = getTotalWords(STORIES);
  const { data: session, status } = useSession();
  const isGuest = status !== "authenticated";

  const [selectedEthnic, setSelectedEthnic] = useState<CulturalGroup | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<typeof FEATURES[0] | null>(null);

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: "60px 24px 50px", textAlign: "center", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, var(--surface) 0%, #FFF8F0 60%, #FFF3E0 100%)" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(232,100,58,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(249,168,37,0.1) 0%, transparent 50%)" }} />
        <div style={{ position: "relative", maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 20, background: "var(--primary)", color: "white", fontSize: "0.8rem", fontWeight: 700, marginBottom: 16 }}>
            🌄 Highland English Horizon · AI · Văn hóa Tây Nguyên
          </div>
          <h1 style={{ color: "var(--text)", marginBottom: 12 }}>
            Học Tiếng Anh Qua Truyện Tranh<br /><span style={{ color: "var(--primary)" }}>Gắn Với Văn Hóa Của Mình</span>
          </h1>
          <p style={{ color: "var(--text-light)", fontSize: "1.05rem", marginBottom: 12 }}>
            Nền tảng học tiếng Anh dành cho học sinh dân tộc thiểu số vùng Tây Nguyên — truyện tranh song ngữ với ảnh AI, trò chơi tương tác, luyện nói và học liệu gắn liền với văn hóa địa phương.
          </p>
          {isGuest && (
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: 20 }}>
              📚 Phụ huynh có thể <strong>đọc truyện cùng con</strong> ngay mà không cần đăng nhập.
              <Link href="/login" style={{ color: "var(--primary)", fontWeight: 700, marginLeft: 6 }}>Đăng nhập để lưu tiến độ →</Link>
            </p>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
            <Link href="/library" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px", borderRadius: 16, background: "var(--primary)", color: "white", fontWeight: 700, fontSize: "1.05rem", textDecoration: "none" }}>
              📚 Vào thư viện
            </Link>
            {isGuest && (
              <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px", borderRadius: 16, background: "transparent", color: "var(--primary)", border: "2px solid var(--primary)", fontWeight: 700, fontSize: "1.05rem", textDecoration: "none" }}>
                Đăng nhập
              </Link>
            )}
          </div>
          <div style={{ display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { num: storiesRead, label: "Truyện đã đọc" },
              { num: wordsLearned, label: "Từ đã học" },
              { num: 6, label: "Dân tộc" },
              { num: 5, label: "Loại trò chơi" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, color: "var(--primary)" }}>{s.num}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tính năng nổi bật (có modal) ────────────────────────────────── */}
      <section style={{ padding: "40px 0", background: "var(--surface)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, marginBottom: 8 }}>✨ Tính năng nổi bật</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 20, fontSize: "0.9rem" }}>Nhấn vào mỗi tính năng để xem chi tiết</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 16 }}>
            {FEATURES.map((f) => (
              <button key={f.title} onClick={() => setSelectedFeature(f)}
                style={{
                  background: f.color, borderRadius: 16, border: "1.5px solid var(--border)",
                  padding: 24, textAlign: "center", cursor: "pointer",
                  fontFamily: "var(--font-body)", transition: "transform 0.15s, box-shadow 0.15s",
                  boxShadow: "var(--shadow)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow)"; }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>{f.icon}</div>
                <h3 style={{ margin: "0 0 2px", fontSize: "1.05rem", fontFamily: "var(--font-display)" }}>{f.title}</h3>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 8 }}>{f.subtitle}</div>
                <p style={{ color: "var(--text)", fontSize: "0.87rem", margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Truyện mẫu ──────────────────────────────────────────────────── */}
      <section style={{ padding: "40px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800 }}>📚 Story World — Truyện mẫu nổi bật</h2>
            <Link href="/library" style={{ padding: "7px 15px", borderRadius: 10, border: "2px solid var(--primary)", color: "var(--primary)", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none" }}>Xem tất cả →</Link>
          </div>
          {isGuest && (
            <div style={{ padding: "12px 18px", background: "#fff8e7", border: "1.5px solid #f0d080", borderRadius: 10, marginBottom: 20, fontSize: "0.88rem", color: "#7a5c00" }}>
              📖 Bạn đang xem <strong>truyện mẫu miễn phí</strong>.
              <Link href="/login" style={{ color: "var(--primary)", fontWeight: 700, marginLeft: 6 }}>Đăng nhập để xem thêm bài học do giáo viên tạo bằng AI →</Link>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 20 }}>
            {STORIES.map((s) => <StoryCard key={s.id} story={s} progress={getStoryProgress(s.id)} />)}
          </div>
        </div>
      </section>

      {/* ─── Culture Hub — 6 dân tộc (có modal) ─────────────────────────── */}
      <section style={{ padding: "40px 0", background: "var(--surface)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, marginBottom: 8 }}>🌿 Culture Hub — Kho văn hóa dân tộc</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 20, fontSize: "0.92rem" }}>
            6 dân tộc tiêu biểu tại Đắk Nông, Tây Nguyên — K&apos;Ho, Mạ, M&apos;Nông, H&apos;Mông, Tày, Nùng — được tích hợp vào học liệu. Nhấn vào để khám phá lễ hội, trang phục, âm nhạc và ẩm thực kèm từ vựng tiếng Anh tương tác.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 16 }}>
            {CULTURAL_GROUPS.map((c) => (
              <button key={c.slug} onClick={() => setSelectedEthnic(c)}
                style={{
                  background: "var(--bg-card)", borderRadius: 16, border: "1.5px solid var(--border)",
                  padding: 18, display: "flex", gap: 14, alignItems: "flex-start",
                  cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body)",
                  transition: "transform 0.15s, box-shadow 0.15s", boxShadow: "var(--shadow)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow)"; }}>
                <span style={{ fontSize: "2.2rem", flexShrink: 0 }}>{c.emoji}</span>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "1rem", fontFamily: "var(--font-display)" }}>Người {c.nameVi}</h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 8px", lineHeight: 1.5 }}>
                    {c.description.slice(0, 80)}...
                  </p>
                  <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 700 }}>
                    Nhấn để khám phá →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: "50px 24px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, marginBottom: 8 }}>🚀 Sẵn sàng bắt đầu?</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Học sinh, giáo viên và quản trị viên — mỗi vai trò có một bảng điều khiển riêng.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {status === "authenticated" && session?.user ? (
            <Link href={session.user.role === "ADMIN" ? "/dashboard/admin" : session.user.role === "TEACHER" ? "/dashboard/teacher" : "/dashboard/student"}
              style={{ padding: "12px 28px", borderRadius: 14, background: "var(--primary)", color: "white", fontWeight: 700, textDecoration: "none" }}>
              🚀 Vào bảng điều khiển
            </Link>
          ) : (
            <>
              <Link href="/register" style={{ padding: "12px 28px", borderRadius: 14, border: "2px solid var(--primary)", color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
                Đăng ký
              </Link>
              <Link href="/login" style={{ padding: "12px 28px", borderRadius: 14, background: "var(--primary)", color: "white", fontWeight: 700, textDecoration: "none" }}>
                Đăng nhập
              </Link>
            </>
          )}
        </div>
      </section>

      {/* ─── Modals ───────────────────────────────────────────────────────── */}
      {selectedEthnic && <EthnicModal group={selectedEthnic} onClose={() => setSelectedEthnic(null)} />}

      {selectedFeature && (
        <div onClick={() => setSelectedFeature(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px" }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-card)", borderRadius: 20, maxWidth: 680, width: "100%", padding: 32, overflow: "hidden",
              boxShadow: "0 24px 80px rgba(0,0,0,.35)",
              maxHeight: "90vh",
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
              transformOrigin: "center center",
              position: "relative"
            }}>
            <button onClick={() => setSelectedFeature(null)}
              style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--bg-card)", cursor: "pointer", fontSize: "1rem" }}>
              ✕
            </button>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>{selectedFeature.icon}</div>
            <h2 style={{ fontFamily: "var(--font-display)", margin: "0 0 4px" }}>{selectedFeature.title}</h2>
            <div style={{ color: "var(--text-muted)", marginBottom: 16, fontWeight: 600 }}>{selectedFeature.subtitle}</div>
            <p style={{ lineHeight: 1.7, color: "var(--text)", marginBottom: 20 }}>{selectedFeature.detail}</p>
            <Link href="/library" onClick={() => setSelectedFeature(null)}
              style={{ display: "block", padding: "11px 0", borderRadius: 10, background: "var(--primary)", color: "#fff", fontWeight: 700, textAlign: "center", textDecoration: "none" }}>
              📚 Thử ngay →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
