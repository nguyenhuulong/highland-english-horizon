// Pipeline sinh NỘI DUNG bài học nhiều bước, có validator + vòng tự sửa.
//   1) LLM viết lời thoại + mô tả cảnh
//   2) Code kiểm tra (độ dài theo cấp, chữ CJK, tên nhân vật, câu trùng) → LLM sửa đúng dòng lỗi (tối đa 2 vòng)
//   3) LLM chọn vocab/quiz/mission DỰA TRÊN lời thoại đã chốt; code lọc vocab không nằm trong thoại, xáo đáp án
// Prompt gửi LLM viết ASCII không dấu có chủ đích (xem HANDOFF mục 2.9).

import { z } from "zod";
import { chat, extractJson } from "@/lib/aiConfig";
import type { CulturalMission } from "@/types";

// ─── Cấp độ ───────────────────────────────────────────────────────────────────
export interface LevelSpec {
  label: string;
  minWords: number;
  maxWords: number;
  lines: [number, number]; // số lượt thoại mỗi panel
  vocab: [number, number];
  sentenceType: string;
  example: string;
  forbidden: string;
}

export const LEVEL_SPEC: Record<1 | 2 | 3, LevelSpec> = {
  1: {
    label: "Starter - tieu hoc (lop 3-5, 8-10 tuoi)",
    minWords: 4,
    maxWords: 8,
    lines: [3, 4],
    vocab: [6, 8],
    sentenceType:
      "Simple Present, cau khang dinh/phu dinh, cau hoi Yes/No hoac What/Who don gian",
    example: "This is a loom. We make cloth here.",
    forbidden:
      "KHONG cau phuc, KHONG menh de quan he, KHONG qua khu hoan thanh, KHONG bi dong, KHONG tu hoc thuat",
  },
  2: {
    label: "Basic - THCS (lop 6-7, 11-13 tuoi)",
    minWords: 8,
    maxWords: 14,
    lines: [3, 4],
    vocab: [8, 10],
    sentenceType: "Present/Past Simple, cau hoi Wh-, so sanh hon/nhat don gian",
    example: "My grandmother weaves brocade cloth every morning at home.",
    forbidden: "Tranh menh de quan he phuc tap, bi dong nhieu lop, conditional 2/3",
  },
  3: {
    label: "Intermediate - THCS nang cao (lop 8+, 13-15 tuoi)",
    minWords: 12,
    maxWords: 20,
    lines: [3, 4],
    vocab: [10, 12],
    sentenceType:
      "Da dang thi, menh de trang ngu, conditional type 1, so sanh; cau day du thong tin",
    example:
      "If you visit during the harvest festival, you will see everyone wearing colorful brocade clothes.",
    forbidden: "Khong gioi han cau truc nhung phai tu nhien, dung van canh",
  },
};

export const TEMPLATES: Record<string, { panelCount: number; guide: string }> = {
  INTRO_4: {
    panelCount: 4,
    guide: `Panel 1: Mo dau - nhan vat dang lam mot viec cu the, boi canh ro rang, gioi thieu chu de.
Panel 2: Dieu thu vi xay ra - cau hoi that su hoac su vat lien quan den van hoa.
Panel 3: Kham pha, hoc hoi - nhan vat giai thich cu the, dung dung ten van hoa tu du lieu.
Panel 4: Ket thuc - nhan vat ap dung dieu hoc duoc, cam xuc tich cuc.`,
  },
  DIALOGUE_6: {
    panelCount: 6,
    guide: `Panel 1: Hai nhan vat gap nhau trong tinh huong thuc te cua doi song buon lang.
Panel 2: Hoi tham cu the - khong chi chao hoi xa giao.
Panel 3: Cung lam mot viec thuc te (det vai, nau an, lam nuong...).
Panel 4: Mot nhan vat giai thich dieu dac biet cua van hoa minh (dung dung ten le hoi/nhac cu/mon an tu du lieu).
Panel 5: Tinh huong vui hoac thu thach nho lien quan den ngon ngu/van hoa.
Panel 6: Ket ban, loi hen co y nghia.`,
  },
  ADVENTURE_6: {
    panelCount: 6,
    guide: `Panel 1: Nhan vat len duong voi muc dich cu the, mo ta do vat mang theo.
Panel 2: Kham pha dia diem moi - mo ta chi tiet canh vat, cay coi, am thanh.
Panel 3: Gap nguoi dia phuong, hoc duoc dieu thuc te ve cuoc song noi day.
Panel 4: Kho khan hoac dieu bat ngo - lien quan den ngon ngu hoac phong tuc.
Panel 5: Cung nhau giai quyet bang kien thuc van hoa.
Panel 6: Bai hoc y nghia, ky uc dep mang ve.`,
  },
  FESTIVAL_8: {
    panelCount: 8,
    guide: `Panel 1: Khong khi chuan bi le hoi - cong viec cu the, do vat truyen thong.
Panel 2: Mac trang phuc - giai thich y nghia tung chi tiet trang phuc.
Panel 3: Den noi le hoi, gap go moi nguoi, mo ta khong khi.
Panel 4: Am nhac - ten nhac cu cu the, cach choi, y nghia.
Panel 5: Am thuc - ten mon cu the, y nghia trong le hoi.
Panel 6: Tro choi dan gian - chi mo ta nhung gi co trong du lieu van hoa, KHONG tu nghi luat choi.
Panel 7: Ket ban voi nguoi tu noi khac, chia se van hoa bang tieng Anh.
Panel 8: Chia se dieu dep nhat, y nghia le hoi voi cuoc song hien tai.`,
  },
};

