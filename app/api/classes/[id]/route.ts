import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      members: { include: { student: { select: { id: true, name: true, avatar: true, xp: true } } } },
      lessons: true,
    },
  });
  if (!cls) return NextResponse.json({ error: "Không tìm thấy lớp" }, { status: 404 });

  const role = session.user.role;
  if (cls.teacherId !== session.user.id && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    const isMember = cls.members.some((m) => m.studentId === session.user.id);
    if (!isMember) return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  const studentIds = cls.members.map((m) => m.studentId);
  const progress = await prisma.lessonProgress.findMany({
    where: { userId: { in: studentIds } },
  });

  const students = cls.members.map((m) => {
    const own = progress.filter((p) => p.userId === m.studentId);
    const lessonsRead = own.filter((p) => p.read).length;
    const avgQuiz =
      own.filter((p) => p.quizTotal).length > 0
        ? Math.round(
            (own.reduce((s, p) => s + (p.quizScore || 0) / (p.quizTotal || 1), 0) /
              own.filter((p) => p.quizTotal).length) *
              100
          )
        : null;
    return {
      id: m.student.id,
      name: m.student.name,
      avatar: m.student.avatar,
      xp: m.student.xp,
      lessonsRead,
      avgQuiz,
    };
  });

  return NextResponse.json({
    class: { id: cls.id, name: cls.name, joinCode: cls.joinCode, lessonCount: cls.lessons.length },
    students,
  });
}
