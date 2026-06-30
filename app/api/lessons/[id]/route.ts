import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  titleVi: z.string().optional(),
  titleEn: z.string().optional(),
  descriptionVi: z.string().optional(),
  ethnicGroupId: z.string().nullable().optional(),
  vocabulary: z.array(z.any()).optional(),
  panels: z.array(z.any()).optional(),
  quiz: z.array(z.any()).optional(),
  missions: z.array(z.any()).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson)
    return NextResponse.json(
      { error: "Không tìm thấy bài học" },
      { status: 404 },
    );

  const session = await auth();
  if (lesson.status !== "PUBLISHED") {
    if (!session?.user)
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 },
      );
    const role = session.user.role;
    const owner = lesson.authorId === session.user.id;
    if (!owner && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 },
      );
    }
  }

  return NextResponse.json({ lesson });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson)
    return NextResponse.json(
      { error: "Không tìm thấy bài học" },
      { status: 404 },
    );

  const role = session.user.role;
  const owner = lesson.authorId === session.user.id;
  if (!owner && role !== "ADMIN") {
    return NextResponse.json(
      { error: "Không có quyền chỉnh sửa" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  const updated = await prisma.lesson.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ lesson: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson)
    return NextResponse.json(
      { error: "Không tìm thấy bài học" },
      { status: 404 },
    );

  const role = session.user.role;
  const owner = lesson.authorId === session.user.id;
  if (!owner && role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền xóa" }, { status: 403 });
  }

  await prisma.lesson.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
