"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useSettings, useTTS } from "@/lib/hooks";

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

// ─── Từ điển EN chung cho toàn bộ các từ khoá trong culture.ts ────────────────
// Được build từ dữ liệu chuẩn — không hardcode theo từng dân tộc
const WORD_DICT: Record<string, { en: string; meaning: string; usage: string }> = {
  // Lễ hội
  "Lễ mừng lúa mới": { en: "Rice Harvest Festival", meaning: "Lễ tạ ơn sau mùa thu hoạch", usage: "The Rice Harvest Festival is one of the most important celebrations in the Central Highlands." },
  "Lễ hội cồng chiêng": { en: "Festival of Gong Culture", meaning: "Lễ hội tôn vinh văn hóa cồng chiêng", usage: "The Festival of Gong Culture celebrates the unique heritage of the Central Highlands." },
  "Lễ hội cồng chiêng Tây Nguyên": { en: "Central Highlands Gong Festival", meaning: "Lễ hội cồng chiêng toàn Tây Nguyên", usage: "The Central Highlands Gong Festival is recognized by UNESCO as intangible heritage." },
  "Lễ cúng thần rừng": { en: "Forest Spirit Ceremony", meaning: "Nghi lễ cầu bình an và bảo vệ rừng", usage: "Villagers gather for the Forest Spirit Ceremony every spring." },
  "Lễ cúng bến nước": { en: "Water Source Ceremony", meaning: "Nghi lễ tạ ơn nguồn nước", usage: "The Water Source Ceremony gives thanks for clean water." },
  "Lễ cúng sức khỏe cho voi": { en: "Elephant Health Ceremony", meaning: "Nghi lễ cúng sức khỏe cho voi", usage: "The Elephant Health Ceremony shows the special bond between the Mnong people and elephants." },
  "Traditional Buffalo Offering Ceremony": { en: "Buffalo Offering Ceremony", meaning: "Nghi lễ hiến sinh trâu truyền thống", usage: "The Buffalo Offering Ceremony is held during important community celebrations." },
  "Lễ đâm trâu": { en: "Buffalo Offering Ceremony", meaning: "Nghi lễ hiến sinh trâu truyền thống", usage: "The Buffalo Offering Ceremony is held during important community celebrations." },
  "Lễ bỏ mả (Pơthi)": { en: "Pơthi Ceremony", meaning: "Nghi lễ tiễn đưa người đã khuất", usage: "The Pơthi Ceremony is one of the most important traditions of the Gia Rai people." },
  "Lễ hội đua voi Buôn Đôn": { en: "Buon Don Elephant Racing Festival", meaning: "Lễ hội đua voi truyền thống", usage: "The Buon Don Elephant Racing Festival attracts visitors from across Vietnam." },
  "Lễ mừng nhà mới": { en: "New House Ceremony", meaning: "Lễ khánh thành nhà ở mới", usage: "The New House Ceremony brings the whole community together to celebrate." },
  "Lễ hội mừng lúa mới": { en: "New Rice Harvest Festival", meaning: "Lễ mừng vụ lúa mới", usage: "The New Rice Harvest Festival marks the end of the farming season." },

  // Nhạc cụ
  "Cồng chiêng": { en: "Gong ensemble", meaning: "Bộ nhạc cụ cồng chiêng truyền thống", usage: "The gong ensemble is played during important ceremonies." },
  "Sáo tre": { en: "Bamboo flute", meaning: "Sáo làm bằng tre", usage: "He plays a beautiful melody on the bamboo flute." },
  "Trống truyền thống": { en: "Traditional drum", meaning: "Trống dùng trong lễ hội", usage: "The traditional drum signals the start of the ceremony." },
  "Trống lớn": { en: "Large ceremonial drum", meaning: "Trống lớn dùng trong lễ hội", usage: "The large ceremonial drum can be heard throughout the village." },
  "Đàn đá": { en: "Lithophone", meaning: "Nhạc cụ gõ bằng đá cổ", usage: "The lithophone is one of the oldest musical instruments in the world." },
  "Đàn goong": { en: "Goong lute", meaning: "Đàn dây truyền thống của người Ê Đê", usage: "The Goong lute is played during traditional ceremonies." },
  "Kèn đinh tút": { en: "Dinh Tut horn", meaning: "Kèn truyền thống của người Ê Đê", usage: "The Dinh Tut horn is used during important ceremonies." },
  "Đàn T'rưng": { en: "T'rưng bamboo xylophone", meaning: "Nhạc cụ làm bằng các ống tre", usage: "The T'rưng bamboo xylophone produces soft and beautiful sounds." },
  "Đàn Klông pút": { en: "Klông pút flute", meaning: "Nhạc cụ ống tre của Tây Nguyên", usage: "Women often play the Klông pút during village festivals." },

  // Ẩm thực
  "Cơm lam": { en: "Bamboo-cooked rice", meaning: "Cơm nấu trong ống tre", usage: "Bamboo-cooked rice is a popular dish in the Central Highlands." },
  "Rượu cần": { en: "Traditional jar rice wine", meaning: "Rượu gạo uống chung bằng cần tre", usage: "Guests share traditional jar rice wine during festivals." },
  "Rượu ghè": { en: "Jar wine", meaning: "Rượu ủ trong ghè truyền thống", usage: "Jar wine is shared among community members at important gatherings." },
  "Canh bồi": { en: "Traditional K'Ho soup", meaning: "Món canh truyền thống của người K'Ho", usage: "Traditional K'Ho soup is served at family gatherings." },
  "Canh thụt": { en: "Bamboo-tube soup", meaning: "Canh nấu trong ống tre", usage: "Bamboo-tube soup is a well-known dish of the M'Nong people." },
  "Thịt nướng ống tre": { en: "Bamboo-grilled meat", meaning: "Thịt nướng trong ống tre", usage: "Bamboo-grilled meat is often prepared during village festivals." },
  "Cá suối nướng": { en: "Grilled stream fish", meaning: "Cá suối nướng trên lửa", usage: "Grilled stream fish is a staple food of the Ma' people." },
  "Rau rừng": { en: "Wild forest vegetables", meaning: "Rau hái từ rừng tự nhiên", usage: "Wild forest vegetables are used in many traditional dishes." },
  "Gà nướng muối ớt rừng": { en: "Grilled chicken with forest spices", meaning: "Gà nướng với gia vị rừng", usage: "Grilled chicken with forest spices is a specialty of the Gia Rai people." },
  "Lá mì xào": { en: "Stir-fried cassava leaves", meaning: "Lá sắn xào", usage: "Stir-fried cassava leaves are commonly eaten by the Ba Na people." },

  // Nghề thủ công
  "Dệt thổ cẩm": { en: "Brocade weaving", meaning: "Nghề dệt vải thổ cẩm truyền thống", usage: "Brocade weaving has been passed down for generations." },
  "Đan gùi": { en: "Back-basket weaving", meaning: "Đan gùi bằng tre nứa", usage: "Back-basket weaving is an important traditional craft." },
  "Đan lát": { en: "Bamboo weaving", meaning: "Đan các vật dụng bằng tre", usage: "Villagers make many household items through bamboo weaving." },
  "Đan lát mây tre": { en: "Rattan and bamboo weaving", meaning: "Đan lát bằng mây và tre", usage: "Rattan and bamboo weaving produces beautiful and durable baskets." },
  "Đan gùi mây tre": { en: "Rattan back-basket weaving", meaning: "Đan gùi bằng mây tre", usage: "Rattan back-basket weaving is an essential skill in highland communities." },
  "Chạm khắc gỗ": { en: "Wood carving", meaning: "Nghề chạm khắc tượng gỗ", usage: "Wood carving is a respected art form in many Central Highlands communities." },
  "Tạc tượng gỗ": { en: "Traditional wood sculpture", meaning: "Tạc tượng từ gỗ truyền thống", usage: "Traditional wood sculpture is used to decorate village communal houses." },
  "Điêu khắc nhà mồ": { en: "Funeral house sculpture", meaning: "Điêu khắc trang trí nhà mồ", usage: "Gia Rai funeral house sculpture is a unique form of traditional art." },
  "Dệt vải truyền thống": { en: "Traditional cloth weaving", meaning: "Dệt vải theo phương pháp truyền thống", usage: "Traditional cloth weaving produces colorful fabrics used for clothing." },

  // Trang phục
  "Trang phục dệt thổ cẩm truyền thống": { en: "Traditional brocade clothing", meaning: "Trang phục thổ cẩm dệt tay", usage: "Traditional brocade clothing is worn during festivals and ceremonies." },
  "Khố truyền thống (nam)": { en: "Traditional loincloth", meaning: "Khố truyền thống nam giới", usage: "The traditional loincloth is worn by men during ceremonies." },
  "Trang sức hạt cườm": { en: "Bead jewelry", meaning: "Trang sức làm từ hạt cườm", usage: "Bead jewelry is an important part of traditional highland costumes." },
  "Áo chàm truyền thống": { en: "Indigo blouse", meaning: "Áo nhuộm chàm truyền thống", usage: "The indigo blouse is a symbol of highland ethnic identity." },
  "Váy quấn thổ cẩm": { en: "Brocade wrap skirt", meaning: "Váy quấn bằng vải thổ cẩm", usage: "The brocade wrap skirt is decorated with traditional geometric patterns." },
  "Khố và áo thổ cẩm": { en: "Brocade loincloth and shirt", meaning: "Trang phục thổ cẩm truyền thống", usage: "The brocade loincloth and shirt are worn during important ceremonies." },
  "Vòng tay đồng": { en: "Bronze bracelet", meaning: "Vòng tay bằng đồng", usage: "Bronze bracelets are traditional jewelry of Central Highlands peoples." },
  "Khăn choàng truyền thống": { en: "Traditional shawl", meaning: "Khăn choàng truyền thống", usage: "The traditional shawl is worn over the shoulders during festivals." },
};

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
  const keys = Object.keys(WORD_DICT).sort((a, b) => b.length - a.length);
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
  
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    console.log(handler)
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closing]);

  const close = () => {
    if (closing) return;

    setClosing(true);

    setTimeout(() => {
      onClose();
      onClosed?.();
    }, 350);
  };

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
