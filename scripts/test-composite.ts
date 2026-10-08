// OFFLINE (không tốn tiền, không ghi DB/Storage): thử tách nền + ghép composite, ghi ra thư mục out.
// Dùng: npx tsx --env-file=.env scripts/test-composite.ts <assets.txt> <outDir>
import fs from "fs";
import sharp from "sharp";
import { cutoutCharacter, buildComposite, pickShot } from "../lib/imageGen";
const [assets, out] = process.argv.slice(2);
const L = fs.readFileSync(assets, "utf8").split("\n").filter(Boolean).map(l => l.split("|"));
const get = async (u: string) => Buffer.from(await (await fetch(u)).arrayBuffer());
(async () => {
  const chars = L.filter(l => l[0] === "C"); const bgs = L.filter(l => l[0] === "B");
  const cuts = new Map<string, any>();
  const tiles: any[] = []; let i = 0;
  for (const c of chars) {
    const cut = await cutoutCharacter(await get(c[2]));
    if (!cut) { console.log("CUT FAIL", c[1]); continue; }
    cuts.set(c[1], cut);
    const t = await sharp(cut.buf).resize(150, 225, { fit: "inside", background: "#00000000" }).toBuffer();
    tiles.push({ input: t, left: (i % 7) * 150, top: Math.floor(i / 7) * 225 }); i++;
    console.log(c[1], cut.w, cut.h);
  }
  await sharp({ create: { width: 1050, height: 450, channels: 3, background: "#5a8a5a" } }).composite(tiles).jpeg({ quality: 85 }).toFile(out + "/cuts.jpg");
  const bgOf = (k: string) => bgs.find(b => b[1] === k)![2];
  const combos: [string, string[], number][] = [["morning_village", ["Ya Đin", "H'Brih"], 0], ["forest_entrance", ["Pơ Mai", "Ama K'Bram"], 2], ["market_morning", ["N'Thao", "Y Điớp"], 4], ["festival_ground", ["A Linh", "Đinh Thị Hoa"], 1]];
  const roles: Record<string, string> = { "Ya Đin": "child", "H'Brih": "adult", "Pơ Mai": "child", "Ama K'Bram": "elder", "N'Thao": "child", "Y Điớp": "adult", "A Linh": "child", "Đinh Thị Hoa": "elder" };
  const outs: any[] = []; let j = 0;
  for (const [bg, names, shot] of combos) {
    const { buf } = await buildComposite(await get(bgOf(bg)), names.map(n => ({ cutout: cuts.get(n), role: roles[n] })), pickShot(shot));
    outs.push({ input: await sharp(buf).resize(448, 256).toBuffer(), left: (j % 2) * 448, top: Math.floor(j / 2) * 256 }); j++;
  }
  await sharp({ create: { width: 896, height: 512, channels: 3, background: "#000" } }).composite(outs).jpeg({ quality: 85 }).toFile(out + "/comps.jpg");
})();
