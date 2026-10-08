// READ-ONLY: đo chất lượng nội dung các bài COMIC hiện có. Không gọi API, không ghi DB.
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const LIM: Record<number, [number, number]> = { 1: [4, 8], 2: [8, 14], 3: [12, 20] };
const wc = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const CJK = /[぀-ヿ㐀-鿿가-힯]/;
async function main() {
  const lessons = await p.lesson.findMany({ where: process.env.MEASURE_NEW ? { source: "SAMPLE", templateKey: { not: null } } : { source: "COMIC" }, orderBy: { createdAt: "asc" } });
  const chars = await p.comicCharacter.findMany({ select: { id: true, name: true, nameEn: true } });
  const valid = new Set(chars.flatMap(c => [c.name, c.nameEn]));
  const T = { sent: 0, over: 0, under: 0, vocab: 0, vocabMiss: 0, dlg: 0, badName: 0, cjk: 0, panels: 0, noImg: 0, dupSent: 0, ans0: 0, quiz: 0, short4: 0 };
  for (const l of lessons) {
    const panels = (l.panels as any[]) ?? [];
    const dl = panels.flatMap(pn => (pn.dialogue ?? []) as any[]);
    const allEn = dl.map(d => d.en as string).join(" ").toLowerCase();
    const [lo, hi] = LIM[l.level] ?? LIM[2];
    let over = 0, under = 0, bad = new Set<string>(), seen = new Set<string>(), dup = 0, short4 = 0;
    for (const d of dl) {
      const n = wc(d.en); if (n > hi) over++; if (n < lo) under++; if (n < 4) short4++;
      if (!valid.has(d.character)) bad.add(d.character);
      if (CJK.test(d.vi + d.en)) T.cjk++;
      const k = d.en.toLowerCase(); if (seen.has(k)) dup++; seen.add(k);
    }
    const vocab = ((l.vocabulary as any[]) ?? []);
    const miss = vocab.filter(v => !allEn.includes(String(v.en).toLowerCase().replace(/\s*\(.*\)/, "")));
    const quiz = ((l.quiz as any[]) ?? []);
    const a0 = quiz.filter(q => q.answer === 0).length;
    const noImg = panels.filter(pn => !pn.generatedImageUrl).length;
    console.log(`L${l.level} "${l.titleEn}" | panels ${panels.length} noImg ${noImg} | sent ${dl.length} over ${over} under ${under} <4w ${short4} dup ${dup} | vocab ${vocab.length} notInDlg ${miss.length} [${miss.map(m => m.en).join("; ")}] | badNames [${[...bad].join("; ")}] | quiz ${quiz.length} ans0 ${a0} | bgs ${new Set(panels.map(pn => pn.scene)).size}`);
    T.sent += dl.length; T.over += over; T.under += under; T.short4 += short4; T.dupSent += dup; T.vocab += vocab.length; T.vocabMiss += miss.length;
    T.badName += dl.filter(d => !valid.has(d.character)).length; T.panels += panels.length; T.noImg += noImg; T.quiz += quiz.length; T.ans0 += a0;
  }
  console.log("TOTAL", JSON.stringify(T));
  console.log(`over-limit ${(100 * T.over / T.sent).toFixed(1)}% | under ${(100 * T.under / T.sent).toFixed(1)}% | vocab miss ${(100 * T.vocabMiss / T.vocab).toFixed(1)}% | bad-name lines ${(100 * T.badName / T.sent).toFixed(1)}% | no image ${(100 * T.noImg / T.panels).toFixed(1)}% | quiz ans0 ${(100 * T.ans0 / T.quiz).toFixed(0)}%`);
  const s = await p.lesson.findFirst({ where: { source: "SAMPLE" }, select: { id: true } });
  console.log("SAMPLE exists:", !!s);
}
main().catch(e => { console.error(String(e).slice(0, 300)); process.exit(1); }).finally(() => p.$disconnect());
