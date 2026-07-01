"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { STORIES } from "@/data/stories";
import { CULTURAL_GROUPS } from "@/data/culture";
import { useProgress } from "@/lib/hooks";
import StoryCard from "@/components/ui/StoryCard";

export default function HomePage() {
  const { getStoryProgress, getStoriesRead, getTotalWords } = useProgress();
  const storiesRead = getStoriesRead(STORIES);
  const wordsLearned = getTotalWords(STORIES);
  const { data: session, status } = useSession();

  const features = [
    {
      icon: "📖",
      title: "Truyện tranh song ngữ",
      desc: "Học tiếng Anh qua những câu chuyện gần gũi với văn hóa Tây Nguyên, hiển thị song song tiếng Việt và tiếng Anh"
    },
    {
      icon: "🎮",
      title: "Trò chơi từ vựng",
      desc: "Ôn tập từ vựng bằng các trò chơi tương tác và câu hỏi ngắn giúp ghi nhớ kiến thức hiệu quả hơn"
    },
    {
      icon: "🌿",
      title: "Nội dung gắn với văn hóa địa phương",
      desc: "Khám phá lễ hội, nghề truyền thống, đời sống và bản sắc văn hóa của các dân tộc thiểu số qua từng bài học"
    },
    {
      icon: "🧑‍🏫",
      title: "Công cụ tạo học liệu",
      desc: "Giáo viên có thể tạo và chỉnh sửa truyện tranh song ngữ phù hợp với học sinh và bối cảnh địa phương"
    },
    {
      icon: "📊",
      title: "Theo dõi tiến độ học tập",
      desc: "Lưu kết quả học tập, theo dõi quá trình hoàn thành bài học và mức độ tiến bộ của học sinh"
    },
    {
      icon: "🏅",
      title: "Bảng xếp hạng & huy hiệu",
      desc: "Học sinh tích lũy điểm kinh nghiệm, nhận huy hiệu thành tích và cạnh tranh trên bảng xếp hạng toàn hệ thống"
    },
    {
      icon: "🤖",
      title: "Hỗ trợ bởi AI",
      desc: "Ứng dụng AI để hỗ trợ xây dựng nội dung học tập và mở rộng kho học liệu trong tương lai"
    },
    {
      icon: "📴",
      title: "Hoạt động ngoại tuyến",
      desc: "Có thể cài đặt như ứng dụng và tiếp tục sử dụng một số nội dung đã tải khi mất kết nối Internet"
    }
  ];

  return (
    <>
      <section style={{ padding: "60px 24px 50px", textAlign: "center", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, var(--surface) 0%, #FFF8F0 60%, #FFF3E0 100%)" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(232,100,58,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(249,168,37,0.1) 0%, transparent 50%)" }} />
        <div style={{ position: "relative", maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 20, background: "var(--primary)", color: "white", fontSize: "0.8rem", fontWeight: 700, marginBottom: 16 }}>
            🌄 Highland English Horizon · AI · Văn hóa Tây Nguyên
          </div>
          <h1 style={{ color: "var(--text)", marginBottom: 12 }}>
            Học Tiếng Anh Qua Truyện Tranh<br /><span style={{ color: "var(--primary)" }}>Với Sức Mạnh Của AI</span>
          </h1>
          <p style={{ color: "var(--text-light)", fontSize: "1.05rem", marginBottom: 28 }}>
            Nền tảng học tiếng Anh dành cho học sinh dân tộc thiểu số vùng Tây Nguyên — truyện tranh tương tác, trò chơi, luyện nói và học liệu được AI tạo tự động, gắn liền với văn hóa địa phương.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/library" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px", borderRadius: 16, background: "var(--primary)", color: "white", fontWeight: 700, fontSize: "1.05rem", textDecoration: "none" }}>📚 Bài học mẫu</Link>
            {/* <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px", borderRadius: 16, background: "transparent", color: "var(--primary)", border: "2px solid var(--primary)", fontWeight: 700, fontSize: "1.05rem", textDecoration: "none" }}>🧑‍🏫 Tạo tài khoản giáo viên</Link> */}
          </div>
          <div style={{ display: "flex", gap: 32, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
            {[{ num: storiesRead, label: "Truyện đã đọc" }, { num: wordsLearned, label: "Từ đã học" }, { num: 6, label: "Dân tộc" }, { num: 30, label: "Từ vựng mẫu" }].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, color: "var(--primary)" }}>{s.num}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "40px 0", background: "var(--surface)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, marginBottom: 24 }}>✨ Tính năng nổi bật</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 20 }}>
            {features.map(f => (
              <div key={f.title} style={{ background: "var(--bg-card)", borderRadius: 16, border: "1.5px solid var(--border)", padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "40px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800 }}>📚 Truyện mẫu nổi bật</h2>
            <Link href="/library" style={{ padding: "7px 15px", borderRadius: 10, border: "2px solid var(--primary)", color: "var(--primary)", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none" }}>Xem tất cả →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 20 }}>
            {STORIES.map(s => <StoryCard key={s.id} story={s} progress={getStoryProgress(s.id)} />)}
          </div>
        </div>
      </section>

      <section style={{ padding: "40px 0", background: "var(--surface)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            🌿 Kho dữ liệu văn hóa
          </h2>

          <p
            style={{
              color: "var(--text-muted)",
              marginBottom: 20,
              fontSize: "0.92rem",
            }}
          >
            6 nhóm văn hóa dân tộc được tích hợp vào hệ thống học liệu,
            giúp bài học tiếng Anh gắn với bối cảnh đời sống và bản sắc địa phương.
            Trọng tâm hiện nay là các cộng đồng K&apos;Ho, Mạ và M&apos;Nông tại Tây Nguyên.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))",
              gap: 16,
            }}
          >
            {CULTURAL_GROUPS.map((c) => (
              <div
                key={c.slug}
                style={{
                  background: "var(--bg-card)",
                  borderRadius: 16,
                  border: "1.5px solid var(--border)",
                  padding: 18,
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: "2.2rem" }}>{c.emoji}</span>

                <div>
                  <h3 style={{ marginBottom: 4 }}>Người {c.nameVi}</h3>

                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {c.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "50px 24px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, marginBottom: 8 }}>🚀 Sẵn sàng bắt đầu?</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Học sinh, giáo viên và quản trị viên — mỗi vai trò có một bảng điều khiển riêng.</p>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {status === "authenticated" && session?.user ? (
            <Link
              href={
                session.user.role === "ADMIN"
                  ? "/dashboard/admin"
                  : session.user.role === "TEACHER"
                    ? "/dashboard/teacher"
                    : "/dashboard/student"
              }
              style={{
                padding: "12px 28px",
                borderRadius: 14,
                background: "var(--primary)",
                color: "white",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              🚀 Vào bảng điều khiển
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                style={{
                  padding: "12px 28px",
                  borderRadius: 14,
                  border: "2px solid var(--primary)",
                  color: "var(--primary)",
                  fontWeight: 700,
                  textDecoration: "none",
                  width: 150,
                }}
              >
                Đăng ký
              </Link>

              <Link
                href="/login"
                style={{
                  padding: "12px 28px",
                  borderRadius: 14,
                  background: "var(--primary)",
                  color: "white",
                  fontWeight: 700,
                  textDecoration: "none",
                  width: 150,
                }}
              >
                Đăng nhập
              </Link>
            </>
          )}
        </div>
      </section>
    </>
  );
}
