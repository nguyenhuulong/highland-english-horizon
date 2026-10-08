import fs from "fs"; import sharp from "sharp";
const [dir, out, ...names] = process.argv.slice(2);
(async () => {
  const comps = [];
  for (let i = 0; i < names.length; i++) comps.push({ input: await sharp(fs.readFileSync(`${dir}/${names[i]}.bin`)).resize(260, 390, { fit: "contain", background: "#fff" }).toBuffer(), left: i * 260, top: 0 });
  await sharp({ create: { width: 260 * names.length, height: 390, channels: 3, background: "#fff" } }).composite(comps).jpeg().toFile(out);
})();
