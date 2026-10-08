import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Giữ Supabase free không bị pause: Vercel Cron gọi route này (xem vercel.json).
// Công khai nhưng không lộ thông tin nhạy cảm.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "up", at: new Date().toISOString() });
  } catch (e) {
    console.error("[health] DB lỗi:", e);
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}
