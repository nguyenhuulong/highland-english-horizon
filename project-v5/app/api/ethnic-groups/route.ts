import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const groups = await prisma.ethnicGroup.findMany({
      orderBy: { nameVi: "asc" },
      select: { id: true, slug: true, nameVi: true, nameEn: true, emoji: true },
    });
    return NextResponse.json({ ethnicGroups: groups });
  } catch {
    return NextResponse.json({ ethnicGroups: [] });
  }
}
