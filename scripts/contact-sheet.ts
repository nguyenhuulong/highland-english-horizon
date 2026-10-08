// Tải ảnh asset và ghép contact sheet để xem nhanh (chỉ đọc).
import fs from "fs";
import sharp from "sharp";
const lines = fs.readFileSync(process.argv[2], "utf8").split("\n").filter(Boolean);
async function sheet(kind: "B" | "C", out: string) {
  const items = lines.filter(l => l.startsWith(kind + "|")).map(l => l.split("|"));
  const cw = kind === "B" ? 300 : 150, ch = kind === "B" ? 172 : 225, cols = kind === "B" ? 4 : 7;
  const rows = Math.ceil(items.length / cols);
  const comps: import("sharp").OverlayOptions[] = [];
  for (let i = 0; i < items.length; i++) {
    const url = kind === "B" ? items[i][2] : items[i][2];
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    const img = await sharp(buf).resize(cw, ch, { fit: "cover" }).toBuffer();
    const label = Buffer.from(`<svg width="${cw}" height="18"><rect width="${cw}" height="18" fill="black" opacity="0.6"/><text x="3" y="13" font-size="12" fill="white">${i + 1} ${items[i][1].replace(/[<&]/g, "")}</text></svg>`);
    comps.push({ input: img, left: (i % cols) * cw, top: Math.floor(i / cols) * ch });
    comps.push({ input: label, left: (i % cols) * cw, top: Math.floor(i / cols) * ch });
  }
  await sharp({ create: { width: cols * cw, height: rows * ch, channels: 3, background: "#888" } }).composite(comps).jpeg({ quality: 80 }).toFile(out);
}
(async () => { await sheet("B", process.argv[3] + "/bg.jpg"); await sheet("C", process.argv[3] + "/chars.jpg"); })();
