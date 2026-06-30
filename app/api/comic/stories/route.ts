import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const ethnicGroupId = searchParams.get("ethnicGroupId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    // Teacher chỉ thấy truyện của mình; Admin thấy tất cả
    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
      where.authorId = session.user.id;
    }
    if (ethnicGroupId) where.ethnicGroupId = ethnicGroupId;
    if (status) where.status = status;

    const stories = await prisma.comicStory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        ethnicGroup: { select: { nameVi: true, nameEn: true, emoji: true } },
        author: { select: { name: true } },
      },
    });

    return NextResponse.json({ stories });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["TEACHER", "ADMIN", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const body = await req.json();
    const { title, titleEn, topic, templateKey, ethnicGroupId, characterIds, backgroundIds } = body;

    if (!title || !topic || !templateKey) {
      return NextResponse.json({ error: "Thiếu title, topic hoặc templateKey" }, { status: 400 });
    }

    const story = await prisma.comicStory.create({
      data: {
        title,
        titleEn: titleEn || title,
        topic,
        templateKey: templateKey || "INTRO_4",
        status: "draft",
        ethnicGroupId: ethnicGroupId || null,
        authorId: session.user.id!,
        characterIds: characterIds || [],
        backgroundIds: backgroundIds || [],
        panels: [],
        vocabulary: [],
      },
    });

    return NextResponse.json({ story }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
