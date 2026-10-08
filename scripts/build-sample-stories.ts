// Tạo BỘ TRUYỆN MẪU chất lượng cao (source=SAMPLE) cho demo thi: sinh một lần, kiểm tra, lưu cố định.
//   npx tsx --env-file=.env scripts/build-sample-stories.ts                  # chỉ sinh kịch bản (LLM ~$0.02/bài), in số đo, KHÔNG ghi DB
//   npx tsx --env-file=.env scripts/build-sample-stories.ts --save           # ghi DB + vẽ ảnh (tốn tiền ảnh)
//   thêm --only=kho,ma để chọn dân tộc; --retries=2 số lần thử lại khi kịch bản không đạt
// Bài chỉ được PUBLISHED nếu: kịch bản không còn cảnh báo VÀ không panel nào degraded. Nếu không, để DRAFT để bạn xem.
import { PrismaClient } from "@prisma/client";
import { generateLessonScript, buildCultureBlock, TEMPLATES } from "../lib/lessonScript";
import { cultureFactsBlock } from "../data/cultureFacts";
import { generateComicPanel } from "../lib/imageGen";
import { makeFileName } from "../lib/storage";

const prisma = new PrismaClient();

interface Preset {
  slug: string;
  names: string[];
  template: keyof typeof TEMPLATES;
  level: 1 | 2 | 3;
  panelBackgrounds: string[];
  topic: string;
}

const PRESETS: Preset[] = [
  { slug: "kho", names: ["Ya Đin", "H'Brih"], template: "DIALOGUE_6", level: 1, panelBackgrounds: ["costume", "costume", "costume", "morning_village", "morning_village", "morning_village"],
    topic: "Ya Đin (10 tuổi, K'Ho) ngồi cùng mẹ H'Brih bên khung cửi trong nhà sàn. Em học từ tiếng Anh về dụng cụ dệt (loom, thread, pattern), màu chàm từ cây rừng và hoa văn thổ cẩm." },
  { slug: "ma", names: ["Pơ Mai", "Ama K'Bram"], template: "ADVENTURE_6", level: 2, panelBackgrounds: ["forest_entrance", "forest_entrance", "big_tree", "big_tree", "birds", "forest_entrance"],
    topic: "Pơ Mai (9 tuổi, Mạ) đi vào rừng cùng già làng Ama K'Bram, học về cây tre, nước suối và đan gùi." },
  { slug: "mnong", names: ["N'Thao", "Y Điớp"], template: "INTRO_4", level: 2, panelBackgrounds: ["market_morning", "cloth_stall", "vegetable_stall", "bargain"],
    topic: "N'Thao (10 tuổi, M'Nông) đi chợ phiên buổi sáng cùng Y Điớp, học các từ về mua bán: price, cheap, expensive, pay." },
  { slug: "hmong", names: ["H'Linh", "Y Blô"], template: "DIALOGUE_6", level: 1, panelBackgrounds: ["costume", "costume", "costume", "morning_village", "morning_village", "morning_village"],
    topic: "H'Linh (9 tuổi, H'Mông) học thêu hoa văn từ Y Blô, học từ về màu sắc, kim chỉ và vải." },
  { slug: "tay", names: ["Lường Khánh", "Kpă Điêu"], template: "INTRO_4", level: 2, panelBackgrounds: ["morning_village", "costume", "costume", "harvest"],
    topic: "Lường Khánh (10 tuổi, Tày) giúp thầy Kpă Điêu dọn nhà sàn, học từ về các bộ phận của nhà sàn: stilts, floor, stairs, roof." },
  { slug: "nung", names: ["A Linh", "Đinh Thị Hoa"], template: "DIALOGUE_6", level: 2, panelBackgrounds: ["morning_village", "festival_ground", "festival_ground", "dance", "dance", "morning_village"],
    topic: "A Linh (11 tuổi, Nùng) xem bà Đinh Thị Hoa hát Then và chơi đàn tính trong sân làng, học từ về nhạc cụ và âm thanh." },
];

