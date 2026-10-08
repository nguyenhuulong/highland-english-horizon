// Báo các mục trong data/culture.ts chưa có trong từ điển (không gọi API, không đụng DB).
import { CULTURAL_GROUPS } from "../data/culture";
import { CULTURE_LEXICON } from "../data/cultureLexicon";
const keys = ["festivals", "costume", "instruments", "crafts", "cuisine", "locations"] as const;
let missing = 0;
for (const g of CULTURAL_GROUPS)
  for (const k of keys)
    for (const term of g[k] as string[])
      if (!CULTURE_LEXICON[term]) { missing++; console.log(`[${g.slug}] ${k}: "${term}"`); }
console.log(missing ? `Thiếu ${missing} mục` : "Đủ từ điển");
