import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageComicResources } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = category;
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
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }
    const body = await req.json();
    const {
      key,
      nameVi,
      nameEn,
      category,
      prompt,
      thumbnailEmoji,
      referenceImageUrl,
    } = body;
    if (!key || !nameVi || !prompt) {
      return NextResponse.json(
        { error: "Thiếu key, nameVi hoặc prompt" },
        { status: 400 },
      );
    }
    const background = await prisma.comicBackground.create({
      data: {
        key,
        nameVi,
        nameEn: nameEn || nameVi,
        category: category ?? "village",
        prompt,
        thumbnailEmoji: thumbnailEmoji ?? "🌄",
        referenceImageUrl: referenceImageUrl || null,
        createdById: session.user.id!,
      },
    });
    return NextResponse.json({ background }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
