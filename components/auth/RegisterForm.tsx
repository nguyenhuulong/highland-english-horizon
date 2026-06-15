"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px", borderRadius: 10,
  border: "2px solid var(--border)", background: "var(--bg-card)", color: "var(--text)",
  fontFamily: "var(--font-body)", fontSize: "0.95rem", outline: "none",
};

const ETHNIC_GROUPS = ["K'Ho", "Mạ", "M'Nông", "H'Mông", "Tày", "Nùng", "Khác"];

export default function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ethnicGroup, setEthnicGroup] = useState("K'Ho");
  const [ageGroup, setAgeGroup] = useState(10);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role, ethnicGroup: role === "STUDENT" ? ethnicGroup : undefined, ageGroup: role === "STUDENT" ? ageGroup : undefined }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.fieldErrors ? "Vui lòng kiểm tra lại thông tin." : data.error || "Đăng ký thất bại.");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (signInRes?.error) {
      router.push("/login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", padding: "60px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🌄</div>
        <h1 style={{ marginBottom: 4 }}>Tạo tài khoản</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Tham gia Highland English Horizon</p>
      </div>

      <form onSubmit={submit} style={{ background: "var(--bg-card)", borderRadius: 16, border: "1.5px solid var(--border)", padding: 24, boxShadow: "var(--shadow)" }}>
        <div style={{ display: "flex", border: "2px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
          {(["STUDENT", "TEACHER"] as const).map((r) => (
            <button key={r} type="button" onClick={() => setRole(r)}
              style={{ flex: 1, padding: "10px", background: role === r ? "var(--primary)" : "none", border: "none", cursor: "pointer", fontWeight: 700, color: role === r ? "white" : "var(--text-muted)", fontFamily: "var(--font-body)" }}>
              {r === "STUDENT" ? "🧒 Học sinh" : "🧑‍🏫 Giáo viên"}
            </button>
          ))}
        </div>

        <label style={{ display: "block", fontWeight: 700, marginBottom: 6, fontSize: "0.9rem" }}>Họ tên</label>
        <input style={{ ...inputStyle, marginBottom: 14 }} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" />

        <label style={{ display: "block", fontWeight: 700, marginBottom: 6, fontSize: "0.9rem" }}>Email</label>
        <input style={{ ...inputStyle, marginBottom: 14 }} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ten@email.com" />

        <label style={{ display: "block", fontWeight: 700, marginBottom: 6, fontSize: "0.9rem" }}>Mật khẩu</label>
        <input style={{ ...inputStyle, marginBottom: 14 }} type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tối thiểu 6 ký tự" />

        {role === "STUDENT" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 6, fontSize: "0.9rem" }}>Dân tộc</label>
              <select style={inputStyle} value={ethnicGroup} onChange={(e) => setEthnicGroup(e.target.value)}>
                {ETHNIC_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 6, fontSize: "0.9rem" }}>Độ tuổi</label>
              <input style={inputStyle} type="number" min={5} max={20} value={ageGroup} onChange={(e) => setAgeGroup(parseInt(e.target.value) || 10)} />
            </div>
          </div>
        )}

        {error && <div style={{ color: "#F44336", fontSize: "0.85rem", marginBottom: 12, fontWeight: 600 }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px 24px", borderRadius: 10, background: "var(--primary)", color: "white", border: "none", fontWeight: 700, fontSize: "1rem", cursor: "pointer", fontFamily: "var(--font-body)" }}>
          {loading ? "Đang tạo..." : "Đăng ký"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 20, fontSize: "0.9rem", color: "var(--text-muted)" }}>
        Đã có tài khoản? <Link href="/login" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>Đăng nhập</Link>
      </div>
    </div>
  );
}
