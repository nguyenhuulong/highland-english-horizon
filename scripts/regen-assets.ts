// VẼ LẠI tài sản gốc bị lỗi (xem docs/AUDIT.md mục 5). TỐN TIỀN (~$0.018/ảnh).
// Mặc định chỉ IN KẾ HOẠCH. Yêu cầu Together đã bật "third-party data sharing".
//   npx tsx --env-file=.env scripts/regen-assets.ts                 # xem kế hoạch + chi phí
//   npx tsx --env-file=.env scripts/regen-assets.ts --run           # vẽ + lưu Storage, KHÔNG đụng DB, in URL để xem
//   npx tsx --env-file=.env scripts/regen-assets.ts --run --apply   # vẽ + cập nhật DB (sao lưu URL cũ vào scripts/out/)
//   thêm --only=key1,key2 để chỉ làm một số mục
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { generateBackgroundImage, generateCharacterSheet } from "../lib/imageGen";
import { makeFileName, uploadFromUrl } from "../lib/storage";

const prisma = new PrismaClient();
const NO_CN =
  "Central Highlands of Vietnam (Tay Nguyen), NOT Chinese or Japanese style, no pagoda, no temple, no lanterns, no calligraphy, no text, no people, no animals, no watermark";

// Nền hiện có người / kiến trúc Trung Hoa → vẽ lại sạch
const BACKGROUNDS: Record<string, string> = {
  festival_ground:
    `highland village festival ground at dusk, large central bonfire in an open yard, triangle cloth banners, tall wooden communal longhouse with steep thatched roof on stilts in the background, mountains, warm orange firelight, children book illustration, ${NO_CN}`,
  drum: `evening gong and drum ceremony area, bonfire, a rack of bronze gongs and large wooden drums on a wooden platform, a stilt longhouse with thatched roof, mountains, warm light, children book illustration, ${NO_CN}`,
  costume: `inside a wooden stilt house of Central Highlands Vietnam, woven bamboo walls, a wooden loom with colorful brocade thread, baskets, woven mats on the floor, open doorway showing green hills, warm interior light, children book illustration, ${NO_CN}`,
  dance: `open village yard at night for a traditional dance, bonfire in the middle, strings of small cloth flags, stilt houses with thatched roofs around, mountains and stars, empty of people, children book illustration, ${NO_CN}`,
  birds: `lush highland forest canopy with hornbills and colorful birds on branches, soft morning light, ferns, children book illustration, ${NO_CN}`,
  butterfly: `sunny forest clearing full of wildflowers and colorful butterflies, tall trees, soft golden light, empty of people, children book illustration, ${NO_CN}`,
  bargain: `highland morning market stalls with baskets of vegetables, fruit and woven cloth, wooden counter in the foreground, empty of people, mountains behind, children book illustration, ${NO_CN}`,
  cloth_stall: `highland market stall displaying folded brocade cloths in indigo, red and white geometric patterns, wooden stall with bamboo roof, empty of people, children book illustration, ${NO_CN}`,
};

// Nhân vật có watermark / sai giới tính / trùng ảnh
const CHARACTERS = ["Ya Đin", "Y Điớp", "A Linh", "Kpă Điêu", "Ama K'Bram"];
const CHAR_EXTRA: Record<string, string> = {
  "Ama K'Bram": "an elderly MAN (male), grey hair, thin grey beard, traditional Ma (Central Highlands) indigo-and-white woven tunic and loincloth",
};

async function main() {
  const run = process.argv.includes("--run");
  const apply = process.argv.includes("--apply");
  const only = process.argv.find(a => a.startsWith("--only="))?.slice(7).split(",");
  const bgKeys = Object.keys(BACKGROUNDS).filter(k => !only || only.includes(k));
  const chars = CHARACTERS.filter(c => !only || only.includes(c));
  const total = bgKeys.length + chars.length;
  console.log(`Kế hoạch: ${bgKeys.length} nền (${bgKeys.join(", ")}) + ${chars.length} nhân vật (${chars.join(", ")}) = ${total} ảnh ≈ $${(total * 0.018).toFixed(2)}`);
  if (!run) return console.log("Chưa chạy. Thêm --run để vẽ (và --apply để cập nhật DB).");

  const out: Record<string, { old: string | null; fresh: string }> = {};
  for (const key of bgKeys) {
    const bg = await prisma.comicBackground.findUnique({ where: { key } });
    if (!bg) continue;
    const tmp = await generateBackgroundImage({ prompt: BACKGROUNDS[key], nameEn: key + "-v2" });
    const url = await uploadFromUrl({ sourceUrl: tmp, fileName: makeFileName(`backgrounds/${bg.id}`, "jpg") });
    out["bg:" + key] = { old: bg.imageUrl, fresh: url };
    console.log("bg", key, url);
    if (apply) await prisma.comicBackground.update({ where: { key }, data: { imageUrl: url, prompt: BACKGROUNDS[key] } });
  }
  for (const name of chars) {
    const c = await prisma.comicCharacter.findFirst({ where: { name }, include: { ethnicGroup: true } });
    if (!c) continue;
    const tmp = await generateCharacterSheet({
      name: name + "-v2",
      appearancePrompt: CHAR_EXTRA[name] ?? c.appearancePrompt,
      costumePrompt: c.costumePrompt,
      ethnicCulture: c.ethnicGroup?.nameEn ?? "highland",
      gender: c.gender,
      role: c.role,
      referenceImageUrl: null,
    });
    const url = await uploadFromUrl({ sourceUrl: tmp, fileName: makeFileName(`characters/sheets/${c.id}`, "jpg") });
    out["char:" + name] = { old: c.characterImageUrl, fresh: url };
    console.log("char", name, url);
    if (apply) await prisma.comicCharacter.update({ where: { id: c.id }, data: { characterImageUrl: url } });
  }
  fs.mkdirSync("scripts/out", { recursive: true });
  fs.writeFileSync(`scripts/out/asset-backup-${Date.now()}.json`, JSON.stringify(out, null, 2));
  console.log(apply ? "Đã cập nhật DB. URL cũ lưu trong scripts/out/." : "Chưa cập nhật DB (thêm --apply sau khi xem ảnh).");
}
main().catch(e => { console.error(String(e).slice(0, 400)); process.exit(1); }).finally(() => prisma.$disconnect());
