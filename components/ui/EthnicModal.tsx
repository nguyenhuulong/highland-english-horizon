"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useSettings, useTTS } from "@/lib/hooks";
import { CULTURE_LEXICON as WORD_DICT, LEXICON_KEYS } from "@/data/cultureLexicon";

interface CulturalGroup {
  slug: string;
  nameVi: string;
  nameEn: string;
  emoji: string;
  description: string;
  costume: string[];
  festivals: string[];
  instruments: string[];
  crafts: string[];
  cuisine: string[];
  locations: string[];
  architecture: string;
  bannerImageUrl?: string;
}

interface Props {
  group: CulturalGroup;
  onClose: () => void;
  onClosed?: () => void;
}


// ─── WordChip component ────────────────────────────────────────────────────────
function WordChip({ word, wordEn, meaning, usage }: {
  word: string; wordEn: string; meaning: string; usage: string;
}) {
  const { settings } = useSettings();
  const { speak } = useTTS(settings.ttsEnabled);
  const [open, setOpen] = useState(false);
  const chipRef = useRef<HTMLSpanElement>(null);
  const [align, setAlign] = useState<"left" | "center" | "right">("center");
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        chipRef.current &&
        !chipRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  useLayoutEffect(() => {
    if (!open || !chipRef.current) return;
    const rect = chipRef.current.getBoundingClientRect();
    const tooltipW = 260;
    let left = rect.left + rect.width / 2 - tooltipW / 2;
    // Giữ trong viewport
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipW - 8));
    setPos({ top: rect.top - 8, left }); // top = trên chip, translate lên bằng transform
  }, [open]);

  return (
    <span ref={chipRef}
      style={{
        position: "relative",
        display: "inline-block"
      }}>
      <span onClick={() => setOpen((v) => !v)}
        style={{ cursor: "pointer", borderBottom: "1.5px dashed var(--primary)", color: "var(--primary)", fontWeight: 700 }}>
        {word}
      </span>
      {open && (
        <span style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          transform: "translateY(-100%)",   // đẩy lên trên chip
          width: 260,
          background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)", padding: "12px 14px",
          zIndex: 1100,   // cao hơn cả modal (1000)
          fontSize: "0.82rem", display: "block",
        }}>
          <button onClick={() => setOpen(false)}
            style={{ position: "absolute", top: 4, right: 8, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.9rem" }}>✕</button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <strong style={{ fontSize: "0.95rem", color: "var(--primary)" }}>{wordEn}</strong>
            <button onClick={(e) => { e.stopPropagation(); speak(wordEn); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", marginLeft: 8 }}>🔊</button>
          </div>
          <div style={{ color: "var(--text-muted)", marginBottom: 5 }}>
            <span style={{ fontWeight: 700 }}>Nghĩa:</span> {meaning}
          </div>
          <div style={{ color: "var(--text)", fontStyle: "italic", fontSize: "0.79rem", borderTop: "1px solid var(--border)", paddingTop: 5 }}>
            &quot;{usage}&quot;
          </div>
        </span>
      )}
    </span>
  );
}

