"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px", borderRadius: 10,
  border: "2px solid var(--border)", background: "var(--bg-card)", color: "var(--text)",
  fontFamily: "var(--font-body)", fontSize: "0.95rem", outline: "none",
};

const DEMO_ACCOUNTS = [
  { label: "🧒 Học sinh", email: "student@highlandenglish.vn" },
  { label: "🧑‍🏫 Giáo viên", email: "teacher@highlandenglish.vn" },
  { label: "🛡️ Quản trị viên", email: "admin@highlandenglish.vn" },
  { label: "🛡️ Ban tổ chức", email: "superadmin@highlandenglish.vn" },
];

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Highland@2026");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/dashboard",
    });
  };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "60px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🌄</div>
        <h1 style={{ marginBottom: 4 }}>Đăng nhập</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Highland English Horizon
        </p>
      </div>

      <form onSubmit={submit} style={{ background: "var(--bg-card)", borderRadius: 16, border: "1.5px solid var(--border)", padding: 24, boxShadow: "var(--shadow)" }}>
        <label style={{ display: "block", fontWeight: 700, marginBottom: 6, fontSize: "0.9rem" }}>Email</label>
        <input style={{ ...inputStyle, marginBottom: 16 }} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ten@email.com" />

        <label style={{ display: "block", fontWeight: 700, marginBottom: 6, fontSize: "0.9rem" }}>Mật khẩu</label>
        <input style={{ ...inputStyle, marginBottom: 16 }} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />

        {error && <div style={{ color: "#F44336", fontSize: "0.85rem", marginBottom: 12, fontWeight: 600 }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px 24px", borderRadius: 10, background: "var(--primary)", color: "white", border: "none", fontWeight: 700, fontSize: "1rem", cursor: "pointer", fontFamily: "var(--font-body)" }}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <div style={{ marginTop: 16, padding: 16, background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: 8, color: "var(--text-light)" }}>
          🔑 Tài khoản demo (mật khẩu: Highland@2026)
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {DEMO_ACCOUNTS.map((a) => (
            <button key={a.email} type="button" onClick={() => { setEmail(a.email); setPassword("Highland@2026"); }}
              style={{ padding: "6px 12px", borderRadius: 20, border: "1.5px solid var(--border)", background: "var(--bg-card)", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", color: "var(--text-light)" }}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 20, fontSize: "0.9rem", color: "var(--text-muted)" }}>
        Chưa có tài khoản? <Link href="/register" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>Đăng ký ngay</Link>
      </div>
      <div style={{ textAlign: "center", marginTop: 8, fontSize: "0.85rem" }}>
        <Link href="/library" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Hoặc tiếp tục với tư cách khách →</Link>
      </div>
    </div>
  );
}