// ─── Kiểu dữ liệu ─────────────────────────────────────────────────────────────
export interface ScriptCharacter {
  name: string;
  nameEn: string;
  role: string;
  gender: string;
  descriptionVi?: string;
  appearancePrompt?: string;
}

export interface ScriptPanel {
  id: number;
  backgroundIndex: number;
  characterNames: string[];
  action: string;
  dialogue: { characterName: string; en: string; vi: string }[];
}

export interface LessonScript {
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  vocabulary: { en: string; vi: string }[];
  quiz: { question_en: string; options: string[]; answer: number }[];
  missions: CulturalMission[];
  panels: ScriptPanel[];
}

export interface ScriptReport {
  llmCalls: number;
  repairRounds: number;
  warnings: string[];
  metrics: {
    sentences: number;
    inLimitPct: number;
    vocabCount: number;
    vocabInDialoguePct: number;
    quizCount: number;
  };
}

export interface ScriptInput {
  topic: string;
  templateKey: string;
  level: 1 | 2 | 3;
  cultureBlock: string;
  characters: ScriptCharacter[];
  backgroundNames: string[];
}

// ─── Schema zod ───────────────────────────────────────────────────────────────
const str = z.coerce.string();
const dialogueSchema = z.object({
  titleVi: str,
  titleEn: str,
  descriptionVi: str.optional().default(""),
  panels: z
    .array(
      z.object({
        id: z.coerce.number().optional(),
        backgroundIndex: z.coerce.number().optional().default(0),
        characterNames: z.array(str).optional().default([]),
        action: str.optional().default(""),
        dialogue: z.array(
          z.object({ characterName: str, en: str, vi: str }),
        ),
      }),
    )
    .min(1),
});

const extrasSchema = z.object({
  vocabulary: z.array(z.object({ en: str, vi: str })).default([]),
  quiz: z
    .array(
      z.object({
        question_en: str,
        options: z.array(str),
        answer: z.coerce.number(),
      }),
    )
    .default([]),
  missions: z
    .array(
      z.object({
        id: str.optional(),
        type: str.optional(),
        title: str,
        prompt: str,
        options: z
          .array(
            z.object({
              id: str.optional(),
              label: str,
              emoji: str.optional(),
              correct: z.boolean().optional(),
            }),
          )
          .default([]),
        fact: str.optional(),
      }),
    )
    .default([]),
});

const fixesSchema = z.object({
  fixes: z.array(
    z.object({
      panel: z.coerce.number(),
      line: z.coerce.number(),
      en: str,
      vi: str,
    }),
  ),
});

// ─── Validator (thuần code, có thể test) ──────────────────────────────────────
export const CJK_RE = /[　-〿぀-ヿ㐀-鿿가-힯＀-￯]/;

export function countWords(s: string): number {
  return s
    .trim()
    .split(/\s+/)
    .filter(w => /[\p{L}\p{N}]/u.test(w)).length;
}

export interface LineIssue {
  panel: number; // chỉ số 0-based
  line: number; // chỉ số 0-based
  reasons: string[];
}

