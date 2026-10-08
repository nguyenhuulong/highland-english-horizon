import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const chars = await p.comicCharacter.findMany({ select: { name: true, nameEn: true } });
  const valid = new Set(chars.flatMap(c => [c.name, c.nameEn]));
  const ls = await p.lesson.findMany({ where: { source: "COMIC" }, orderBy: { createdAt: "asc" } });
  for (const l of ls) {
    const bad = new Set<string>();
    for (const pn of l.panels as any[]) for (const d of pn.dialogue) if (!valid.has(d.character)) bad.add(d.character);
    console.log(l.id, l.status, "L" + l.level, l.titleEn, "| desc", l.descriptionVi.length, "| bad:", [...bad].join(";"), "| chars", (l.characterIds as string[]).length);
  }
  await p.$disconnect();
})();
