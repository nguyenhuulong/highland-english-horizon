import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateCharacterSheet } from "@/lib/imageGen";
import { uploadFromUrl, makeFileName } from "@/lib/storage";

// POST /api/comic/generate-character
// Body: { characterId: string }
// Sinh ảnh character sheet 2D và lưu vào DB + Supabase Storage

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["TEACHER", "ADMIN", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const { characterId } = await req.json();
    if (!characterId) {
      return NextResponse.json({ error: "Thiếu characterId" }, { status: 400 });
    }

    const character = await prisma.comicCharacter.findUnique({ where: { id: characterId } });
    if (!character) {
      return NextResponse.json({ error: "Không tìm thấy nhân vật" }, { status: 404 });
    }

    // Lấy tên dân tộc để đưa vào prompt
    let ethnicCulture = "K'Ho";
    if (character.ethnicGroupId) {
      const eg = await prisma.ethnicGroup.findUnique({
        where: { id: character.ethnicGroupId },
        select: { nameEn: true },
      });
      if (eg) ethnicCulture = eg.nameEn;
    }

    // Sinh ảnh character sheet
    const rawUrl = await generateCharacterSheet({
      name: character.name,
      appearancePrompt: character.appearancePrompt,
      costumePrompt: character.costumePrompt,
      ethnicCulture,
      gender: character.gender,
      role: character.role,
    });

    // Lưu ảnh vào Supabase Storage (URL Together có thể expire)
    let characterImageUrl = rawUrl;
    try {
      const fileName = makeFileName(`characters/sheets/${characterId}`, "jpg");
      characterImageUrl = await uploadFromUrl({ sourceUrl: rawUrl, fileName });
    } catch (storageErr) {
      console.warn("[generate-character] Storage upload failed, dùng URL gốc:", storageErr);
    }

    // Cập nhật DB
    await prisma.comicCharacter.update({
      where: { id: characterId },
      data: { characterImageUrl },
    });

    return NextResponse.json({ characterImageUrl });
  } catch (err) {
    console.error("[generate-character]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi sinh ảnh nhân vật" },
      { status: 500 }
    );
  }
}
