import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageUsers } from "@/lib/rbac";

const schema = z.object({
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]).optional(),
  name: z.string().min(2).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user.role)) {
    return NextResponse.json(
      { error: "Không có quyền truy cập" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  if (session.user.role === "ADMIN" && parsed.data.role === "ADMIN") {
    return NextResponse.json(
      { error: "Admin không thể gán quyền Admin/Ban tổ chức" },
      { status: 403 },
    );
  }
  if (session.user.role === "ADMIN") {
    const target = await prisma.user.findUnique({ where: { id } });
    if (target && target.role === "ADMIN") {
      return NextResponse.json(
        { error: "Không thể chỉnh sửa tài khoản quản trị" },
        { status: 403 },
      );
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: parsed.data,
    select: { id: true, name: true, email: true, role: true },
  });
  return NextResponse.json({ user });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user.role)) {
    return NextResponse.json(
      { error: "Không có quyền truy cập" },
      { status: 403 },
    );
  }
  if (session.user.id === id) {
    return NextResponse.json(
      { error: "Không thể tự xóa tài khoản của mình" },
      { status: 400 },
    );
  }
  if (session.user.role === "ADMIN") {
    const target = await prisma.user.findUnique({ where: { id } });
    if (target && target.role === "ADMIN") {
      return NextResponse.json(
        { error: "Không có quyền xóa tài khoản này" },
        { status: 403 },
      );
    }
  }
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
