import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CharacterManager from "@/components/comic/CharacterManager";
import type { ComicCharacterDTO } from "@/types";

export default async function CharactersPage() {
  const session = await auth();
  if (!session?.user || !["ADMIN"].includes(session.user.role ?? "")) {
    redirect("/dashboard");
  }

  const [dbChars, ethnicGroups] = await Promise.all([
    prisma.comicCharacter.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.ethnicGroup.findMany({ orderBy: { nameVi: "asc" }, select: { id: true, slug: true, nameVi: true } }),
  ]);

  const characters: ComicCharacterDTO[] = dbChars.map((c) => ({
    id: c.id, name: c.name, nameEn: c.nameEn,
    role: c.role as "child" | "adult" | "elder",
    gender: c.gender as "male" | "female",
    ethnicGroupId: c.ethnicGroupId,
    descriptionVi: c.descriptionVi, descriptionEn: c.descriptionEn,
    costumePrompt: c.costumePrompt, appearancePrompt: c.appearancePrompt,
    referenceImageUrl: c.referenceImageUrl,
    characterImageUrl: (c as { characterImageUrl?: string }).characterImageUrl || null,
    thumbnailEmoji: c.thumbnailEmoji, isActive: c.isActive,
  }));

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.6rem", marginBottom: 6 }}>
          🧒 Nhân vật truyện tranh
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Upload ảnh trang phục thật → nhập prompt → AI sinh ảnh nhân vật 2D hoạt hình cố định để tái sử dụng trong các truyện.
        </p>
      </div>
      <CharacterManager initialCharacters={characters} ethnicGroups={ethnicGroups} />
    </div>
  );
}
