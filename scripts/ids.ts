import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const g = await p.ethnicGroup.findUnique({ where: { slug: "tay" } });
  const cs = await p.comicCharacter.findMany({ where: { name: { in: ["Lường Khánh", "Kpă Điêu"] } } });
  const bs = await p.comicBackground.findMany({ where: { key: { in: ["morning_village", "costume", "harvest"] } } });
  console.log(JSON.stringify({ g: g?.id, c: cs.map(c => c.id), b: bs.map(b => b.id) }));
  await p.$disconnect();
})();
