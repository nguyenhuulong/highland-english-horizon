import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkAIConfig, getAIConfig } from "@/lib/aiConfig";

// Quản trị xem cấu hình AI đang dùng (KHÔNG lộ key).
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  const cfg = getAIConfig();
  return NextResponse.json({
    provider: cfg.provider,
    baseUrl: cfg.baseUrl,
    model: cfg.model,
    llmKeySet: !!cfg.apiKey,
    imageKeySet: !!process.env.TOGETHER_API_KEY,
    storageConfigured: !!(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    problem: checkAIConfig(cfg),
  });
}
