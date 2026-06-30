import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToSupabase, makeFileName } from "@/lib/storage";

// POST /api/comic/upload-reference
// Body: FormData với field "file" (image) và "type" ("character" | "background")
// Trả về: { url: string }

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["TEACHER", "ADMIN"].includes(session.user.role ?? "")
    ) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "character";

    if (!file) {
      return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
    }

    // Validate loại file
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Chỉ chấp nhận file ảnh" },
        { status: 400 },
      );
    }

    // Giới hạn 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File quá lớn (tối đa 10MB)" },
        { status: 400 },
      );
    }

    const ext = file.type.includes("png")
      ? "png"
      : file.type.includes("webp")
        ? "webp"
        : "jpg";
    const prefix =
      type === "background" ? "backgrounds/refs" : "characters/refs";
    const fileName = makeFileName(prefix, ext);

    const arrayBuffer = await file.arrayBuffer();
    const url = await uploadToSupabase({
      buffer: Buffer.from(arrayBuffer),
      fileName,
      contentType: file.type,
    });

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[upload-reference]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi upload" },
      { status: 500 },
    );
  }
}
