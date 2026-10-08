// Sửa lời thoại các bài SAMPLE do script tạo: trẻ em không gọi người lớn bằng tên đầy đủ, từ tiếng Việt trong câu EN đặt trong "...",
// rút gọn mô tả. Chỉ tốn LLM (~$0.01/bài). Dùng: npx tsx --env-file=.env scripts/fix-sample-dialogue.ts [--dry]
import { PrismaClient } from "@prisma/client";
import { repairStoredDialogue, quoteVietnameseTerms, trimDescription, type ScriptPanel } from "../lib/lessonScript";
import { LEXICON_KEYS } from "../data/cultureLexicon";
const p = new PrismaClient();
(async () => {
  const dry = process.argv.includes("--dry");
  const ls = await p.lesson.findMany({ where: { source: "SAMPLE", templateKey: { not: null } } });
  for (const l of ls) {
    const chars = await p.comicCharacter.findMany({ where: { id: { in: l.characterIds as string[] } } });
    const sc = chars.map(c => ({ name: c.name, nameEn: c.nameEn, role: c.role, gender: c.gender }));
    const stored = l.panels as any[];
    const panels: ScriptPanel[] = stored.map(pn => ({ id: pn.id, backgroundIndex: 0, characterNames: [], action: pn.action ?? "", dialogue: pn.dialogue.map((d: any) => ({ characterName: d.character, en: d.en, vi: d.vi })) }));
    const r = await repairStoredDialogue(panels, l.level as 1 | 2 | 3, sc);
    const protect = chars.flatMap(c => [c.name, c.nameEn]);
    panels.forEach((pn, i) => pn.dialogue.forEach((d, j) => {
      d.en = quoteVietnameseTerms(d.en, protect, LEXICON_KEYS);
      if (!/[.!?…"'”)]$/.test(d.en.trim())) d.en = d.en.trim() + ".";
      stored[i].dialogue[j] = { ...stored[i].dialogue[j], character: d.characterName, en: d.en, vi: d.vi };
    }));
    const quiz = (l.quiz as any[]).map(q => ({ ...q, question_en: quoteVietnameseTerms(q.question_en, protect, LEXICON_KEYS), options: q.options.map((o: string) => quoteVietnameseTerms(o, protect, LEXICON_KEYS)) }));
    console.log(l.titleEn, "| llm", r.llmCalls, "| warnings:", r.warnings.join(";") || "none");
    for (const pn of panels.slice(0, 2)) for (const d of pn.dialogue) console.log("   ", d.characterName + ":", d.en);
    if (!dry) await p.lesson.update({ where: { id: l.id }, data: { panels: JSON.parse(JSON.stringify(stored)), quiz: JSON.parse(JSON.stringify(quiz)), descriptionVi: trimDescription(l.descriptionVi) } });
  }
  await p.$disconnect();
})().catch(e => { console.error(String(e).slice(0, 400)); process.exit(1); });
