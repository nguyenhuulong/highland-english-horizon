import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/leaderboard?limit=20
// Public — không cần đăng nhập
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const top = await prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { xp: "desc" },
      take: limit,
      select: { id: true, name: true, avatar: true, xp: true, streak: true, ethnicGroup: true },
    });

    return NextResponse.json({
      leaderboard: top.map((u, i) => ({ rank: i + 1, ...u })),
    });
  } catch {
    return NextResponse.json({ leaderboard: [] });
  }
}
