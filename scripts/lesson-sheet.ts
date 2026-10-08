import { PrismaClient } from "@prisma/client"; import sharp from "sharp";
const p = new PrismaClient();
(async () => {
  const out = process.argv[2];
  const ls = await p.lesson.findMany({ where: { source: "SAMPLE", templateKey: { not: null } }, orderBy: { createdAt: "asc" } });
  let n = 0;
  for (const l of ls) {
    const panels = l.panels as any[]; const W = 448, H = 256, cols = 3;
    const comps: import("sharp").OverlayOptions[] = [];
    for (let i = 0; i < panels.length; i++) comps.push({ input: await sharp(Buffer.from(await (await fetch(panels[i].generatedImageUrl)).arrayBuffer())).resize(W, H, { fit: "fill" }).toBuffer(), left: (i % cols) * W, top: Math.floor(i / cols) * H });
    await sharp({ create: { width: cols * W, height: Math.ceil(panels.length / cols) * H, channels: 3, background: "#000" } }).composite(comps).jpeg({ quality: 78 }).toFile(`${out}/l${n}.jpg`);
    console.log(n, l.status, l.titleEn, panels.map(x => x.imageMode + (x.degraded ? "!" : "")).join(","));
    n++;
  }
  await p.$disconnect();
})();
