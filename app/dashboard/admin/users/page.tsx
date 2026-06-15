import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import UserManagement from "@/components/dashboard/UserManagement";
import type { UserDTO } from "@/types";

export default async function AdminUsersPage() {
  const session = await auth();
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, ethnicGroup: true, ageGroup: true, avatar: true, xp: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>👥 Quản lý người dùng</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Phân quyền và quản lý tài khoản học sinh, giáo viên, quản trị viên.</p>
      <UserManagement
        users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })) as UserDTO[]}
        currentUserId={session!.user.id}
        currentRole={session!.user.role}
      />
    </div>
  );
}
