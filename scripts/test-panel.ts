// TỐN TIỀN: gọi FLUX Kontext thật (~$0.04/ảnh, tối đa 2 lần thử/panel). Ảnh lưu ở panels/test/. Không ghi DB.
// Dùng: npx tsx --env-file=.env scripts/test-panel.ts "<bgKey>" "<tên nv1,tên nv2>" <panelIndex> <outFile>
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import { generateComicPanel } from "../lib/imageGen";
import { makeFileName } from "../lib/storage";
const p = new PrismaClient();
async function main() {
  const [bgKey, names, idx, out] = process.argv.slice(2);
  const bg = await p.comicBackground.findUnique({ where: { key: bgKey } });
  const chars = await p.comicCharacter.findMany({ where: { name: { in: names.split(",") } } });
  const t0 = Date.now();
  const r = await generateComicPanel({
    background: bg as any, characters: chars as any,
    action: "Two people stand together and talk about weaving cloth", ethnicCulture: "K'Ho",
    panelSeed: 1234, panelIndex: Number(idx), fileName: makeFileName("panels/test", "jpg"),
  });
  console.log(JSON.stringify(r), ((Date.now() - t0) / 1000).toFixed(1) + "s");
  fs.writeFileSync(out, Buffer.from(await (await fetch(r.url)).arrayBuffer()));
}
main().catch(e => { console.error(String(e).slice(0, 400)); process.exit(1); }).finally(() => p.$disconnect());
