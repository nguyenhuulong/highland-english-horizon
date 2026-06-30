import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageUsers } from "@/lib/rbac";

export async function GET() {
  const groups = await prisma.ethnicGroup.findMany({
    orderBy: { nameVi: "asc" },
  });
  return NextResponse.json({ groups });
}

const schema = z.object({
  id: z.string(),
  description: z.string().optional(),
  costume: z.array(z.string()).optional(),
  festivals: z.array(z.string()).optional(),
  instruments: z.array(z.string()).optional(),
  crafts: z.array(z.string()).optional(),
  cuisine: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  architecture: z.string().optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user.role)) {
    return NextResponse.json(
      { error: "Không có quyền truy cập" },
      { status: 403 },
    );
  }
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  const { id, ...data } = parsed.data;
  const group = await prisma.ethnicGroup.update({ where: { id }, data });
  return NextResponse.json({ group });
}
