import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateBackgroundImage } from "@/lib/imageGen";
import { uploadFromUrl, makeFileName } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN"].includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const { backgroundId } = await req.json();
    if (!backgroundId) {
      return NextResponse.json(
        { error: "Thiếu backgroundId" },
        { status: 400 },
      );
    }

    const bg = await prisma.comicBackground.findUnique({
      where: { id: backgroundId },
    });
    if (!bg)
      return NextResponse.json(
        { error: "Không tìm thấy background" },
        { status: 404 },
      );

    let ethnicCulture: string | undefined;
    if (bg.ethnicGroupId) {
      const eg = await prisma.ethnicGroup.findUnique({
        where: { id: bg.ethnicGroupId },
        select: { nameEn: true },
      });
      ethnicCulture = eg?.nameEn;
    }

    const rawUrl = await generateBackgroundImage({
      prompt: bg.prompt,
      nameEn: bg.nameEn,
      ethnicCulture,
    });

    let imageUrl = rawUrl;
    try {
      const fileName = makeFileName(`backgrounds/${backgroundId}`, "jpg");
      imageUrl = await uploadFromUrl({ sourceUrl: rawUrl, fileName });
    } catch (e) {
      console.warn("[generate-background] Storage failed:", e);
    }

    await prisma.comicBackground.update({
      where: { id: backgroundId },
      data: { imageUrl },
    });

    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("[generate-background]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi sinh ảnh" },
      { status: 500 },
    );
  }
}
