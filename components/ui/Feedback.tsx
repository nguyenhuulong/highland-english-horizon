"use client";

import { useOnlineStatus } from "@/lib/hooks";
import { useEffect, useState, useCallback } from "react";

export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  if (online) return null;
  return (
    <div
      style={{
        background: "#FFF3CD", borderBottom: "2px solid #FFE082",
        padding: "10px 24px", display: "flex", alignItems: "center",
        gap: 10, fontSize: "0.88rem", fontWeight: 600, color: "#795548",
      }}
    >
      📴 Bạn đang ngoại tuyến. Một số nội dung đã tải trước đó vẫn có thể truy cập.
    </div>
  );
}

export interface ToastItem {
  id: number;
  msg: string;
  type: "success" | "error" | "info";
}

const COLORS = { success: "#2E7D32", error: "#F44336", info: "#E8643A" };

let toastBus: ((item: ToastItem) => void) | null = null;

export function showToast(msg: string, type: ToastItem["type"] = "info") {
  toastBus?.({ id: Date.now(), msg, type });
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((item: ToastItem) => {
    setToasts((prev) => [...prev, item]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== item.id)), 3000);
  }, []);

  useEffect(() => {
    toastBus = add;
    return () => { toastBus = null; };
  }, [add]);

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            padding: "12px 20px", borderRadius: 10, color: "white", fontWeight: 700,
            background: COLORS[t.type], boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
            animation: "slideIn 0.3s ease", maxWidth: 300, fontSize: "0.9rem",
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// Confetti
export function spawnConfetti() {
  if (typeof window === "undefined") return;
  const colors = ["#E8643A", "#F9A825", "#2E7D32", "#7B1FA2", "#1565C0", "#FF6F00"];
  for (let i = 0; i < 40; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    el.style.cssText = `left:${Math.random() * 100}vw;background:${colors[Math.floor(Math.random() * colors.length)]};animation-duration:${1 + Math.random() * 2}s;animation-delay:${Math.random() * 0.5}s;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}
