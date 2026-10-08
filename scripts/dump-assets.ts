import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const cs = await p.comicCharacter.findMany({ select: { name: true, characterImageUrl: true, referenceImageUrl: true, costumePrompt: true } });
  for (const c of cs) console.log("C|" + c.name + "|" + c.characterImageUrl + "|" + (c.referenceImageUrl ?? "") + "|" + c.costumePrompt.slice(0, 80));
  const bs = await p.comicBackground.findMany({ select: { key: true, imageUrl: true } });
  for (const b of bs) console.log("B|" + b.key + "|" + b.imageUrl);
}
main().finally(() => p.$disconnect());
