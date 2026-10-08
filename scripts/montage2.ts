import fs from "fs"; import sharp from "sharp";
const dir = process.argv[2], out = process.argv[3];
const outs = fs.readdirSync(dir).filter(f => f.endsWith("-out.jpg")).sort();
(async () => {
  const comps: import("sharp").OverlayOptions[] = [];
  const cols = 2, W = 560, H = 320;
  for (let i = 0; i < outs.length; i++) {
    comps.push({ input: await sharp(`${dir}/${outs[i]}`).resize(W, H, { fit: "fill" }).toBuffer(), left: (i % cols) * W, top: Math.floor(i / cols) * H });
    comps.push({ input: Buffer.from(`<svg width="${W}" height="20"><rect width="${W}" height="20" fill="black" opacity="0.6"/><text x="4" y="14" font-size="12" fill="white">${i} ${outs[i].slice(-14)}</text></svg>`), left: (i % cols) * W, top: Math.floor(i / cols) * H });
  }
  await sharp({ create: { width: cols * W, height: Math.ceil(outs.length / cols) * H, channels: 3, background: "#000" } }).composite(comps).jpeg({ quality: 80 }).toFile(out);
  console.log(outs.map((o, i) => i + " " + o).join("\n"));
})();
