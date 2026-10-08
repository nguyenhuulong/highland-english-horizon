// Vẽ lại panel degraded và/hoặc panel dùng nền RERENDER_SCENE=<key> của các bài SAMPLE tạo bằng script. Tốn tiền ảnh.
// Dùng: npx tsx --env-file=.env scripts/rerender-drafts.ts   (tốn tiền ảnh cho các panel degraded)
import { PrismaClient } from "@prisma/client";
import { generateComicPanel } from "../lib/imageGen";
import { makeFileName } from "../lib/storage";
const p = new PrismaClient();
(async () => {
  const lessons = await p.lesson.findMany({ where: { source: "SAMPLE", templateKey: { not: null } } });
  for (const l of lessons) {
    const panels = l.panels as any[];
    const bgs = await p.comicBackground.findMany({ where: { id: { in: panels.map(x => x.backgroundId) } } });
    let left = 0;
    for (let i = 0; i < panels.length; i++) {
      const pn = panels[i];
      if (!pn.degraded && pn.scene !== (process.env.RERENDER_SCENE ?? "__none__")) continue;
      const chars = await p.comicCharacter.findMany({ where: { id: { in: pn.characterIds } } });
      const eg = chars[0]?.ethnicGroupId ? await p.ethnicGroup.findUnique({ where: { id: chars[0].ethnicGroupId } }) : null;
      const img = await generateComicPanel({
        background: bgs.find(b => b.id === pn.backgroundId) as never, characters: chars as never, action: pn.action,
        ethnicCulture: eg?.nameEn ?? "K'Ho", panelSeed: (i + 1) * 977 + 31 + (Date.now() % 997), panelIndex: i, fileName: makeFileName(`lessons/${l.id}/panel-${i + 1}`, "jpg"),
      });
      console.log(`${l.titleEn} panel ${i + 1}: ${img.mode} diff=${img.diff?.toFixed(1) ?? "-"}${img.degraded ? " DEGRADED" : ""}`);
      panels[i] = { ...pn, generatedImageUrl: img.url, imageMode: img.mode, degraded: img.degraded, imageNote: img.note };
      if (img.degraded) left++;
    }
    await p.lesson.update({ where: { id: l.id }, data: { panels: JSON.parse(JSON.stringify(panels)), status: left === 0 ? "PUBLISHED" : "DRAFT" } });
    console.log(left === 0 ? `✔ PUBLISHED ${l.id}` : `⚠ còn ${left} panel degraded: ${l.id}`);
  }
  await p.$disconnect();
})().catch(e => { console.error(String(e).slice(0, 300)); process.exit(1); });
