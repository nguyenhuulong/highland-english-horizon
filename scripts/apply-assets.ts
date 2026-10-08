// Áp dụng các URL đã vẽ (từ file backup mới nhất trong scripts/out/) cho các mục được chọn. Dùng: --bg  và/hoặc --char="Tên1,Tên2"
import fs from "fs";
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const f = fs.readdirSync("scripts/out").filter(x => x.startsWith("asset-backup-")).sort().pop()!;
  const d = JSON.parse(fs.readFileSync("scripts/out/" + f, "utf8")) as Record<string, { old: string | null; fresh: string }>;
  const chars = (process.argv.find(a => a.startsWith("--char="))?.slice(7).split(",")) ?? [];
  for (const [k, v] of Object.entries(d)) {
    const [t, n] = k.split(":");
    if (t === "bg" && process.argv.includes("--bg")) { await p.comicBackground.update({ where: { key: n }, data: { imageUrl: v.fresh } }); console.log("bg updated", n); }
    if (t === "char" && chars.includes(n)) { await p.comicCharacter.updateMany({ where: { name: n }, data: { characterImageUrl: v.fresh } }); console.log("char updated", n); }
  }
  await p.$disconnect();
})();
