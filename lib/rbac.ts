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

// Chỉ STUDENT được lưu thành tích / XP / tiến độ
export function canSaveProgress(role?: string) {
  return role === "STUDENT";
}

// Chỉ TEACHER được tạo/sửa/xóa nhân vật và bối cảnh
export function canManageComicResources(role?: string) {
  return role === "TEACHER";
}

export function canManageComicResource(
  role?: string,
  resourceOwnerId?: string | null,
  currentUserId?: string,
) {
  if (role === "TEACHER" && resourceOwnerId === currentUserId) return true;
  return false;
}

// Chỉ TEACHER được tạo bài học
export function canCreateLessons(role?: string) {
  return role === "TEACHER";
}

// Chỉ ADMIN được quản lý users
export function canManageUsers(role?: string) {
  return role === "ADMIN";
}
