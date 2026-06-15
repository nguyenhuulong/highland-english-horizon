import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ classes: [] });

  const role = session.user.role;
  let classes;
  if (role === "TEACHER") {
    classes = await prisma.class.findMany({
      where: { teacherId: session.user.id },
      include: { members: true },
      orderBy: { createdAt: "desc" },
    });
  } else if (role === "ADMIN" || role === "SUPER_ADMIN") {
    classes = await prisma.class.findMany({
      include: { members: true, teacher: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
  } else {
    const memberships = await prisma.classMember.findMany({
      where: { studentId: session.user.id },
      include: { class: { include: { members: true, teacher: { select: { name: true } } } } },
    });
    classes = memberships.map((m) => m.class);
  }

  return NextResponse.json({
    classes: classes.map((c) => ({
      id: c.id,
      name: c.name,
      joinCode: c.joinCode,
      teacherId: c.teacherId,
      memberCount: c.members.length,
      createdAt: c.createdAt,
    })),
  });
}

const schema = z.object({ name: z.string().min(2) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Chỉ giáo viên mới có thể tạo lớp học" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  let joinCode = genCode();
  while (await prisma.class.findUnique({ where: { joinCode } })) {
    joinCode = genCode();
  }

  const cls = await prisma.class.create({
    data: { name: parsed.data.name, teacherId: session.user.id, joinCode },
  });

  return NextResponse.json({ class: cls }, { status: 201 });
}
