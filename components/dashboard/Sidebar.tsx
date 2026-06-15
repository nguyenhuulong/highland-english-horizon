"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export default function DashboardSidebar({ items, title }: { items: NavItem[]; title: string }) {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 240, flexShrink: 0, background: "var(--bg-card)",
        borderRight: "2px solid var(--border)", padding: "24px 12px",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      <div style={{ padding: "0 12px 16px", fontWeight: 800, fontSize: "0.8rem", color: "var(--text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>
        {title}
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10, textDecoration: "none",
                fontWeight: 700, fontSize: "0.92rem",
                color: isActive ? "var(--primary)" : "var(--text-light)",
                background: isActive ? "var(--surface)" : "transparent",
              }}
            >
              <span style={{ fontSize: "1.15rem" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
