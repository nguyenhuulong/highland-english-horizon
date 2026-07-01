import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BackgroundManager from "@/components/comic/BackgroundManager";
import type { ComicBackgroundDTO } from "@/types";

export default async function BackgroundsPage() {
  const session = await auth();
  if (!session?.user || !["ADMIN"].includes(session.user.role ?? "")) {
    redirect("/dashboard");
  }

  const [dbBgs, ethnicGroups] = await Promise.all([
    prisma.comicBackground.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.ethnicGroup.findMany({ orderBy: { nameVi: "asc" }, select: { id: true, slug: true, nameVi: true } }),
  ]);

  const backgrounds: ComicBackgroundDTO[] = dbBgs.map((b) => ({
    id: b.id, key: b.key, nameVi: b.nameVi, nameEn: b.nameEn,
    category: b.category as "village" | "forest" | "market" | "festival" | "house" | "school",
    ethnicGroupId: b.ethnicGroupId, prompt: b.prompt,
    referenceImageUrl: (b as { referenceImageUrl?: string }).referenceImageUrl || null,
    imageUrl: b.imageUrl,
    thumbnailEmoji: b.thumbnailEmoji, isActive: b.isActive,
  }));

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.6rem", marginBottom: 6 }}>
          🌄 Bối cảnh truyện tranh
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Upload ảnh tham chiếu hoặc nhập mô tả → AI sinh ảnh background cho các panel truyện.
        </p>
      </div>
      <BackgroundManager initialBackgrounds={backgrounds} ethnicGroups={ethnicGroups} />
    </div>
  );
}
