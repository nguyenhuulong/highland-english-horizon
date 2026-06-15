"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { useSettings } from "@/lib/hooks";
import { ROLE_HOME, ROLE_LABELS } from "@/lib/rbac";

// const NAV_LINKS = [
//   { href: "/", label: "Trang chủ", icon: "🏠" },
//   { href: "/library", label: "Thư viện", icon: "📚" },
//   { href: "/games", label: "Trò chơi", icon: "🎮" },
//   { href: "/creator", label: "Sáng tác", icon: "✏️" },
//   { href: "/progress", label: "Tiến độ", icon: "📊" },
// ];

const GUEST_LINKS = [
  { href: "/", label: "Trang chủ", icon: "🏠" },
  { href: "/library", label: "Bài học mẫu", icon: "📚" },
];

const STUDENT_LINKS = [
  { href: "/library", label: "Thư viện", icon: "📚" },
  { href: "/games", label: "Trò chơi", icon: "🎮" },
  { href: "/progress", label: "Tiến độ", icon: "📊" },
];

const TEACHER_LINKS = [
  { href: "/dashboard/teacher", label: "Lớp học", icon: "🏫" },
  { href: "/creator", label: "Tạo bài học", icon: "✏️" },
];

const ADMIN_LINKS = [
  { href: "/dashboard/admin", label: "Quản trị", icon: "🛡️" },
];

function getNavLinks(role?: string) {
  switch (role) {
    case "STUDENT":
      return STUDENT_LINKS;

    case "TEACHER":
      return [...STUDENT_LINKS, ...TEACHER_LINKS];

    case "ADMIN":
    case "SUPER_ADMIN":
      return [...STUDENT_LINKS, ...TEACHER_LINKS, ...ADMIN_LINKS];

    default:
      return GUEST_LINKS;
  }
}

export default function Navbar() {
  const pathname = usePathname();
  const { settings, toggleTheme } = useSettings();
  const { data: session, status } = useSession();
  const navLinks = getNavLinks(session?.user?.role);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--bg-card)", borderBottom: "2px solid var(--border)",
        padding: "0 24px", display: "flex", alignItems: "center",
        height: 64, gap: 16,
        boxShadow: "0 2px 12px rgba(232,100,58,0.08)",
      }}
    >
      <Link
        href="/"
        style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--text)" }}
      >
        <div
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: "linear-gradient(135deg, var(--primary), var(--accent))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.3rem", flexShrink: 0,
          }}
        >
          🌄
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", color: "var(--primary)" }}>
            Highland English Horizon
          </div>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.5px" }}>
            HỌC TIẾNG ANH · VĂN HÓA TÂY NGUYÊN
          </div>
        </div>
      </Link>

      <div style={{ display: "flex", gap: 4, marginLeft: "auto", alignItems: "center" }}>
        {navLinks.map((link) => {
          const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 10,
                textDecoration: "none",
                color: isActive ? "var(--primary)" : "var(--text-light)",
                background: isActive ? "var(--surface)" : "transparent",
                fontWeight: 600, fontSize: "0.9rem",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>{link.icon}</span>
              <span className="hidden md:inline">{link.label}</span>
            </Link>
          );
        })}
      </div>

      <button
        onClick={toggleTheme}
        title="Đổi giao diện"
        style={{
          width: 38, height: 38, borderRadius: 10,
          border: "1.5px solid var(--border)", background: "var(--surface)",
          cursor: "pointer", fontSize: "1.1rem",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s", color: "var(--text)", flexShrink: 0,
        }}
      >
        {settings.theme === "dark" ? "☀️" : "🌙"}
      </button>

      {status === "authenticated" && session?.user ? (
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 12px 6px 6px",
              borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)",
              cursor: "pointer", fontFamily: "var(--font-body)",
            }}
          >
            <span style={{ fontSize: "1.4rem", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "var(--bg-card)" }}>
              {session.user.avatar || "🧑"}
            </span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text)" }}>{session.user.name}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>
                {ROLE_LABELS[session.user.role] || session.user.role}
              </div>
            </div>
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "var(--bg-card)", border: "1.5px solid var(--border)",
                borderRadius: 12, boxShadow: "var(--shadow-lg)", minWidth: 180,
                overflow: "hidden", zIndex: 200,
              }}
            >
              <Link
                href={ROLE_HOME[session.user.role] || "/dashboard/student"}
                onClick={() => setMenuOpen(false)}
                style={{ display: "block", padding: "10px 16px", textDecoration: "none", color: "var(--text)", fontWeight: 600, fontSize: "0.9rem", borderBottom: "1px solid var(--border)" }}
              >
                📊 Bảng điều khiển
              </Link>
              <button
                onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", border: "none", background: "none", color: "#F44336", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", fontFamily: "var(--font-body)" }}
              >
                🚪 Đăng xuất
              </button>
            </div>
          )}
        </div>
      ) : status === "unauthenticated" ? (
        <Link
          href="/login"
          style={{
            padding: "8px 18px", borderRadius: 10, background: "var(--primary)",
            color: "white", textDecoration: "none", fontWeight: 700, fontSize: "0.9rem",
            flexShrink: 0,
          }}
        >
          Đăng nhập
        </Link>
      ) : null}
    </nav>
  );
}
