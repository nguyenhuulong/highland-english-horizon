import { auth } from "@/auth";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import { ROLE_LABELS } from "@/lib/rbac";

const NAV_BY_ROLE: Record<string, { href: string; label: string; icon: string }[]> = {
  STUDENT: [
    { href: "/dashboard/student", label: "Tổng quan", icon: "🏠" },
    { href: "/library", label: "Thư viện", icon: "📚" },
    { href: "/village", label: "Làng của tôi", icon: "🗺️" },
    { href: "/games", label: "Trò chơi", icon: "🎮" },
    { href: "/progress", label: "Tiến độ", icon: "📊" },
  ],
  TEACHER: [
    { href: "/dashboard/teacher", label: "Tổng quan", icon: "🏠" },
    { href: "/dashboard/teacher/stories", label: "Bài học của tôi", icon: "📖" },
    { href: "/village", label: "Làng của tôi", icon: "🗺️" },
    { href: "/dashboard/teacher/characters", label: "Nhân vật", icon: "🧒" },
    { href: "/dashboard/teacher/backgrounds", label: "Bối cảnh", icon: "🌄" },
    { href: "/dashboard/admin/students", label: "Học sinh", icon: "📊" },
  ],
  ADMIN: [
    { href: "/dashboard/admin", label: "Tổng quan", icon: "🏠" },
    { href: "/dashboard/admin/users", label: "Quản lý người dùng", icon: "👥" },
    { href: "/library", label: "Thư viện bài học", icon: "📚" },
    { href: "/dashboard/admin/students", label: "Thành tích học sinh", icon: "📊" },
    { href: "/dashboard/admin/culture", label: "Dữ liệu văn hóa", icon: "🌿" },
  ],
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role || "STUDENT";
  const items = NAV_BY_ROLE[role] || NAV_BY_ROLE.STUDENT;

  return (
    <div style={{ display: "flex" }}>
      <DashboardSidebar items={items} title={ROLE_LABELS[role] || "Bảng điều khiển"} />
      <div style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>{children}</div>
    </div>
  );
}
