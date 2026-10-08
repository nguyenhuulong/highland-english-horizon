// Chạy pipeline NỘI DUNG (chỉ LLM, ~$0.01/bài, KHÔNG sinh ảnh, KHÔNG ghi DB).
// Dùng: npx tsx --env-file=.env scripts/test-script-gen.ts [slug] [level] [template] [--print]
import { PrismaClient } from "@prisma/client";
import { generateLessonScript, buildCultureBlock } from "../lib/lessonScript";
const p = new PrismaClient();
const PRESETS: Record<string, { names: string[]; topic: string }> = {
  kho: { names: ["Ya Đin", "H'Brih"], topic: "Ya Đin (10 tuổi, K'Ho) ngồi cùng mẹ H'Brih bên khung cửi trong nhà sàn, học từ tiếng Anh về dụng cụ dệt, màu sắc từ cây rừng và hoa văn thổ cẩm." },
  ma: { names: ["Pơ Mai", "Ama K'Bram"], topic: "Pơ Mai (9 tuổi, Mạ) đi vào rừng cùng già làng Ama K'Bram, học tên tiếng Anh của cây, chim và âm thanh rừng." },
  nung: { names: ["A Linh", "Đinh Thị Hoa"], topic: "A Linh (11 tuổi, Nùng) xem bà Đinh Thị Hoa hát Then và chơi đàn tính trong sân làng." },
};
async function main() {
  const [slug = "kho", lv = "1", tpl = "DIALOGUE_6"] = process.argv.slice(2).filter(a => !a.startsWith("--"));
  const level = Number(lv) as 1 | 2 | 3;
  const pr = PRESETS[slug];
  const eg = await p.ethnicGroup.findUnique({ where: { slug } });
  const chars = await p.comicCharacter.findMany({ where: { name: { in: pr.names } } });
  const t0 = Date.now();
  const { script, report } = await generateLessonScript({
    topic: pr.topic, templateKey: tpl, level,
    cultureBlock: buildCultureBlock(eg), characters: chars, backgroundNames: ["Làng buổi sáng", "Trong nhà"],
  });
  console.log(`slug=${slug} L${level} ${tpl} | ${((Date.now() - t0) / 1000).toFixed(1)}s | calls ${report.llmCalls} repair ${report.repairRounds}`);
  console.log("metrics", JSON.stringify(report.metrics), "| warnings:", report.warnings.join(" ; ") || "none");
  console.log("quiz answers:", script.quiz.map(q => q.answer).join(","), "| vocab:", script.vocabulary.map(v => v.en).join(", "));
  if (process.argv.includes("--print")) for (const pn of script.panels) { console.log(`P${pn.id} [${pn.characterNames}] ${pn.action}`); for (const d of pn.dialogue) console.log(`   ${d.characterName}: ${d.en}  //  ${d.vi}`); }
}
main().catch(e => { console.error(String(e).slice(0, 400)); process.exit(1); }).finally(() => p.$disconnect());
