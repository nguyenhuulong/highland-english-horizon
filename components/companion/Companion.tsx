"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

let companionBus: ((msg: string) => void) | null = null;

export function sayCompanion(msg: string) {
  companionBus?.(msg);
}

const PAGE_GREETINGS: Record<string, string> = {
  "/": "Chào mừng đến với Highland English Horizon! 🌄",
  "/library": "Chọn một truyện để bắt đầu hành trình nhé!",
  "/games": "Cùng chơi và ôn từ vựng nào! 🎮",
  "/progress": "Xem hành trình học tập của bạn ở đây!",
  "/creator": "Hãy tạo một câu chuyện thật hay nhé!",
  "/dashboard/student": "Hôm nay bạn muốn học gì nào?",
  "/dashboard/teacher": "Sẵn sàng tạo bài học mới với AI chưa?",
};

function getGreeting(pathname: string, role?: string) {
  if (!role) {
    switch (pathname) {
      case "/":
        return "Chào mừng đến với Highland English Horizon! 🌄";

      case "/library":
        return "Khám phá những bài học mẫu nhé!";

      default:
        return "Cùng khám phá hệ thống nhé!";
    }
  }

  if (role === "STUDENT") {
    switch (pathname) {
      case "/library":
        return "📖 Chọn một truyện để bắt đầu học nhé!";

      case "/games":
        return "🎮 Cùng chơi và ôn từ vựng nào!";

      case "/progress":
        return "📊 Xem hành trình học tập của bạn ở đây!";

      default:
        return "🌄 Hôm nay học thêm một truyện nhé!";
    }
  }

  if (role === "TEACHER") {
    switch (pathname) {
      case "/creator":
        return "🤖 Sẵn sàng tạo học liệu mới chưa?";

      default:
        return "👩‍🏫 Chúc bạn có một buổi dạy hiệu quả!";
    }
  }

  if (role === "ADMIN") {
    return "📊 Hệ thống đang hoạt động ổn định.";
  }

  if (role === "ADMIN") {
    return "🛠️ Kiểm tra vận hành hệ thống.";
  }

  return "Cố lên nhé! 💪";
}

export default function Companion() {
  const pathname = usePathname();
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const { data: session } = useSession();

  const role = session?.user?.role;

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    companionBus = show;
    return () => {
      companionBus = null;
    };
  }, [show]);

  useEffect(() => {
    const greeting = getGreeting(pathname, role);

    const t = setTimeout(() => show(greeting), 600);

    return () => clearTimeout(t);
  }, [pathname, role, show]);

  if (pathname?.startsWith("/login") || pathname?.startsWith("/register")) return null;

  return (
    <div style={{ position: "fixed", bottom: 20, left: 20, zIndex: 900, display: "flex", alignItems: "flex-end", gap: 10 }}>
      {visible && message && (
        <div
          className="animate-slide-up"
          style={{
            background: "var(--bg-card)", border: "2px solid var(--primary-light)",
            borderRadius: "16px 16px 16px 4px", padding: "10px 16px", maxWidth: 220,
            fontSize: "0.85rem", fontWeight: 600, color: "var(--text)", boxShadow: "var(--shadow)",
          }}
        >
          {message}
        </div>
      )}
      <button
        onClick={() =>
          show(getGreeting(pathname, role))
        }
        title="Người bạn đồng hành"
        className="animate-float"
        style={{
          width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "linear-gradient(135deg, var(--primary), var(--accent))", fontSize: "1.8rem",
          display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-lg)",
          flexShrink: 0,
        }}
      >
        🦜
      </button>
    </div>
  );
}
