"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/Feedback";

export default function CreateClassForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      showToast(data.error || "Không thể tạo lớp", "error");
      return;
    }
    showToast(`Đã tạo lớp "${data.class.name}" — mã: ${data.class.joinCode}`, "success");
    setName("");
    router.refresh();
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tên lớp học (VD: Lớp 5A)"
        style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "2px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontFamily: "var(--font-body)" }}
      />
      <button type="submit" disabled={loading || !name} style={{ padding: "10px 20px", borderRadius: 10, background: "var(--primary)", color: "white", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
        {loading ? "..." : "Tạo lớp"}
      </button>
    </form>
  );
}
