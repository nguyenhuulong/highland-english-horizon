// Sửa ảnh nhân vật bằng FLUX Kontext (giữ phong cách/trang phục, đổi theo chỉ dẫn). ~$0.04/ảnh.
// Dùng: npx tsx --env-file=.env scripts/edit-character.ts "<tên>" "<chỉ dẫn tiếng Anh>" [--apply]
import { PrismaClient } from "@prisma/client";
import { makeFileName, uploadFromUrl } from "../lib/storage";
const p = new PrismaClient();
(async () => {
  const [name, instruction] = process.argv.slice(2);
  const c = await p.comicCharacter.findFirst({ where: { name } });
  if (!c?.characterImageUrl) throw new Error("không có ảnh");
  const res = await fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.TOGETHER_API_KEY}` },
    body: JSON.stringify({ model: "black-forest-labs/FLUX.1-kontext-pro", prompt: instruction + " Keep the same art style, pure white background, full body, no text, no watermark.", image_url: c.characterImageUrl, width: 512, height: 768, steps: 28, n: 1, seed: 7 }),
  });
  const j = await res.json();
  const url = j.data?.[0]?.url;
  if (!url) throw new Error(JSON.stringify(j).slice(0, 300));
  const stored = await uploadFromUrl({ sourceUrl: url, fileName: makeFileName(`characters/sheets/${c.id}`, "jpg") });
  console.log("old:", c.characterImageUrl, "\nnew:", stored);
  if (process.argv.includes("--apply")) { await p.comicCharacter.update({ where: { id: c.id }, data: { characterImageUrl: stored } }); console.log("DB updated"); }
  await p.$disconnect();
})().catch(e => { console.error(String(e).slice(0, 400)); process.exit(1); });
