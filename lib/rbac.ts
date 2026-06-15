export const ROLE_LABELS: Record<string, string> = {
  GUEST: "Khách",
  STUDENT: "Học sinh",
  TEACHER: "Giáo viên",
  ADMIN: "Quản trị viên",
  SUPER_ADMIN: "Ban tổ chức",
};

export const ROLE_HOME: Record<string, string> = {
  STUDENT: "/dashboard/student",
  TEACHER: "/dashboard/teacher",
  ADMIN: "/dashboard/admin",
  SUPER_ADMIN: "/dashboard/super-admin",
};

export const ROLE_BADGE_COLOR: Record<string, string> = {
  STUDENT: "var(--secondary)",
  TEACHER: "var(--primary)",
  ADMIN: "var(--purple)",
  SUPER_ADMIN: "#1565C0",
};

export function canManageUsers(role?: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function canCreateLessons(role?: string) {
  return role === "TEACHER" || role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isStaff(role?: string) {
  return role === "TEACHER" || role === "ADMIN" || role === "SUPER_ADMIN";
}
