"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { useSettings } from "@/lib/hooks";
import { ROLE_HOME, ROLE_LABELS } from "@/lib/rbac";

const PUBLIC_LINKS = [
  { href: "/library", label: "Thư viện", icon: "📚" },
  { href: "/village", label: "Làng của tôi", icon: "🗺️" },
  { href: "/games", label: "Trò chơi", icon: "🎮" },
];
const STUDENT_ONLY_LINKS = [
  { href: "/progress", label: "Tiến độ", icon: "📊" },
];
const TEACHER_ONLY_LINKS = [
  { href: "/dashboard/teacher/stories", label: "Tạo bài học", icon: "✏️" },
  { href: "/dashboard/teacher/characters", label: "Nhân vật", icon: "🧒" },
  { href: "/dashboard/teacher/backgrounds", label: "Bối cảnh", icon: "🌄" },
];
const ADMIN_ONLY_LINKS = [
  { href: "/dashboard/admin/users", label: "Người dùng", icon: "👥" },
];

function getNavLinks(role?: string) {
  if (!role) return PUBLIC_LINKS;
  switch (role) {
    case "STUDENT": return [...PUBLIC_LINKS, ...STUDENT_ONLY_LINKS];
    case "TEACHER": return [...PUBLIC_LINKS, ...TEACHER_ONLY_LINKS];
    case "ADMIN": return [...PUBLIC_LINKS, ...ADMIN_ONLY_LINKS];
    default: return PUBLIC_LINKS;
  }
}

export default function Navbar() {
  const pathname = usePathname();
  const { settings, toggleTheme } = useSettings();
  const { data: session, status } = useSession();
  const navLinks = getNavLinks(session?.user?.role);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--bg-card)", borderBottom: "2px solid var(--border)",
        padding: "0 16px", display: "flex", alignItems: "center",
        height: 64, gap: 12,
        boxShadow: "0 2px 12px rgba(232,100,58,0.08)",
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--text)", flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, var(--primary), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
            🌄
          </div>
          <div className="nav-logo-text">
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem", color: "var(--primary)", whiteSpace: "nowrap" }}>
              Highland English Horizon
            </div>
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
              HỌC TIẾNG ANH · VĂN HÓA TÂY NGUYÊN
            </div>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div className="nav-links-desktop" style={{ display: "flex", gap: 2, marginLeft: "auto", alignItems: "center" }}>
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "7px 11px", borderRadius: 10, textDecoration: "none",
                  color: isActive ? "var(--primary)" : "var(--text-light)",
                  background: isActive ? "var(--surface)" : "transparent",
                  fontWeight: 600, fontSize: "0.88rem", whiteSpace: "nowrap",
                }}>
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Theme toggle */}
        <button onClick={toggleTheme}
          style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {settings.theme === "dark" ? "☀️" : "🌙"}
        </button>

        {/* User menu (desktop) */}
        {status === "authenticated" && session?.user ? (
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button onClick={() => setMenuOpen((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 5px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontFamily: "var(--font-body)" }}>
              <span style={{ fontSize: "1.3rem", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "var(--bg-card)" }}>
                {session.user.avatar || "🧑"}
              </span>
              <div style={{ textAlign: "left" }} className="nav-user-text">
                <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text)", whiteSpace: "nowrap" }}>{session.user.name}</div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  {ROLE_LABELS[session.user.role] || session.user.role}
                </div>
              </div>
            </button>
            {menuOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 12, boxShadow: "var(--shadow-lg)", minWidth: 180, overflow: "hidden", zIndex: 200 }}>
                <Link href={ROLE_HOME[session.user.role] || "/dashboard/student"} onClick={() => setMenuOpen(false)}
                  style={{ display: "block", padding: "10px 16px", textDecoration: "none", color: "var(--text)", fontWeight: 600, fontSize: "0.9rem", borderBottom: "1px solid var(--border)" }}>
                  📊 Bảng điều khiển
                </Link>
                <button onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", border: "none", background: "none", color: "#F44336", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                  🚪 Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : status === "unauthenticated" ? (
          <Link href="/login" className="nav-login-btn"
            style={{ padding: "7px 16px", borderRadius: 10, background: "var(--primary)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: "0.88rem", flexShrink: 0, whiteSpace: "nowrap" }}>
            Đăng nhập
          </Link>
        ) : null}

        {/* Hamburger (mobile) */}
        <button className="nav-hamburger" onClick={() => setMobileOpen((v) => !v)}
          style={{ display: "none", width: 36, height: 36, borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: "1.1rem", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {mobileOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="nav-mobile-menu" style={{
          position: "fixed", top: 64, left: 0, right: 0, zIndex: 99,
          background: "var(--bg-card)", borderBottom: "2px solid var(--border)",
          padding: "12px 16px", display: "flex", flexDirection: "column", gap: 4,
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        }}>
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", borderRadius: 10, textDecoration: "none",
                  color: isActive ? "var(--primary)" : "var(--text)",
                  background: isActive ? "var(--surface)" : "transparent",
                  fontWeight: 600, fontSize: "0.95rem",
                }}>
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div style={{ borderTop: "1px solid var(--border)", marginTop: 4, paddingTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
            {status === "authenticated" && session?.user ? (
              <>
                <span style={{ flex: 1, fontWeight: 700, fontSize: "0.88rem" }}>
                  {session.user.avatar} {session.user.name}
                </span>
                <Link href={ROLE_HOME[session.user.role] || "/dashboard/student"} onClick={() => setMobileOpen(false)}
                  style={{ padding: "7px 12px", borderRadius: 8, background: "var(--surface)", border: "1.5px solid var(--border)", textDecoration: "none", color: "var(--text)", fontWeight: 600, fontSize: "0.82rem" }}>
                  📊 Dashboard
                </Link>
                <button onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                  style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: "#fff5f5", color: "#dc2626", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)}
                style={{ flex: 1, textAlign: "center", padding: "10px", borderRadius: 10, background: "var(--primary)", color: "white", textDecoration: "none", fontWeight: 700 }}>
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
          .nav-logo-text div:last-child { display: none; }
          .nav-user-text { display: none; }
          .nav-login-btn { display: none !important; }
        }
        @media (max-width: 480px) {
          .nav-logo-text div:first-child { font-size: 0.85rem !important; }
        }
      `}</style>
    </>
  );
}
