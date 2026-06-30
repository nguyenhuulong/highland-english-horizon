import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ethnicGroupId = searchParams.get("ethnicGroupId");
    const where = ethnicGroupId
      ? { isActive: true, ethnicGroupId }
      : { isActive: true };
    const characters = await prisma.comicCharacter.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ characters });
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
    const { name, nameEn, role, gender, ethnicGroupId, descriptionVi, descriptionEn,
      costumePrompt, appearancePrompt, thumbnailEmoji } = body;
    if (!name || !nameEn || !descriptionVi || !descriptionEn || !costumePrompt || !appearancePrompt) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }
    const character = await prisma.comicCharacter.create({
      data: {
        name,
        nameEn,
        role: role ?? "child",
        gender: gender ?? "female",
        ethnicGroupId: ethnicGroupId || null,
        descriptionVi,
        descriptionEn,
        costumePrompt,
        appearancePrompt,
        thumbnailEmoji: thumbnailEmoji ?? "🧒",
        createdById: session.user.id!,
      },
    });
    return NextResponse.json({ character }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
