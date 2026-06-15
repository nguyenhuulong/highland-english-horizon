import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageUsers } from "@/lib/rbac";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");

  const users = await prisma.user.findMany({
    where: role ? { role: role as "STUDENT" | "TEACHER" | "ADMIN" | "SUPER_ADMIN" } : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      ethnicGroup: true,
      ageGroup: true,
      avatar: true,
      xp: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ users });
}

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN", "SUPER_ADMIN"]),
  ethnicGroup: z.string().optional(),
  ageGroup: z.coerce.number().int().min(5).max(20).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }
  if (session.user.role === "ADMIN") {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    if (parsed.data.role === "ADMIN" || parsed.data.role === "SUPER_ADMIN") {
      return NextResponse.json({ error: "Admin chỉ có thể tạo tài khoản giáo viên/học sinh" }, { status: 403 });
    }
    return createUser(parsed.data);
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  return createUser(parsed.data);
}

async function createUser(data: z.infer<typeof schema>) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return NextResponse.json({ error: "Email đã tồn tại" }, { status: 409 });

  const hashed = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      role: data.role,
      ethnicGroup: data.ethnicGroup,
      ageGroup: data.ageGroup,
      avatar: data.role === "TEACHER" ? "🧑‍🏫" : data.role === "STUDENT" ? "🧒" : "🛡️",
    },
    select: { id: true, name: true, email: true, role: true },
  });
  return NextResponse.json({ user }, { status: 201 });
}
