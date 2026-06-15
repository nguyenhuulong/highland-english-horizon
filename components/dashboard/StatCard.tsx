export default function StatCard({
  icon, label, value, color,
}: { icon: string; label: string; value: string | number; color?: string }) {
  return (
    <div
      style={{
        background: "var(--bg-card)", border: "1.5px solid var(--border)",
        borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14,
        boxShadow: "var(--shadow)",
      }}
    >
      <div
        style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          background: color || "var(--surface)", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "1.4rem",
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text)", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  );
}
