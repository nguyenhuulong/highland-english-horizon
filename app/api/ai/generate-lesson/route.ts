import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateLessonWithAI } from "@/lib/ai";
import { isStaff } from "@/lib/rbac";

const schema = z.object({
  topic: z.string().min(2),
  ethnicGroup: z.string().min(2),
  ageGroup: z.coerce.number().int().min(5).max(20),
  vocabulary: z.array(z.string()).default([]),
  objective: z.string().min(2),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !isStaff(session.user.role)) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const lesson = await generateLessonWithAI(parsed.data);

    await prisma.aIGenerationLog.create({
      data: {
        userId: session.user.id,
        input: parsed.data,
        status: "success",
      },
    });

    return NextResponse.json({ lesson });
  } catch (err) {
    await prisma.aIGenerationLog.create({
      data: {
        userId: session.user.id,
        input: parsed.data,
        status: "error",
      },
    });
    const message = err instanceof Error ? err.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