async function main() {
  const save = process.argv.includes("--save");
  const only = process.argv.find(a => a.startsWith("--only="))?.slice(7).split(",");
  const retries = Number(process.argv.find(a => a.startsWith("--retries="))?.slice(10) ?? 2);
  const teacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });
  if (!teacher) throw new Error("Không có tài khoản giáo viên");

  for (const pr of PRESETS.filter(p => !only || only.includes(p.slug))) {
    const eg = await prisma.ethnicGroup.findUnique({ where: { slug: pr.slug } });
    const chars = await prisma.comicCharacter.findMany({ where: { name: { in: pr.names }, isActive: true } });
    const bgs = await prisma.comicBackground.findMany({ where: { key: { in: [...new Set(pr.panelBackgrounds)] } } });
    const byKey = new Map(bgs.map(b => [b.key, b]));

    // Thử lại tới khi kịch bản sạch cảnh báo
    let best: Awaited<ReturnType<typeof generateLessonScript>> | null = null;
    for (let t = 0; t <= retries; t++) {
      const r = await generateLessonScript({
        topic: pr.topic, templateKey: pr.template, level: pr.level,
        cultureBlock: buildCultureBlock(eg, cultureFactsBlock(pr.slug)),
        characters: chars.map(c => ({ name: c.name, nameEn: c.nameEn, role: c.role, gender: c.gender, descriptionVi: c.descriptionVi, appearancePrompt: c.appearancePrompt })),
        backgroundNames: bgs.map(b => b.nameVi),
      });
      if (!best || r.report.warnings.length < best.report.warnings.length) best = r;
      if (r.report.warnings.length === 0) break;
    }
    const { script, report } = best!;
    console.log(`\n=== ${pr.slug} L${pr.level} ${pr.template}: ${script.titleEn}`);
    console.log("metrics", JSON.stringify(report.metrics), "| warnings:", report.warnings.join(" ; ") || "none");
    if (!save) {
      for (const p of script.panels) { console.log(` P${p.id} ${p.action}`); for (const d of p.dialogue) console.log(`    ${d.characterName}: ${d.en}  //  ${d.vi}`); }
      continue;
    }

    const lesson = await prisma.lesson.create({
      data: {
        titleVi: script.titleVi, titleEn: script.titleEn, topic: pr.topic, descriptionVi: script.descriptionVi,
        emoji: eg?.emoji ?? "📖", level: pr.level,
        vocabulary: JSON.parse(JSON.stringify(script.vocabulary)), quiz: JSON.parse(JSON.stringify(script.quiz)),
        missions: JSON.parse(JSON.stringify(script.missions)), panels: [], status: "DRAFT", source: "SAMPLE",
        authorId: teacher.id, characterIds: chars.map(c => c.id), backgroundIds: bgs.map(b => b.id), templateKey: pr.template,
      },
    });
    const panels = [];
    let degraded = 0;
    for (let i = 0; i < script.panels.length; i++) {
      const ps = script.panels[i];
      const bgRow = byKey.get(pr.panelBackgrounds[i]) ?? bgs[0];
      const pChars = chars.filter(c => ps.characterNames.includes(c.name));
      const img = await generateComicPanel({
        background: bgRow as never, characters: (pChars.length ? pChars : chars) as never,
        action: ps.action, ethnicCulture: eg?.nameEn ?? "K'Ho", panelSeed: (i + 1) * 977, panelIndex: i,
        fileName: makeFileName(`lessons/${lesson.id}/panel-${i + 1}`, "jpg"),
      });
      if (img.degraded) degraded++;
      console.log(`  panel ${i + 1}: ${img.mode}${img.degraded ? " (degraded: " + (img.note ?? "") + ")" : ""} diff=${img.diff ?? "-"}`);
      panels.push({
        id: i + 1, bg: "#FFF3E0", scene: bgRow.key, generatedImageUrl: img.url, imageMode: img.mode, degraded: img.degraded, imageNote: img.note,
        dialogue: ps.dialogue.map(d => ({ character: d.characterName, vi: d.vi, en: d.en })),
        characterIds: (pChars.length ? pChars : chars).map(c => c.id), backgroundId: bgRow.id, action: ps.action,
      });
    }
    const ok = degraded === 0 && report.warnings.length === 0;
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { panels: JSON.parse(JSON.stringify(panels)), status: ok ? "PUBLISHED" : "DRAFT" },
    });
    console.log(ok ? `  ✔ PUBLISHED ${lesson.id}` : `  ⚠ giữ DRAFT ${lesson.id} (degraded=${degraded}, warnings=${report.warnings.length}) — xem và vẽ lại panel trong dashboard`);
  }
}
main().catch(e => { console.error(String(e).slice(0, 500)); process.exit(1); }).finally(() => prisma.$disconnect());
