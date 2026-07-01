import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

    const { id } = await params;
    const story = await prisma.comicStory.findUnique({
      where: { id },
      include: {
        ethnicGroup: {
          select: { nameVi: true, nameEn: true, emoji: true, slug: true },
        },
        author: { select: { name: true } },
      },
    });

    if (!story)
      return NextResponse.json(
        { error: "Không tìm thấy truyện" },
        { status: 404 },
      );

    // Kiểm tra quyền
    const isAdmin = ["ADMIN"].includes(session.user.role ?? "");
    if (!isAdmin && story.authorId !== session.user.id) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    return NextResponse.json({ story });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.comicStory.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

    const isAdmin = ["ADMIN"].includes(session.user.role ?? "");
    if (!isAdmin && existing.authorId !== session.user.id) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const body = await req.json();
    const story = await prisma.comicStory.update({ where: { id }, data: body });
    return NextResponse.json({ story });
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
    const existing = await prisma.comicStory.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

    const isAdmin = ["ADMIN"].includes(session.user.role ?? "");
    if (!isAdmin && existing.authorId !== session.user.id) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    await prisma.comicStory.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
