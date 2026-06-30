import { auth } from "@/auth";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import { ROLE_LABELS } from "@/lib/rbac";

const NAV_BY_ROLE: Record<string, { href: string; label: string; icon: string }[]> = {
  STUDENT: [
    { href: "/dashboard/student", label: "Tổng quan", icon: "🏠" },
    { href: "/dashboard/student/classes", label: "Lớp học", icon: "🏫" },
    { href: "/library", label: "Thư viện bài học", icon: "📚" },
    { href: "/progress", label: "Tiến độ & Huy hiệu", icon: "🏆" },
  ],
  TEACHER: [
    { href: "/dashboard/teacher", label: "Tổng quan", icon: "🏠" },
    { href: "/dashboard/teacher/ai-generator", label: "AI Lesson Generator", icon: "🤖" },
    { href: "/dashboard/teacher/lessons", label: "Bài học của tôi", icon: "📖" },
    { href: "/dashboard/teacher/classes", label: "Lớp học", icon: "🏫" },
  ],
  ADMIN: [
    { href: "/dashboard/admin", label: "Tổng quan", icon: "🏠" },
    { href: "/dashboard/admin/users", label: "Người dùng", icon: "👥" },
    { href: "/dashboard/admin/lessons", label: "Bài học & truyện tranh", icon: "📖" },
    { href: "/dashboard/admin/culture", label: "Dữ liệu văn hóa", icon: "🎎" },
    { href: "/dashboard/admin/characters", label: "Nhân vật truyện tranh", icon: "🧒" },
    { href: "/dashboard/admin/backgrounds", label: "Bối cảnh truyện tranh", icon: "🌄" },
    { href: "/dashboard/admin/stories", label: "Tạo & quản lý truyện", icon: "📖" },
  ],
  SUPER_ADMIN: [
    { href: "/dashboard/super-admin", label: "Tổng quan hệ thống", icon: "🏠" },
    { href: "/dashboard/admin/users", label: "Người dùng", icon: "👥" },
    { href: "/dashboard/admin/lessons", label: "Bài học & truyện tranh", icon: "📖" },
    { href: "/dashboard/admin/culture", label: "Dữ liệu văn hóa", icon: "🎎" },
    { href: "/dashboard/admin/characters", label: "Nhân vật truyện tranh", icon: "🧒" },
    { href: "/dashboard/admin/backgrounds", label: "Bối cảnh truyện tranh", icon: "🌄" },
    { href: "/dashboard/admin/stories", label: "Tạo & quản lý truyện", icon: "🎨" },
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
