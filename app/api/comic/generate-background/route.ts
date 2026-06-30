import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generatePanelImage } from "@/lib/imageGen";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const { backgroundId } = await req.json();
    if (!backgroundId) {
      return NextResponse.json({ error: "Thiếu backgroundId" }, { status: 400 });
    }

    const bg = await prisma.comicBackground.findUnique({ where: { id: backgroundId } });
    if (!bg) {
      return NextResponse.json({ error: "Không tìm thấy background" }, { status: 404 });
    }

    const seed = Math.abs(parseInt(bg.id.replace(/[^0-9]/g, "").slice(0, 8) || "42", 10)) % 10000;
    const imageUrl = await generatePanelImage({ panelPrompt: bg.prompt, seed });

    await prisma.comicBackground.update({
      where: { id: backgroundId },
      data: { imageUrl },
    });

    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("[generate-background] Error:", err);
    return NextResponse.json({ error: "Lỗi sinh ảnh" }, { status: 500 });
  }
}