// Kiểu thoại "dạy từ vựng" nhàm chán: "What is the English word for X?" — cho phép tối đa 2 câu/bài
const META_RE = /(english word|in english|how do you say|what('s| is) the word|is called .* in english)/i;
const META_ALLOWED = 2;

export function validateDialogue(
  panels: ScriptPanel[],
  level: 1 | 2 | 3,
  validNames: Set<string>,
  roles: Record<string, { role: string; gender: string }> = {},
): LineIssue[] {
  const spec = LEVEL_SPEC[level];
  const seen = new Set<string>();
  const issues: LineIssue[] = [];
  let metaCount = 0;
  panels.forEach((p, pi) =>
    p.dialogue.forEach((d, li) => {
      const reasons: string[] = [];
      const n = countWords(d.en);
      if (n > spec.maxWords)
        reasons.push(`EN co ${n} tu, toi da ${spec.maxWords}`);
      if (n < spec.minWords)
        reasons.push(`EN co ${n} tu, toi thieu ${spec.minWords}`);
      if (CJK_RE.test(d.vi) || CJK_RE.test(d.en))
        reasons.push("co ky tu chu Han/Nhat/Han Quoc - viet lai bang tieng Viet/Anh thuan");
      if (!validNames.has(d.characterName))
        reasons.push(`nguoi noi "${d.characterName}" khong thuoc danh sach nhan vat`);
      const key = d.en.trim().toLowerCase();
      if (seen.has(key)) reasons.push("cau trung voi cau truoc");
      seen.add(key);
      if (!d.vi.trim()) reasons.push("thieu ban dich tieng Viet");
      if (META_RE.test(d.en) && ++metaCount > META_ALLOWED)
        reasons.push('kieu hoi-dap tu vung ("What is the English word for...") - viet lai thanh loi thoai cua truyen that, co thong tin van hoa/hanh dong');
      if (/(the|and|with|you|spent|are|was|this|that|have|for)/i.test(d.vi.replace(/'[^']*'/g, "")))
        reasons.push("ban dich tieng Viet con lan tu tieng Anh");
      if (/welcome/i.test(d.en) && /không có vấn đề|khong co van de/i.test(d.vi))
        reasons.push('dich "You are welcome" la "Khong co chi" hoac "Khong sao dau", KHONG phai "Khong co van de"');
      const who = roles[d.characterName];
      if (who?.role === "elder" && /^\s*dạ(?=[\s,.!?]|$)/i.test(d.vi))
        reasons.push('nguoi cao tuoi noi voi tre em khong dung "Da" - dung "U", "Ua", "Dung roi"');
      if (who && who.gender === "male" && who.role !== "child" && /(^|\s)bà(?=[\s,.!?]|$)/i.test(d.vi))
        reasons.push("sai gioi tinh xung ho: nhan vat nam");
      if (reasons.length) issues.push({ panel: pi, line: li, reasons });
    }),
  );
  return issues;
}

function normTerm(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^\p{L}\p{N}' ]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Từ/cụm vocab có xuất hiện trong lời thoại EN không (chấp nhận số nhiều/-ed/-ing đơn giản). */
export function termInDialogue(term: string, dialogueEn: string): boolean {
  const t = normTerm(term);
  if (!t) return false;
  const hay = " " + normTerm(dialogueEn) + " ";
  const words = t.split(" ");
  const stem = (w: string) => (w.length > 3 ? w.replace(/(ies|es|s|ed|ing)$/, "") : w);
  const pattern = words
    .map(w => stem(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\w*\\s+");
  return new RegExp(`\\s${pattern}\\w*\\s`, "u").test(hay);
}

const ETHNIC_NAME_RE = /^(k'?ho|ma'?|mnong|m'nong|h'?mong|tay|nung)$/i;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Xáo đáp án quiz, tính lại chỉ số đáp án đúng. Trả null nếu quiz hỏng. */
export function normalizeQuiz(q: {
  question_en: string;
  options: string[];
  answer: number;
}): { question_en: string; options: string[]; answer: number } | null {
  const opts = q.options.map(o => o.trim());
  if (opts.length !== 4 || new Set(opts.map(o => o.toLowerCase())).size !== 4) return null;
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) return null;
  if (!q.question_en.trim() || opts.some(o => !o)) return null;
  if (CJK_RE.test(q.question_en + opts.join(""))) return null;
  const correct = opts[q.answer];
  const mixed = shuffle(opts);
  return { question_en: q.question_en.trim(), options: mixed, answer: mixed.indexOf(correct) };
}

function normalizeMission(
  m: z.infer<typeof extrasSchema>["missions"][number],
  idx: number,
): CulturalMission | null {
  const opts = m.options.filter(o => o.label.trim());
  if (opts.length < 3) return null;
  if (opts.filter(o => o.correct).length !== 1) return null;
  if (CJK_RE.test(m.title + m.prompt + (m.fact ?? "") + opts.map(o => o.label).join(""))) return null;
  const mixed = shuffle(opts.slice(0, 3 + (opts.length > 3 ? 1 : 0))).slice(0, 4);
  if (!mixed.some(o => o.correct)) return null;
  return {
    id: `m${idx + 1}`,
    type: "select",
    title: m.title,
    prompt: m.prompt,
    options: mixed.map((o, i) => ({
      id: String.fromCharCode(97 + i),
      label: o.label,
      emoji: o.emoji || "🌿",
      correct: !!o.correct,
    })),
    fact: m.fact,
  };
}

// ─── LLM helpers ──────────────────────────────────────────────────────────────
async function llmJson<T>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  system: string,
  user: string,
  temperature: number,
  report: ScriptReport,
  maxTokens = 6000,
): Promise<T> {
  let lastErr = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    report.llmCalls++;
    const raw = await chat({
      system,
      user: attempt === 0 ? user : `${user}\n\nLAN TRUOC LOI: ${lastErr}. Tra ve JSON dung dinh dang.`,
      temperature,
      maxTokens,
      json: true,
    });
    try {
      return schema.parse(extractJson(raw));
    } catch (e) {
      lastErr = e instanceof Error ? e.message.slice(0, 200) : "JSON khong hop le";
    }
  }
  throw new Error(`AI tra ve JSON khong hop le sau 2 lan thu (${lastErr})`);
}

function levelRules(level: 1 | 2 | 3): string {
  const s = LEVEL_SPEC[level];
  return `CAP DO ${level}: ${s.label}
- Moi cau EN dai tu ${s.minWords} den ${s.maxWords} tu (DEM TUNG CAU)
- Cau truc: ${s.sentenceType}
- ${s.forbidden}
- Vi du cau dung: "${s.example}"`;
}

function pronounHint(c: ScriptCharacter): string {
  const male = c.gender === "male";
  if (c.role === "elder") return male ? "ong (goi tre la 'chau')" : "ba (goi tre la 'chau')";
  if (c.role === "adult") return male ? "chu/bac hoac bo (goi tre la 'con'/'em')" : "co/me (goi tre la 'con'/'em')";
  return "em/con/chau (goi nguoi lon theo vai: ong, ba, co, chu, me)";
}

// ─── Hàm chính ────────────────────────────────────────────────────────────────
export async function generateLessonScript(input: ScriptInput): Promise<{
  script: LessonScript;
  report: ScriptReport;
}> {
  const { level, characters } = input;
  const spec = LEVEL_SPEC[level];
  const tmpl = TEMPLATES[input.templateKey] || TEMPLATES.INTRO_4;
  const report: ScriptReport = {
    llmCalls: 0,
    repairRounds: 0,
    warnings: [],
    metrics: { sentences: 0, inLimitPct: 0, vocabCount: 0, vocabInDialoguePct: 0, quizCount: 0 },
  };

  const validNames = new Set(characters.flatMap(c => [c.name, c.nameEn]));
  const roleMap: Record<string, { role: string; gender: string }> = {};
  for (const c of characters) roleMap[c.name] = roleMap[c.nameEn] = { role: c.role, gender: c.gender };
  const nameList = characters.map(c => c.name).join(", ") || "(tu dat 2 nhan vat)";
  const charHint = characters.length
    ? characters
        .map(
          c =>
            `- ${c.name} (EN: ${c.nameEn}; vai: ${c.role}; gioi tinh: ${c.gender}; tu xung trong tieng Viet: ${pronounHint(c)})${c.descriptionVi ? ": " + c.descriptionVi : ""}`,
        )
        .join("\n")
    : "Tu dat ten nhan vat phu hop dan toc";
  const bgHint = input.backgroundNames.length
    ? input.backgroundNames.map((b, i) => `[${i}] ${b}`).join(", ")
    : "tu mo ta";

  const baseRules = `Ban la tac gia truyen tranh giao duc song ngu Anh-Viet cho hoc sinh dan toc thieu so Tay Nguyen (Dak Nong), Viet Nam.

${levelRules(level)}

NGON NGU:
- Truong "vi": tieng Viet thuan tuy, TUYET DOI KHONG co chu Han/Trung/Nhat/Han. Dich tu nhien, dung xung ho theo quan he (me-con, ong-chau, ba-chau, co-tro).
- Ten rieng nhan vat (co dau, vi du "Ya Đin") giu nguyen trong ca "en" va "vi", KHONG dich, KHONG bo dau.
- Truong "en": tieng Anh tu nhien nhu tre em that su noi.

NHAN VAT:
- Chi duoc dung dung cac ten nay lam nguoi noi: ${nameList}. KHONG tao nhan vat moi (khong "Ba lang", "Nguoi dan"). Neu can nhac den nguoi khac, de nhan vat chinh nhac toi trong loi thoai.

VAN HOA:
- Chi dung thong tin trong DU LIEU VAN HOA ben duoi. KHONG bia le hoi, nhac cu, luat choi, hoa van. Neu du lieu khong noi, hay noi chung chung, an toan, ton trong.
- Khong rap khuon, khong mo ta ngoai hinh theo dan toc.`;

  // ── Bước 1: lời thoại ──────────────────────────────────────────────────────
  const dialogueUser = `Viet truyen tranh ${tmpl.panelCount} panel ve chu de: "${input.topic}"

${input.cultureBlock}

Nhan vat:
${charHint}

Boi canh co san (backgroundIndex): ${bgHint}

Cau truc tung panel:
${tmpl.guide}

YEU CAU:
- Moi panel co DUNG ${spec.lines[0]} den ${spec.lines[1]} luot thoai (KHONG nhieu hon), luot sau phan hoi/mo rong luot truoc, co thong tin cu the (khong chao hoi suong, khong "Okay"/"I see").
- "action": BANG TIENG ANH (khong tieng Viet), 1 cau mo ta canh NHIN THAY DUOC: ai dang lam gi, vat dung chinh trong canh (vi du loom, gong, basket), goc nhin. Khong mo ta ngoai hinh nhan vat.
- "characterNames": nhung nhan vat co mat trong panel (tu danh sach).
- Khong lap lai y giua cac panel; moi panel dua them 1 thong tin moi.
- KHONG viet kieu day tu vung ("X is called X in English", "What is this in English?"). Viet nhu mot cau chuyen that: nhan vat co mot muc tieu nho, co hanh dong, cam xuc, mot kho khan nho duoc giai quyet; tieng Anh la ngon ngu cua loi thoai.
- Cu moi 2 panel phai dung it nhat 1 thong tin van hoa CU THE lay tu DU LIEU VAN HOA hoac KIEN THUC BO SUNG (ten vat dung, nghe, nhac cu, mon an), noi bang cau don gian dung cap do.
- Ten nhan vat viet DUNG co dau nhu trong danh sach (vi du "Pơ Mai", khong viet "Po Mai").

Tra ve JSON:
{"titleVi":"...","titleEn":"...","descriptionVi":"1-2 cau","panels":[{"id":1,"backgroundIndex":0,"characterNames":["..."],"action":"...","dialogue":[{"characterName":"...","en":"...","vi":"..."}]}]}
Dung ${tmpl.panelCount} panel. Chi tra JSON.`;

  const draft = await llmJson(dialogueSchema, baseRules, dialogueUser, 0.7, report, 7000);

  const panels: ScriptPanel[] = draft.panels.slice(0, tmpl.panelCount).map((p, i) => ({
    id: p.id ?? i + 1,
    backgroundIndex: p.backgroundIndex ?? 0,
    characterNames: p.characterNames,
    action: p.action,
    dialogue: p.dialogue.slice(0, spec.lines[1]),
  }));
  // LLM đôi khi chỉ trả vài panel → xin viết tiếp phần còn thiếu (tối đa 3 lần)
  const panelsOnly = z.object({ panels: dialogueSchema.shape.panels });
  for (let t = 0; t < 3 && panels.length < tmpl.panelCount; t++) {
    const from = panels.length + 1;
    const written = panels
      .map(p => `Panel ${p.id}: ` + p.dialogue.map(d => `${d.characterName}: ${d.en}`).join(" | "))
      .join("\n");
    try {
      const more = await llmJson(
        panelsOnly,
        baseRules,
        `Truyen "${draft.titleEn}" ve chu de "${input.topic}". Da viet ${panels.length} panel dau:
${written}

${input.cultureBlock}

Nhan vat:
${charHint}
Boi canh (backgroundIndex): ${bgHint}

Cau truc ${tmpl.panelCount} panel:
${tmpl.guide}

Hay viet TIEP panel ${from} den panel ${tmpl.panelCount}, noi tiep mach truyen, khong lap y. Moi panel ${spec.lines[0]}-${spec.lines[1]} luot thoai, "action" bang tieng Anh.
Tra ve JSON: {"panels":[{"id":${from},"backgroundIndex":0,"characterNames":["..."],"action":"...","dialogue":[{"characterName":"...","en":"...","vi":"..."}]}]}`,
        0.7,
        report,
        6000,
      );
      for (const p of more.panels) {
        if (panels.length >= tmpl.panelCount) break;
        panels.push({
          id: panels.length + 1,
          backgroundIndex: p.backgroundIndex ?? 0,
          characterNames: p.characterNames,
          action: p.action,
          dialogue: p.dialogue.slice(0, spec.lines[1]),
        });
      }
    } catch (e) {
      report.warnings.push(`Viet tiep panel that bai: ${e instanceof Error ? e.message : e}`);
      break;
    }
  }
  panels.forEach((p, i) => (p.id = i + 1));
  if (panels.length < tmpl.panelCount)
    report.warnings.push(`AI chi viet ${panels.length}/${tmpl.panelCount} panel`);

  // ── Bước 2: validator + vòng sửa ───────────────────────────────────────────
  for (let round = 0; round < 2; round++) {
    const issues = validateDialogue(panels, level, validNames, roleMap);
    if (issues.length === 0) break;
    report.repairRounds++;
    const failing = issues
      .map(
        is =>
          `Panel ${is.panel + 1}, luot ${is.line + 1}: EN="${panels[is.panel].dialogue[is.line].en}" | VI="${panels[is.panel].dialogue[is.line].vi}" | LOI: ${is.reasons.join("; ")}`,
      )
      .join("\n");
    const context = [...new Set(issues.map(i => i.panel))]
      .map(
        pi =>
          `Panel ${pi + 1} (action: ${panels[pi].action}):\n` +
          panels[pi].dialogue
            .map((d, li) => `  ${li + 1}. ${d.characterName}: ${d.en} / ${d.vi}`)
            .join("\n"),
      )
      .join("\n");
    const fixUser = `Mot so luot thoai vi pham quy tac. Viet lai CHI cac luot loi, giu nguyen y nghia va mach truyen, khop voi cac luot xung quanh.

Nguoi noi hop le: ${nameList}
${levelRules(level)}

CAC LUOT LOI:
${failing}

NGU CANH:
${context}

Tra ve JSON: {"fixes":[{"panel":1,"line":2,"en":"...","vi":"..."}]} (panel/line danh so tu 1). Neu loi la nguoi noi, van viet lai en/vi cho khop nguoi noi hop le. Chi tra JSON.`;
    try {
      const fx = await llmJson(fixesSchema, baseRules, fixUser, 0.4, report, 3000);
      for (const f of fx.fixes) {
        const d = panels[f.panel - 1]?.dialogue[f.line - 1];
        if (d) {
          d.en = f.en;
          d.vi = f.vi;
        }
      }
    } catch (e) {
      report.warnings.push(`Vong sua ${round + 1} that bai: ${e instanceof Error ? e.message : e}`);
      break;
    }
  }

  // "action" dùng để sinh ảnh nên PHẢI là tiếng Anh; LLM hay viết tiếng Việt
  const VI_CHARS = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  if (panels.some(p => VI_CHARS.test(p.action))) {
    try {
      const tr = await llmJson(
        z.object({ actions: z.array(str) }),
        "You translate scene descriptions for an image generator.",
        `Translate each Vietnamese scene description into ONE short concrete English sentence (who is doing what, key objects). Keep proper names as they are. Return JSON {"actions":[...]} with exactly ${panels.length} items in the same order.\n` +
          panels.map((p, i) => `${i + 1}. ${p.action}`).join("\n"),
        0.2,
        report,
        1500,
      );
      if (tr.actions.length === panels.length)
        panels.forEach((p, i) => (p.action = tr.actions[i]));
    } catch {
      report.warnings.push("Khong dich duoc action sang tieng Anh");
    }
  }

  // Chuẩn hóa tên riêng: nameEn (không dấu) → name (đúng dấu) trong thoại
  const nameFix = characters
    .filter(c => c.nameEn && c.nameEn !== c.name)
    .map(c => ({
      re: new RegExp(`\\b${escapeRe(c.nameEn)}\\b`, "g"),
      to: c.name,
    }));
  for (const p of panels)
    for (const d of p.dialogue) {
      if (validNames.has(d.characterName)) {
        const full = characters.find(c => c.nameEn === d.characterName);
        if (full) d.characterName = full.name;
      }
      for (const f of nameFix) {
        d.en = d.en.replace(f.re, f.to);
        d.vi = d.vi.replace(f.re, f.to);
      }
    }

  // Dọn lỗi còn lại bằng code
  const fallbackSpeaker = characters[0]?.name ?? "";
  for (const p of panels) {
    for (const d of p.dialogue) {
      if (!validNames.has(d.characterName) && fallbackSpeaker) {
        const alt = p.characterNames.find(n => validNames.has(n)) ?? fallbackSpeaker;
        report.warnings.push(`Doi nguoi noi "${d.characterName}" -> "${alt}"`);
        d.characterName = alt;
      }
      if (CJK_RE.test(d.vi) || CJK_RE.test(d.en)) {
        report.warnings.push("Con ky tu CJK sau khi sua, da xoa bang code");
        d.vi = d.vi.replace(new RegExp(CJK_RE.source, "gu"), "").replace(/\s{2,}/g, " ").trim();
        d.en = d.en.replace(new RegExp(CJK_RE.source, "gu"), "").replace(/\s{2,}/g, " ").trim();
      }
    }
    p.characterNames = p.characterNames.filter(n => validNames.has(n));
    if (p.characterNames.length === 0)
      p.characterNames = [
        ...new Set(p.dialogue.map(d => d.characterName).filter(n => validNames.has(n))),
      ];
  }

  const remaining = validateDialogue(panels, level, validNames, roleMap);
  if (remaining.length)
    report.warnings.push(`Con ${remaining.length} luot thoai chua dat quy tac cap do sau khi sua`);

  const allEn = panels.flatMap(p => p.dialogue.map(d => d.en)).join(" . ");
  const dlgSummary = panels
    .map(p => `Panel ${p.id}: ` + p.dialogue.map(d => `${d.characterName}: ${d.en}`).join(" | "))
    .join("\n");

  // ── Bước 3: vocab + quiz + mission bám lời thoại ───────────────────────────
  const extrasUser = `Day la loi thoai DA CHOT cua truyen "${draft.titleEn}":
${dlgSummary}

${input.cultureBlock}

Tao:
1. "vocabulary": ${spec.vocab[0]}-${spec.vocab[1]} muc. MOI muc "en" PHAI la tu/cum tu XUAT HIEN NGUYEN VAN trong loi thoai o tren (khong chia dong tu, khong them tu moi). Chon tu huu ich cho hoc sinh cap ${level}; KHONG chon ten dan toc, ten nhan vat, tu qua de (a, the, is). "vi": nghia tieng Viet ngan, tu nhien, khong chu Han.
2. "quiz": dung 4 cau, moi cau tra loi duoc CHI dua tren loi thoai. 4 lua chon khac nhau, "answer" la chi so 0-3 cua dap an dung. Da dang: 1 cau ve tu vung, 1-2 cau hieu noi dung, 1 cau ve chi tiet van hoa. Cau hoi viet o cap ${level}.
3. "missions": 1 nhiem vu kham pha van hoa (type "select") voi 3 lua chon, dung 1 dap an dung LAY TU DU LIEU VAN HOA, 2 dap an sai hop ly. "fact": 2 cau tieng Viet, chi dung du lieu van hoa.

Tra ve JSON: {"vocabulary":[{"en":"","vi":""}],"quiz":[{"question_en":"","options":["","","",""],"answer":0}],"missions":[{"id":"m1","type":"select","title":"","prompt":"","options":[{"id":"a","label":"","emoji":"","correct":true},{"id":"b","label":"","emoji":"","correct":false},{"id":"c","label":"","emoji":"","correct":false}],"fact":""}]}
Chi tra JSON.`;

  const extras = await llmJson(extrasSchema, baseRules, extrasUser, 0.4, report, 4000);

  const vocab: { en: string; vi: string }[] = [];
  for (const v of extras.vocabulary) {
    const en = v.en.trim();
    const key = normTerm(en);
    if (!en || ETHNIC_NAME_RE.test(key) || CJK_RE.test(v.vi)) continue;
    if (vocab.some(x => normTerm(x.en) === key)) continue;
    if (!termInDialogue(en, allEn)) continue;
    vocab.push({ en, vi: v.vi.trim() });
  }

  // Thiếu vocab → xin thêm từ trong thoại
  if (vocab.length < spec.vocab[0]) {
    const need = spec.vocab[0] - vocab.length;
    try {
      const more = await llmJson(
        z.object({ vocabulary: z.array(z.object({ en: str, vi: str })) }),
        baseRules,
        `Loi thoai:\n${dlgSummary}\n\nDa co: ${vocab.map(v => v.en).join(", ")}.\nChon them ${need + 2} tu/cum tu KHAC, xuat hien nguyen van trong loi thoai, huu ich cho hoc sinh. JSON: {"vocabulary":[{"en":"","vi":""}]}`,
        0.3,
        report,
        1500,
      );
      for (const v of more.vocabulary) {
        const key = normTerm(v.en);
        if (!key || ETHNIC_NAME_RE.test(key) || CJK_RE.test(v.vi)) continue;
        if (vocab.some(x => normTerm(x.en) === key) || !termInDialogue(v.en, allEn)) continue;
        vocab.push({ en: v.en.trim(), vi: v.vi.trim() });
      }
    } catch {
      /* bỏ qua, ghi cảnh báo bên dưới */
    }
  }
  if (vocab.length < spec.vocab[0])
    report.warnings.push(`Chi co ${vocab.length} tu vung hop le (can ${spec.vocab[0]}+)`);

  const quiz = extras.quiz
    .map(normalizeQuiz)
    .filter((q): q is NonNullable<typeof q> => q !== null)
    .slice(0, 4);
  if (quiz.length < 4) report.warnings.push(`Chi co ${quiz.length}/4 cau quiz hop le`);

  const missions = extras.missions
    .map((m, i) => normalizeMission(m, i))
    .filter((m): m is CulturalMission => m !== null)
    .slice(0, 2);

  // ── Số đo ──────────────────────────────────────────────────────────────────
  const lines = panels.flatMap(p => p.dialogue);
  const inLimit = lines.filter(d => {
    const n = countWords(d.en);
    return n >= spec.minWords && n <= spec.maxWords;
  }).length;
  report.metrics = {
    sentences: lines.length,
    inLimitPct: lines.length ? Math.round((100 * inLimit) / lines.length) : 0,
    vocabCount: vocab.length,
    vocabInDialoguePct: 100, // đã lọc bằng code
    quizCount: quiz.length,
  };

  return {
    script: {
      titleVi: draft.titleVi,
      titleEn: draft.titleEn,
      descriptionVi: draft.descriptionVi,
      vocabulary: vocab,
      quiz,
      missions,
      panels,
    },
    report,
  };
}

// ─── Khối dữ liệu văn hóa từ DB (nguồn sự thật cho LLM) ───────────────────────
export function buildCultureBlock(
  g: {
    slug?: string;
    nameVi: string;
    nameEn: string;
    description: string;
    festivals: unknown;
    costume: unknown;
    instruments: unknown;
    crafts: unknown;
    cuisine: unknown;
    locations: unknown;
    architecture: string;
  } | null,
  extra = "",
): string {
  if (!g) return "Dan toc thieu so vung Tay Nguyen Viet Nam. Khong co du lieu cu the: giu boi canh chung chung, an toan.";
  const j = (v: unknown) => (Array.isArray(v) ? (v as string[]).join(" | ") : "");
  return `DU LIEU VAN HOA - CHI DUOC DUNG THONG TIN NAY, KHONG DUOC BIA THEM:
Dan toc: ${g.nameVi} (${g.nameEn})
Mo ta: ${g.description}
Le hoi: ${j(g.festivals)}
Trang phuc: ${j(g.costume)}
Nhac cu: ${j(g.instruments)}
Nghe thu cong: ${j(g.crafts)}
Am thuc truyen thong: ${j(g.cuisine)}
Dia danh: ${j(g.locations)}
Kien truc: ${g.architecture}${extra ? `

${extra}` : ""}`;
}
