// READ-ONLY audit of DB state (no writes).
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const t0 = Date.now();
  const eg = await p.ethnicGroup.findMany({ select: { slug: true, nameVi: true } });
  console.log("connect+query ms:", Date.now() - t0);
  console.log("EthnicGroup:", eg.map(e => e.slug).join(","));
  const chars = await p.comicCharacter.findMany({ include: { ethnicGroup: { select: { slug: true } } } });
  for (const c of chars) console.log("CHAR", c.name, "|", c.ethnicGroup?.slug ?? "NULL", "|", c.role, "| img:", !!c.characterImageUrl, "| ref:", !!c.referenceImageUrl, "| active:", c.isActive);
  const bgs = await p.comicBackground.findMany();
  for (const b of bgs) console.log("BG", b.key, "| img:", !!b.imageUrl, "| ref:", !!b.referenceImageUrl);
  const ls = await p.lesson.groupBy({ by: ["source", "status"], _count: true });
  console.log("LESSONS", JSON.stringify(ls));
  const users = await p.user.findMany({ select: { email: true, name: true, role: true } });
  console.log("USERS", JSON.stringify(users));
  const old = await p.user.count({ where: { OR: [{ ethnicGroup: { in: ["Ê Đê", "Gia Rai", "Ba Na"] } }] } });
  console.log("users with old ethnic text:", old);
  const draft = await p.lesson.count({ where: { source: "COMIC", status: "DRAFT" } });
  console.log("orphan COMIC DRAFT:", draft);
}
main().catch(e => { console.error("ERR", String(e).slice(0, 300)); process.exit(1); }).finally(() => p.$disconnect());
