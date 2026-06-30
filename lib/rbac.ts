export const ROLE_LABELS: Record<string, string> = {
  GUEST: "Khách",
  STUDENT: "Học sinh",
  TEACHER: "Giáo viên",
  ADMIN: "Quản trị viên",
};

export const ROLE_HOME: Record<string, string> = {
  STUDENT: "/dashboard/student",
  TEACHER: "/dashboard/teacher",
  ADMIN: "/dashboard/admin",
};

export const ROLE_BADGE_COLOR: Record<string, string> = {
  STUDENT: "var(--secondary)",
  TEACHER: "var(--primary)",
  ADMIN: "var(--purple)",
};

export function canManageUsers(role?: string) {
  return role === "ADMIN";
}

export function canCreateLessons(role?: string) {
  return role === "TEACHER" || role === "ADMIN";
}

export function isStaff(role?: string) {
  return role === "TEACHER" || role === "ADMIN";
}

// Comic system — TEACHER có thể tạo/sửa resource của mình; ADMIN sửa tất cả
export function canManageComicResource(
  role?: string,
  resourceOwnerId?: string | null,
  currentUserId?: string,
) {
  if (role === "ADMIN") return true;
  if (
    role === "TEACHER" &&
    resourceOwnerId &&
    resourceOwnerId === currentUserId
  )
    return true;
  return false;
}

// Tạo mới comic resource — TEACHER và ADMIN đều được
export function canCreateComicResource(role?: string) {
  return role === "TEACHER" || role === "ADMIN";
}
