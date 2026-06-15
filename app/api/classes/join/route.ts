import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ joinCode: z.string().min(4) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Chỉ học sinh mới có thể tham gia lớp" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const cls = await prisma.class.findUnique({ where: { joinCode: parsed.data.joinCode.toUpperCase() } });
  if (!cls) return NextResponse.json({ error: "Mã lớp không hợp lệ" }, { status: 404 });

  await prisma.classMember.upsert({
    where: { classId_studentId: { classId: cls.id, studentId: session.user.id } },
    create: { classId: cls.id, studentId: session.user.id },
    update: {},
  });

  return NextResponse.json({ ok: true, class: { id: cls.id, name: cls.name } });
}
