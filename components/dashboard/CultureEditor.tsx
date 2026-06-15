"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/Feedback";

interface Group {
  id: string;
  slug: string;
  nameVi: string;
  emoji: string;
  description: string;
  costume: string[];
  festivals: string[];
  instruments: string[];
  crafts: string[];
  cuisine: string[];
  locations: string[];
  architecture: string;
}

const FIELDS: { key: keyof Group; label: string; type: "text" | "list" }[] = [
  { key: "description", label: "Mô tả chung", type: "text" },
  { key: "festivals", label: "Lễ hội", type: "list" },
  { key: "costume", label: "Trang phục", type: "list" },
  { key: "instruments", label: "Nhạc cụ", type: "list" },
  { key: "crafts", label: "Nghề truyền thống", type: "list" },
  { key: "cuisine", label: "Ẩm thực", type: "list" },
  { key: "locations", label: "Địa danh", type: "list" },
  { key: "architecture", label: "Kiến trúc", type: "text" },
];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid var(--border)",
  background: "var(--bg-card)", color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "0.85rem",
};

export default function CultureEditor({ groups }: { groups: Group[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Group>>(() =>
    Object.fromEntries(groups.map((g) => [g.id, g]))
  );
  const [saving, setSaving] = useState<string | null>(null);

  const update = (id: string, key: keyof Group, value: string | string[]) => {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [key]: value } }));
  };

  const save = async (id: string) => {
    setSaving(id);
    const g = drafts[id];
    const res = await fetch("/api/culture", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        description: g.description,
        costume: g.costume,
        festivals: g.festivals,
        instruments: g.instruments,
        crafts: g.crafts,
        cuisine: g.cuisine,
        locations: g.locations,
        architecture: g.architecture,
      }),
    });
    setSaving(null);
    if (!res.ok) {
      showToast("Không thể lưu thay đổi", "error");
      return;
    }
    showToast("Đã lưu dữ liệu văn hóa", "success");
    router.refresh();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {groups.map((g) => {
        const draft = drafts[g.id];
        const isOpen = open === g.id;
        return (
          <div key={g.id} style={{ background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
            <button onClick={() => setOpen(isOpen ? null : g.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 14, background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body)" }}>
              <span style={{ fontSize: "1.5rem" }}>{g.emoji}</span>
              <span style={{ fontWeight: 800, fontSize: "1rem" }}>{g.nameVi}</span>
              <span style={{ marginLeft: "auto", color: "var(--text-muted)" }}>{isOpen ? "▲" : "▼"}</span>
            </button>
            {isOpen && (
              <div style={{ padding: "0 16px 16px" }}>
                {FIELDS.map((f) => (
                  <div key={String(f.key)} style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, display: "block", marginBottom: 4 }}>{f.label}</label>
                    {f.type === "text" ? (
                      <textarea
                        style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
                        value={draft[f.key] as string}
                        onChange={(e) => update(g.id, f.key, e.target.value)}
                      />
                    ) : (
                      <input
                        style={inputStyle}
                        value={(draft[f.key] as string[]).join(", ")}
                        onChange={(e) => update(g.id, f.key, e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                      />
                    )}
                  </div>
                ))}
                <button onClick={() => save(g.id)} disabled={saving === g.id} style={{ padding: "8px 18px", borderRadius: 8, background: "var(--primary)", color: "white", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                  {saving === g.id ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
