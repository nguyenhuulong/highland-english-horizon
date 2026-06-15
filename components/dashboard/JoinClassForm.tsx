"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/Feedback";

export default function JoinClassForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/classes/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joinCode: code.trim() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      showToast(data.error || "Mã lớp không hợp lệ", "error");
      return;
    }
    showToast(`Đã tham gia lớp ${data.class.name}! 🎉`, "success");
    setCode("");
    router.refresh();
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Nhập mã lớp (VD: DEMO01)"
        style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "2px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontFamily: "var(--font-body)", fontWeight: 700, letterSpacing: 1 }}
      />
      <button type="submit" disabled={loading || !code} style={{ padding: "10px 20px", borderRadius: 10, background: "var(--secondary)", color: "white", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
        {loading ? "..." : "Tham gia"}
      </button>
    </form>
  );
}
