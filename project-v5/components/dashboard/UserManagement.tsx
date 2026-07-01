"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/Feedback";
import { ROLE_LABELS } from "@/lib/rbac";
import type { UserDTO } from "@/types";

const ROLE_OPTIONS: Record<string, string[]> = {
  TEACHER: ["STUDENT", "TEACHER"],
  ADMIN: ["STUDENT", "TEACHER", "ADMIN"],
};

export default function UserManagement({ users, currentUserId, currentRole }: { users: UserDTO[]; currentUserId: string; currentRole: string }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const updateRole = async (id: string, role: string) => {
    setLoadingId(id);
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setLoadingId(null);
    if (!res.ok) {
      const data = await res.json();
      showToast(data.error || "Không thể cập nhật quyền", "error");
      return;
    }
    showToast("Đã cập nhật quyền người dùng", "success");
    router.refresh();
  };

  const removeUser = async (id: string) => {
    if (!confirm("Xóa người dùng này?")) return;
    setLoadingId(id);
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    setLoadingId(null);
    if (!res.ok) {
      const data = await res.json();
      showToast(data.error || "Không thể xóa người dùng", "error");
      return;
    }
    showToast("Đã xóa người dùng", "success");
    router.refresh();
  };

  const roleOptions = ROLE_OPTIONS[currentRole] || ["STUDENT", "TEACHER"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ color: "var(--text-muted)" }}>{users.length} người dùng</p>
        <button onClick={() => setShowForm((v) => !v)} style={{ padding: "10px 18px", borderRadius: 10, background: "var(--primary)", color: "white", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
          {showForm ? "Đóng" : "+ Thêm người dùng"}
        </button>
      </div>

      {showForm && <CreateUserForm currentRole={currentRole} onCreated={() => { setShowForm(false); router.refresh(); }} />}

      <div style={{ background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 14, overflow: "hidden", marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface)", textAlign: "left" }}>
              <th style={{ padding: "10px 16px", fontSize: "0.85rem" }}>Tên</th>
              <th style={{ padding: "10px 16px", fontSize: "0.85rem" }}>Email</th>
              <th style={{ padding: "10px 16px", fontSize: "0.85rem" }}>Vai trò</th>
              <th style={{ padding: "10px 16px", fontSize: "0.85rem" }}>XP</th>
              <th style={{ padding: "10px 16px", fontSize: "0.85rem" }}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 16px", fontWeight: 700 }}>{u.avatar} {u.name}</td>
                <td style={{ padding: "10px 16px", fontSize: "0.88rem", color: "var(--text-muted)" }}>{u.email}</td>
                <td style={{ padding: "10px 16px" }}>
                  {u.id === currentUserId || u.role === "ADMIN" ? (
                    <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{ROLE_LABELS[u.role]}</span>
                  ) : (
                    <select
                      value={u.role}
                      disabled={loadingId === u.id}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      style={{ padding: "4px 8px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.85rem" }}
                    >
                      {roleOptions.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  )}
                </td>
                <td style={{ padding: "10px 16px", fontWeight: 700, color: "var(--primary)" }}>{u.xp}</td>
                <td style={{ padding: "10px 16px", textAlign: "right" }}>
                  {u.id !== currentUserId && u.role !== "ADMIN" && (
                    <button onClick={() => removeUser(u.id)} disabled={loadingId === u.id} style={{ padding: "5px 12px", borderRadius: 8, border: "1.5px solid var(--border)", background: "none", color: "#F44336", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                      Xóa
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateUserForm({ currentRole, onCreated }: { currentRole: string; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [loading, setLoading] = useState(false);

  const roleOptions = ROLE_OPTIONS[currentRole] || ["STUDENT", "TEACHER"];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      showToast(data.error || "Không thể tạo người dùng", "error");
      return;
    }
    showToast("Đã tạo người dùng mới", "success");
    onCreated();
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "0.88rem" };

  return (
    <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 10, alignItems: "end", padding: 16, background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 14 }}>
      <div>
        <label style={{ fontSize: "0.78rem", fontWeight: 700, display: "block", marginBottom: 4 }}>Tên</label>
        <input style={inputStyle} required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label style={{ fontSize: "0.78rem", fontWeight: 700, display: "block", marginBottom: 4 }}>Email</label>
        <input style={inputStyle} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label style={{ fontSize: "0.78rem", fontWeight: 700, display: "block", marginBottom: 4 }}>Mật khẩu</label>
        <input style={inputStyle} type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div>
        <label style={{ fontSize: "0.78rem", fontWeight: 700, display: "block", marginBottom: 4 }}>Vai trò</label>
        <select style={inputStyle} value={role} onChange={(e) => setRole(e.target.value)}>
          {roleOptions.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>
      <button type="submit" disabled={loading} style={{ padding: "8px 18px", borderRadius: 8, background: "var(--secondary)", color: "white", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", height: 38 }}>
        {loading ? "..." : "Tạo"}
      </button>
    </form>
  );
}
