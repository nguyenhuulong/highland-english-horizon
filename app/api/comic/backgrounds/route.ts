import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const ethnicGroupId = searchParams.get("ethnicGroupId");
    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = category;
    if (ethnicGroupId) where.ethnicGroupId = ethnicGroupId;
    const backgrounds = await prisma.comicBackground.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ backgrounds });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }
    const body = await req.json();
    const { key, nameVi, nameEn, category, ethnicGroupId, prompt, thumbnailEmoji } = body;
    if (!key || !nameVi || !nameEn || !prompt) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }
    const background = await prisma.comicBackground.create({
      data: {
        key,
        nameVi,
        nameEn,
        category: category ?? "village",
        ethnicGroupId: ethnicGroupId || null,
        prompt,
        thumbnailEmoji: thumbnailEmoji ?? "🌄",
      },
    });
    return NextResponse.json({ background }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
