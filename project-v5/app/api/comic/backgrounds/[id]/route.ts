import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageComicResource } from "@/lib/rbac";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    const { id } = await params;
    const existing = await prisma.comicBackground.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    if (
      !canManageComicResource(
        session.user.role ?? "",
        existing.createdById,
        session.user.id!,
      )
    ) {
      return NextResponse.json(
        { error: "Không có quyền — chỉ người tạo hoặc Admin mới sửa được" },
        { status: 403 },
      );
    }
    const body = await req.json();
    const background = await prisma.comicBackground.update({
      where: { id },
      data: body,
    });
    return NextResponse.json({ background });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    const { id } = await params;
    const existing = await prisma.comicBackground.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    if (
      !canManageComicResource(
        session.user.role ?? "",
        existing.createdById,
        session.user.id!,
      )
    ) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }
    await prisma.comicBackground.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
