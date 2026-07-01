"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/Feedback";

export default function LessonRowActions({ id, status }: { id: string; status: "DRAFT" | "PUBLISHED" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const togglePublish = async () => {
    setLoading(true);
    const res = await fetch(`/api/lessons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }),
    });
    setLoading(false);
    if (!res.ok) {
      showToast("Không thể cập nhật bài học", "error");
      return;
    }
    showToast(status === "PUBLISHED" ? "Đã chuyển về bản nháp" : "Đã xuất bản bài học! 🎉", "success");
    router.refresh();
  };

  const remove = async () => {
    if (!confirm("Xóa bài học này? Hành động không thể hoàn tác.")) return;
    setLoading(true);
    const res = await fetch(`/api/lessons/${id}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      showToast("Không thể xóa bài học", "error");
      return;
    }
    showToast("Đã xóa bài học", "success");
    router.refresh();
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={togglePublish} disabled={loading} style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid var(--border)", background: status === "PUBLISHED" ? "var(--surface)" : "var(--secondary)", color: status === "PUBLISHED" ? "var(--text)" : "white", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", fontFamily: "var(--font-body)" }}>
        {status === "PUBLISHED" ? "Gỡ xuất bản" : "Xuất bản"}
      </button>
      <button onClick={remove} disabled={loading} style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid var(--border)", background: "none", color: "#F44336", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", fontFamily: "var(--font-body)" }}>
        Xóa
      </button>
    </div>
  );
}
