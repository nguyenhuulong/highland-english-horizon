import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canCreateComicResource } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ethnicGroupId = searchParams.get("ethnicGroupId");
    const characters = await prisma.comicCharacter.findMany({
      where: { isActive: true, ...(ethnicGroupId ? { ethnicGroupId } : {}) },
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
    if (!session?.user || !canCreateComicResource(session.user.role ?? "")) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }
    const body = await req.json();
    const {
      name,
      nameEn,
      role,
      gender,
      ethnicGroupId,
      descriptionVi,
      descriptionEn,
      costumePrompt,
      appearancePrompt,
      referenceImageUrl,
      thumbnailEmoji,
    } = body;
    if (
      !name ||
      !nameEn ||
      !descriptionVi ||
      !descriptionEn ||
      !costumePrompt ||
      !appearancePrompt
    ) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc" },
        { status: 400 },
      );
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
        referenceImageUrl: referenceImageUrl || null,
        thumbnailEmoji: thumbnailEmoji ?? "🧒",
        createdById: session.user.id!,
      },
    });
    return NextResponse.json({ character }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
