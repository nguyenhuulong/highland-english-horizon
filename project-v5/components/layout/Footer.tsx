"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

const GUEST_LINKS = [
  { href: "/library", label: "📚 Bài học mẫu" },
  { href: "/", label: "📝 Giới thiệu" },
  { href: "/#", label: "📞 Liên hệ" },
];

const USER_LINKS = [
  { href: "/library", label: "📚 Thư viện" },
  { href: "/games", label: "🎮 Trò chơi" },
  { href: "/progress", label: "📊 Tiến độ" },
];

export default function Footer() {
  const { status } = useSession();

  const links =
    status === "authenticated"
      ? USER_LINKS
      : GUEST_LINKS;

  return (
    <footer
      style={{
        background: "var(--surface)", borderTop: "2px solid var(--border)",
        padding: "32px 24px", textAlign: "center",
      }}
    >
      <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--primary)", marginBottom: 8 }}>
        🌄 Highland English Horizon
      </div>
      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 16, fontStyle: "italic" }}>
        Học tiếng Anh gắn liền với văn hóa — Vì tương lai của trẻ em Tây Nguyên
      </div>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              color: "var(--text-light)",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div style={{ marginTop: 20, fontSize: "0.78rem", color: "var(--text-muted)" }}>
        © 2026 Highland English Horizon · Mã nguồn mở · Phi lợi nhuận
      </div>
    </footer>
  );
}