// ─── RichText: tự detect từ khoá trong WORD_DICT và wrap thành WordChip ────────
function RichText({ text }: { text: string }) {
  // Sắp xếp key dài trước để match đúng (tránh match ngắn trước)
  const keys = LEXICON_KEYS;
  const parts: { text: string; key?: string }[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let matched = false;
    for (const key of keys) {
      const idx = remaining.indexOf(key);
      if (idx === 0) {
        parts.push({ text: key, key });
        remaining = remaining.slice(key.length);
        matched = true;
        break;
      }
      if (idx > 0) {
        parts.push({ text: remaining.slice(0, idx) });
        remaining = remaining.slice(idx);
        matched = true;
        break;
      }
    }
    if (!matched) {
      parts.push({ text: remaining });
      break;
    }
  }

  return (
    <span>
      {parts.map((p, i) =>
        p.key && WORD_DICT[p.key] ? (
          <WordChip key={i} word={p.text}
            wordEn={WORD_DICT[p.key].en}
            meaning={WORD_DICT[p.key].meaning}
            usage={WORD_DICT[p.key].usage} />
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </span>
  );
}

// ─── Các section hiển thị ─────────────────────────────────────────────────────
const SECTIONS: { key: keyof CulturalGroup; label: string; labelEn: string; icon: string }[] = [
  { key: "festivals", label: "Lễ hội", labelEn: "Festivals", icon: "🎉" },
  { key: "costume", label: "Trang phục", labelEn: "Costume", icon: "🧵" },
  { key: "instruments", label: "Nhạc cụ", labelEn: "Instruments", icon: "🎵" },
  { key: "crafts", label: "Nghề thủ công", labelEn: "Crafts", icon: "🏺" },
  { key: "cuisine", label: "Ẩm thực", labelEn: "Cuisine", icon: "🍚" },
  { key: "locations", label: "Địa danh", labelEn: "Locations", icon: "📍" },
];

// ─── Modal chính ───────────────────────────────────────────────────────────────
export default function EthnicModal({ group, onClose, onClosed }: Props) {
  const [closing, setClosing] = useState(false);

  const close = () => {
    if (closing) return;

    setClosing(true);

    setTimeout(() => {
      onClose();
      onClosed?.();
    }, 350);
  };

  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div onClick={close}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", perspective: "1400px", padding: "20px 16px" }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-card)",
          maxWidth: 680,
          width: "100%",
          overflow: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
          position: "relative",
          maxHeight: "90vh",
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
          transformOrigin: "center center",
          animation: closing
            ? "flipOut .35s ease forwards"
            : "flipIn .35s ease forwards",
        }}
      >

        {/* Header */}
        <div style={{ padding: "24px 24px 16px", background: "linear-gradient(135deg, var(--surface), #fff8f0)", borderRadius: "20px 20px 0 0" }}>
          <button onClick={close}
            style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--bg-card)", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: "3.5rem" }}>{group.emoji}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.6rem", fontFamily: "var(--font-display)" }}>
                Người {group.nameVi}
              </h2>
              <div style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: "0.95rem" }}>
                {group.nameEn} People ·{" "}
                <span style={{ color: "var(--primary)" }}>
                  {(group.locations as string[])[0]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {group.bannerImageUrl ? (
          <img src={group.bannerImageUrl} alt={group.nameVi}
            style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: "0 0 0 0" }} />
        ) : (
          <div style={{ height: 120, background: "linear-gradient(135deg, var(--surface), #fff8f0)" }} />
        )}

        <div style={{
          overflowY: "auto",
          padding: "16px 24px 24px"
        }}>
          {/* Mô tả */}
          <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "var(--text)", marginBottom: 20 }}>
            <RichText text={group.description} />
          </p>

          {/* 6 ô thông tin */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {SECTIONS.map(({ key, label, labelEn, icon }) => {
              const items = Array.isArray(group[key])
                ? (group[key] as string[])
                : [group[key] as string];
              return (
                <div key={key} style={{ background: "var(--surface)", borderRadius: 12, padding: "12px 14px", border: "1.5px solid var(--border)" }}>
                  <div style={{ fontWeight: 800, fontSize: "0.85rem", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{icon}</span>
                    <span>{label}</span>
                    <span style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: "0.78rem" }}>/ {labelEn}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {items.map((item, i) => (
                      <div key={i} style={{ fontSize: "0.83rem", lineHeight: 1.5 }}>
                        <RichText text={item} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kiến trúc */}
          <div style={{ background: "var(--surface)", borderRadius: 12, padding: "12px 14px", border: "1.5px solid var(--border)", marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: "0.85rem", marginBottom: 6 }}>
              🏡 Kiến trúc / Architecture
            </div>
            <p style={{ fontSize: "0.83rem", lineHeight: 1.6, margin: 0 }}>
              {group.architecture}
            </p>
          </div>

          {/* Ghi chú */}
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 20, fontStyle: "italic" }}>
            💡 Nhấn vào các từ được gạch chân để xem nghĩa tiếng Anh và nghe phát âm
          </div>

          {/* CTA */}
          <div style={{ display: "flex", gap: 10 }}>
            <Link href={`/library`} onClick={close}
              style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: "var(--primary)", color: "#fff", fontWeight: 700, textAlign: "center", textDecoration: "none", fontSize: "0.9rem" }}>
              📚 Xem bài học về dân tộc {group.nameVi}
            </Link>
            <button onClick={close}
              style={{ padding: "12px 20px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg-card)", cursor: "pointer", fontWeight: 600, fontFamily: "var(--font-body)" }}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
