import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageUsers } from "@/lib/rbac";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user.role)) {
    return NextResponse.json(
      { error: "Không có quyền truy cập" },
      { status: 403 },
    );
  }

  const [
    students,
    teachers,
    admins,
    lessons,
    published,
    ethnicGroups,
    aiLogs,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: { in: ["ADMIN"] } } }),
    prisma.lesson.count(),
    prisma.lesson.count({ where: { status: "PUBLISHED" } }),
    prisma.ethnicGroup.count(),
    prisma.aIGenerationLog.count(),
  ]);

  const recentLessons = await prisma.lesson.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return NextResponse.json({
    stats: {
      students,
      teachers,
      admins,
      lessons,
      published,
      ethnicGroups,
      aiLogs,
    },
    recentLessons: recentLessons.map(l => ({
      id: l.id,
      titleVi: l.titleVi,
      status: l.status,
      source: l.source,
      author: l.author.name,
      createdAt: l.createdAt,
    })),
  });
}
