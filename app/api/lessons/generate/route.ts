import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateComicPanel } from "@/lib/imageGen";
import { uploadFromUrl, makeFileName } from "@/lib/storage";
import type {
  ComicCharacterDTO,
  ComicBackgroundDTO,
  CulturalMission,
} from "@/types";

const AI_BASE_URL = (
  process.env.AI_BASE_URL || "https://api.together.xyz/v1"
).replace(/\/+$/, "");
const AI_MODEL =
  process.env.AI_MODEL || "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const AI_API_KEY = process.env.AI_API_KEY || "";

// ─── Cap do ───────────────────────────────────────────────────────────────────
const LEVEL_SPEC: Record<
  number,
  {
    label: string;
    dialogueWords: string;
    vocabCount: string;
    sentenceType: string;
    example: string;
    forbidden: string;
  }
> = {
  1: {
    label: "Starter — Tieu hoc (lop 3-5, 8-10 tuoi)",
    dialogueWords: "4-8 tu/cau",
    vocabCount: "6-8 tu don gian: danh tu, dong tu co ban, mau sac, so dem",
    sentenceType:
      "Simple Present, cau khang dinh/phu dinh, cau hoi Yes/No don gian",
    example: "This is a gong. We play it at festivals.",
    forbidden:
      "KHONG dung cau phuc, menh de quan he, thi qua khu hoan thanh, passive voice, tu vung hoc thuat. Moi cau PHAI co duoi 9 tu.",
  },
  2: {
    label: "Basic — THCS (lop 6-7, 11-13 tuoi)",
    dialogueWords: "8-14 tu/cau",
    vocabCount: "8-10 tu: danh tu, dong tu, tinh tu, cum tu van hoa co ban",
    sentenceType: "Present/Past Simple, cau hoi Wh-, so sanh hon/nhat don gian",
    example:
      "My grandmother weaves brocade cloth every morning at the longhouse.",
    forbidden:
      "Tranh menh de quan he phuc tap, passive voice nhieu lop, conditional type 2/3",
  },
  3: {
    label: "Intermediate — THCS nang cao (lop 8+, 13-15 tuoi)",
    dialogueWords: "12-20 tu/cau",
    vocabCount:
      "10-14 tu: cum tu van hoa, thanh ngu don gian, tu hoc thuat vua phai",
    sentenceType:
      "Da dang thi, menh de trang ngu, conditional type 1, so sanh phuc tap",
    example:
      "If you visit during the harvest festival, you will see everyone wearing traditional K'Ho brocade costumes.",
    forbidden:
      "Khong gioi han cau truc nhung phai tu nhien, phu hop van canh cau chuyen",
  },
};

// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES: Record<string, { panelCount: number; guide: string }> = {
  INTRO_4: {
    panelCount: 4,
    guide: `Panel 1: Mo dau — nhan vat dang lam gi cu the, boi canh ro rang, gioi thieu chu de.
Panel 2: Dieu thu vi xay ra — cau hoi that su hoac su vat lien quan den van hoa.
Panel 3: Kham pha, hoc hoi — nhan vat giai thich cu the, dung dung ten van hoa tu du lieu.
Panel 4: Ket thuc — nhan vat ap dung dieu hoc duoc, cam xuc tich cuc.`,
  },
  DIALOGUE_6: {
    panelCount: 6,
    guide: `Panel 1: Hai nhan vat gap nhau trong tinh huong thuc te cua doi song buon lang.
Panel 2: Hoi tham cu the — khong chi chao hoi xa giao.
Panel 3: Cung lam mot viec thuc te (det vai, nau an, lam nuong...).
Panel 4: Mot nhan vat giai thich dieu dac biet cua van hoa minh (dung dung ten le hoi/nhac cu/mon an tu du lieu).
Panel 5: Tinh huong vui hoac thu thach nho lien quan den ngon ngu/van hoa.
Panel 6: Ket ban, loi hen co y nghia.`,
  },
  ADVENTURE_6: {
    panelCount: 6,
    guide: `Panel 1: Nhan vat len duong voi muc dich cu the, mo ta do vat mang theo.
Panel 2: Kham pha dia diem moi — mo ta chi tiet canh vat, cay coi, am thanh.
Panel 3: Gap nguoi dia phuong, hoc duoc dieu thuc te ve cuoc song noi day.
Panel 4: Kho khan hoac dieu bat ngo — lien quan den ngon ngu hoac phong tuc.
Panel 5: Cung nhau giai quyet bang kien thuc van hoa.
Panel 6: Bai hoc y nghia, ky uc dep mang ve.`,
  },
  FESTIVAL_8: {
    panelCount: 8,
    guide: `Panel 1: Khong khi chuan bi le hoi — cong viec cu the, do vat truyen thong.
Panel 2: Mac trang phuc — giai thich y nghia tung chi tiet trang phuc.
Panel 3: Den noi le hoi, gap go moi nguoi, mo ta khong khi.
Panel 4: Am nhac — ten nhac cu cu the, cach choi, y nghia.
Panel 5: Am thuc — ten mon cu the, cach lam, y nghia trong le hoi.
Panel 6: Tro choi dan gian — mo ta luat choi, cach tham gia.
Panel 7: Ket ban voi nguoi tu noi khac, chia se van hoa bang tieng Anh.
Panel 8: Chia se dieu dep nhat, y nghia le hoi voi cuoc song hien tai.`,
  },
};

// ─── LLM helper ────────────────────────────────────────────────────────────────
async function callLLM(system: string, user: string): Promise<string> {
  const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(AI_API_KEY ? { Authorization: `Bearer ${AI_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.72,
      max_tokens: 9000,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok)
    throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI khong tra ve noi dung");
  return content;
}

function parseJson(raw: string): unknown {
  let s = raw
    .trim()
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();
  const a = s.indexOf("{"),
    b = s.lastIndexOf("}");
  if (a !== -1 && b !== -1) s = s.slice(a, b + 1);
  return JSON.parse(s);
}

interface ScriptData {
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  vocabulary: { en: string; vi: string }[];
  quiz: { question_en: string; options: string[]; answer: number }[];
  missions: CulturalMission[];
  panels: {
    id: number;
    backgroundIndex: number;
    characterNames: string[];
    action: string;
    dialogue: { characterName: string; en: string; vi: string }[];
  }[];
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++)
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ─── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Chi giao vien moi tao duoc bai hoc" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const {
      topic,
      templateKey,
      ethnicGroupId,
      characterIds,
      backgroundIds,
      titleVi,
      level,
      panelBackgroundKeys,
    } = body as {
      topic: string;
      templateKey: string;
      ethnicGroupId?: string;
      characterIds?: string[];
      backgroundIds?: string[];
      titleVi?: string;
      level?: number;
      panelBackgroundKeys?: string[]; // mapping key theo index panel [panel0_key, panel1_key, ...]
    };

    if (!topic || !templateKey) {
      return NextResponse.json(
        { error: "Thieu topic hoac templateKey" },
        { status: 400 },
      );
    }

    const lessonLevel = Math.min(3, Math.max(1, level ?? 2)) as 1 | 2 | 3;
    const levelSpec = LEVEL_SPEC[lessonLevel];
    const tmpl = TEMPLATES[templateKey] || TEMPLATES.INTRO_4;
    const charIds = characterIds ?? [];
    const bgIds = backgroundIds ?? [];

    // Nếu có panelBackgroundKeys, tải thêm backgrounds theo key (cho preset demo)
    const extraBgKeys = panelBackgroundKeys
      ? [...new Set(panelBackgroundKeys)].filter(k => !bgIds.includes(k))
      : [];

    const [dbChars, dbBgs, dbExtraBgs, ethnicGroup] = await Promise.all([
      prisma.comicCharacter.findMany({ where: { id: { in: charIds } } }),
      prisma.comicBackground.findMany({ where: { id: { in: bgIds } } }),
      extraBgKeys.length > 0
        ? prisma.comicBackground.findMany({
            where: { key: { in: extraBgKeys } },
          })
        : Promise.resolve([]),
      ethnicGroupId
        ? prisma.ethnicGroup.findUnique({ where: { id: ethnicGroupId } })
        : null,
    ]);

    // Gộp backgrounds: theo ID + theo key (cho panelBackgroundKeys)
    const allBgsMap = new Map<string, (typeof dbBgs)[0]>();
    [...dbBgs, ...dbExtraBgs].forEach(b => {
      allBgsMap.set(b.id, b);
      allBgsMap.set(b.key, b); // index cả bằng key
    });

    const characters: ComicCharacterDTO[] = dbChars.map(c => ({
      id: c.id,
      name: c.name,
      nameEn: c.nameEn,
      role: c.role as "child" | "adult" | "elder",
      gender: c.gender as "male" | "female",
      ethnicGroupId: c.ethnicGroupId,
      descriptionVi: c.descriptionVi,
      descriptionEn: c.descriptionEn,
      costumePrompt: c.costumePrompt,
      appearancePrompt: c.appearancePrompt,
      referenceImageUrl: c.referenceImageUrl,
      characterImageUrl: c.characterImageUrl,
      thumbnailEmoji: c.thumbnailEmoji,
      isActive: c.isActive,
    }));

    const backgrounds: ComicBackgroundDTO[] = dbBgs.map(b => ({
      id: b.id,
      key: b.key,
      nameVi: b.nameVi,
      nameEn: b.nameEn,
      category: b.category as
        | "village"
        | "forest"
        | "market"
        | "festival"
        | "house"
        | "school",
      prompt: b.prompt,
      referenceImageUrl: b.referenceImageUrl,
      imageUrl: b.imageUrl,
      thumbnailEmoji: b.thumbnailEmoji,
      isActive: b.isActive,
    }));

    const ethnicNameVi = ethnicGroup?.nameVi ?? "K'Ho";
    const ethnicNameEn = ethnicGroup?.nameEn ?? "K'Ho";
    const ethnicEmoji = ethnicGroup?.emoji ?? "🌄";

    // Du lieu van hoa day du tu DB
    const cultureBlock = ethnicGroup
      ? `DU LIEU VAN HOA CHINH XAC — CHI DUOC DUNG THONG TIN NAY, KHONG DUOC BIA THEM:
Dan toc: ${ethnicGroup.nameVi} (${ethnicGroup.nameEn})
Mo ta: ${ethnicGroup.description}
Le hoi: ${(ethnicGroup.festivals as string[]).join(" | ")}
Trang phuc: ${(ethnicGroup.costume as string[]).join(" | ")}
Nhac cu: ${(ethnicGroup.instruments as string[]).join(" | ")}
Nghe thu cong: ${(ethnicGroup.crafts as string[]).join(" | ")}
Am thuc truyen thong: ${(ethnicGroup.cuisine as string[]).join(" | ")}
Dia danh: ${(ethnicGroup.locations as string[]).join(" | ")}
Kien truc: ${ethnicGroup.architecture}`
      : `Dan toc thieu so vung Tay Nguyen Viet Nam.`;

    const charHint = characters.length
      ? characters
          .map(c => `${c.name} (${c.nameEn}): ${c.appearancePrompt}`)
          .join(" | ")
      : "Tu dat ten nhan vat phu hop dan toc";

    // Danh sach ten nhan vat hop le de LLM khong bia them
    const charNames = characters.length
      ? characters.map(c => c.name).join(", ")
      : "nhan vat tu dat";

    const bgHint = backgrounds.length
      ? backgrounds.map((b, i) => `[${i}] ${b.nameVi}`).join(", ")
      : "Tu mo ta boi canh phu hop";

    // ── System prompt — toan bo ASCII khong dau de tranh encoding loi ─────────
    const systemPrompt = `Ban la tac gia truyen tranh giao duc song ngu Anh-Viet cho hoc sinh dan toc thieu so tai Tay Nguyen Viet Nam, cap do ${lessonLevel}: ${levelSpec.label}.

NGON NGU — BAT BUOC TUYET DOI:
- Truong "vi": PHAI la tieng Viet thuan tuy, TUYET DOI KHONG co ky tu chu Han, chu Trung Quoc, chu Nhat
- Dich tieng Viet phai tu nhien, dung cach xung ho: con/me, em/ong, em/ba, ban/ban... tuy quan he nhan vat
- KHONG dich may: "You're welcome" = "Khong co chi" (KHONG PHAI "Khong co van de"), "I'm glad" = "Minh vui" hoac "Bac vui" tuy ngu canh
- Truong "en": tieng Anh dung ngu phap, tu nhien nhu tre em that su noi

CAP DO ${lessonLevel} — QUY TAC LOI THOAI (BAT BUOC TUYET DOI):
- Do dai: ${levelSpec.dialogueWords} — DEM SO TU TUNG CAU, BAN CO VAI LONG KIEM TRA LAI TRUOC KHI VIET
- Tu vung: ${levelSpec.vocabCount}
- Cau truc cau: ${levelSpec.sentenceType}
- Vi du CAU DUNG o cap do nay: "${levelSpec.example}"
- ${levelSpec.forbidden}
- Moi panel: 2-3 luot thoai, cau sau phan hoi va mo rong cau truoc

NHAN VAT — BAT BUOC:
- characterNames CHI duoc dung ten tu danh sach sau, KHONG duoc bia them nhan vat moi: ${charNames}
- Neu nhan vat trong truyen can mot nhan vat phu (vi du: nguoi ban hang), su dung mo ta "nguoi ban" hoac "nguoi lang" thay vi dat ten moi

VOCABULARY — BAT BUOC:
- Chi dua vao vocabulary cac tu/cum tu DA XUAT HIEN trong dialogue cua it nhat mot panel
- KHONG dua ten dan toc (K'Ho, Ma, M'Nong, H'Mong, Tay, Nung...) vao vocabulary
- KHONG dua tu hoc thuat khong xuat hien trong truyen vao vocabulary
- Vi du DUNG: {"en": "loom", "vi": "khung cui"} neu tu "loom" co trong dialogue
- Vi du SAI: {"en": "matrilineal", "vi": "mau he"} neu tu nay khong co trong bat ky dong thoai nao

TINH CHINH XAC VAN HOA — BAT BUOC:
- Ten le hoi, nhac cu, trang phuc, mon an PHAI lay dung tu DU LIEU VAN HOA ben duoi
- KHONG duoc bia: le hoi khong co trong danh sach, hoa van "on trees/rocks", nhac cu khong thuoc dan toc nay
- Dung ten le hoi cu the, khong goi chung "gong ceremony"

LOI THOAI CAM DUNG:
- "Let's go", "Okay", "Me too", "I see", "Yes/No" doc lap — cau duoi 4 tu khong co thong tin
- Cau khong co chu ngu hoac dong tu chinh
- Loi thoai khong lien quan den van hoa hoac chu de bai hoc

Chi tra ve JSON thuan tuy, khong markdown, khong giai thich.`;

    // ── User prompt ────────────────────────────────────────────────────────────
    const userPrompt = `Tao truyen tranh ${tmpl.panelCount} panel ve chu de: "${topic}"

${cultureBlock}

Nhan vat: ${charHint}
DANH SACH TEN NHAN VAT HOP LE (chi duoc dung cac ten nay, khong them nhan vat khac): ${charNames}
Boi canh co san (chon theo index): ${bgHint}

Cau truc tung panel:
${tmpl.guide}

Tra ve JSON:
{
  "titleVi": "Ten truyen tieng Viet hap dan, cu the — phan anh dung noi dung",
  "titleEn": "Specific English title",
  "descriptionVi": "1-2 cau: hoc sinh se doc ve gi va hoc duoc gi",
  "vocabulary": [
    {"en": "tu hoac cum tu DA XUAT HIEN trong dialogue", "vi": "nghia tieng Viet tu nhien, KHONG chu Han"}
  ],
  "quiz": [{"question_en": "Cau hoi kiem tra hieu bai cu the", "options": ["A","B","C","D"], "answer": 0}],
  "missions": [
    {
      "id": "m1", "type": "select",
      "title": "Ten nhiem vu kham pha van hoa",
      "prompt": "Cau hoi ve phong tuc/le hoi/nhac cu cu the trong truyen",
      "options": [
        {"id":"a","label":"Dap an dung tu du lieu van hoa","emoji":"🎵","correct":true},
        {"id":"b","label":"Dap an sai hop ly","emoji":"🌿","correct":false},
        {"id":"c","label":"Dap an sai hop ly","emoji":"🏺","correct":false}
      ],
      "fact": "Thong tin thu vi 2-3 cau giai thich dap an, lay tu du lieu van hoa"
    }
  ],
  "panels": [
    {
      "id": 1, "backgroundIndex": 0,
      "characterNames": ["chi duoc dung ten tu danh sach: ${charNames}"],
      "action": "Mo ta hanh dong, vi tri, cam xuc nhan vat bang tieng Anh de gen anh AI",
      "dialogue": [
        {"characterName": "ten", "en": "Cau tieng Anh dung cap do ${lessonLevel}, co thong tin van hoa cu the", "vi": "Ban dich tieng Viet tu nhien, dung xung ho phu hop, KHONG chu Han"},
        {"characterName": "ten", "en": "Cau phan hoi mo rong chu de", "vi": "Ban dich tieng Viet tu nhien"}
      ]
    }
  ]
}

So luong: vocabulary ${lessonLevel === 1 ? "6-8" : lessonLevel === 2 ? "8-10" : "10-14"} muc (chi lay tu dialogue), quiz dung 4 cau, missions 1-2, panels dung ${tmpl.panelCount}.`;

    let script: ScriptData;
    try {
      const raw = await callLLM(systemPrompt, userPrompt);
      script = parseJson(raw) as ScriptData;
    } catch (err) {
      return NextResponse.json(
        { error: `LLM that bai: ${err}` },
        { status: 500 },
      );
    }

    // Tao lesson DRAFT truoc de co ID
    const lesson = await prisma.lesson.create({
      data: {
        titleVi: titleVi || script.titleVi,
        titleEn: script.titleEn,
        topic,
        descriptionVi: script.descriptionVi || topic,
        emoji: ethnicEmoji,
        level: lessonLevel,
        vocabulary: JSON.parse(JSON.stringify(script.vocabulary ?? [])),
        panels: [],
        quiz: JSON.parse(JSON.stringify(script.quiz ?? [])),
        missions: JSON.parse(JSON.stringify(script.missions ?? [])),
        status: "DRAFT",
        source: "COMIC",
        authorId: session.user.id!,
        characterIds: charIds,
        backgroundIds: bgIds,
        templateKey,
      },
    });

    // Sinh anh tung panel tuan tu
    const SCENE_MAP: Record<string, string> = {
      village: "morning_village",
      forest: "forest_entrance",
      market: "market_morning",
      festival: "drum",
      house: "costume",
      school: "morning_village",
    };

    const panelData: {
      id: number;
      bg: string;
      scene: string;
      generatedImageUrl?: string;
      dialogue: { character: string; vi: string; en: string }[];
      characterIds: string[];
      backgroundId: string;
      action: string;
    }[] = [];

    for (let i = 0; i < script.panels.length; i++) {
      const ps = script.panels[i];

      // Chọn background cho panel này:
      // 1. Nếu có panelBackgroundKeys từ preset → dùng key tương ứng panel index
      // 2. Nếu LLM trả về backgroundIndex hợp lệ → dùng
      // 3. Fallback: rotate theo index panel
      let bg = backgrounds[0]; // fallback default
      if (panelBackgroundKeys && panelBackgroundKeys[i]) {
        const keyBg = allBgsMap.get(panelBackgroundKeys[i]);
        if (keyBg)
          bg = {
            id: keyBg.id,
            key: keyBg.key,
            nameVi: keyBg.nameVi,
            nameEn: keyBg.nameEn,
            category: keyBg.category as
              | "village"
              | "forest"
              | "market"
              | "festival"
              | "house"
              | "school",
            prompt: keyBg.prompt,
            referenceImageUrl: keyBg.referenceImageUrl,
            imageUrl: keyBg.imageUrl,
            thumbnailEmoji: keyBg.thumbnailEmoji,
            isActive: keyBg.isActive,
          };
      } else if (
        ps.backgroundIndex !== undefined &&
        backgrounds[ps.backgroundIndex]
      ) {
        bg = backgrounds[ps.backgroundIndex];
      } else {
        bg = backgrounds[i % Math.max(backgrounds.length, 1)] ?? bg;
      }

      // Nếu không có bg fallback cuối cùng
      if (!bg)
        bg = {
          id: "",
          key: "village",
          nameVi: "Làng",
          nameEn: "Village",
          category: "village" as const,
          prompt: `${ethnicNameEn} highland village`,
          thumbnailEmoji: "🌄",
          isActive: true,
        };

      const panelChars = characters.filter(c =>
        ps.characterNames?.some(n => n === c.name || n === c.nameEn),
      );
      if (panelChars.length === 0 && characters.length > 0)
        panelChars.push(characters[0]);

      const dialogue = (ps.dialogue || []).map(d => ({
        character: d.characterName,
        vi: d.vi,
        en: d.en,
      }));

      const panelSeed = (hashString(lesson.id) + i * 1337) % 99999;

      let generatedImageUrl: string | undefined;
      try {
        const rawUrl = await generateComicPanel({
          background: bg,
          characters: panelChars,
          action:
            ps.action ||
            `${ethnicNameEn} characters in traditional setting, panel ${i + 1}`,
          ethnicCulture: ethnicNameEn,
          panelSeed,
        });
        const fileName = makeFileName(
          `lessons/${lesson.id}/panel-${i + 1}`,
          "jpg",
        );
        generatedImageUrl = await uploadFromUrl({
          sourceUrl: rawUrl,
          fileName,
        }).catch(() => rawUrl);
      } catch (imgErr) {
        console.error(`[generate] Panel ${i + 1} image failed:`, imgErr);
      }

      const cat = typeof bg.category === "string" ? bg.category : "village";
      const sceneKey = bg.key || SCENE_MAP[cat] || "morning_village";

      panelData.push({
        id: ps.id || i + 1,
        bg: "#FFF3E0",
        scene: sceneKey,
        generatedImageUrl,
        dialogue,
        characterIds: panelChars.map(c => c.id),
        backgroundId: bg.id,
        action: ps.action,
      });
    }

    const updated = await prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        titleVi: titleVi || script.titleVi,
        titleEn: script.titleEn,
        panels: JSON.parse(JSON.stringify(panelData)),
        status: "PUBLISHED",
      },
    });

    await prisma.aIGenerationLog
      .create({
        data: {
          userId: session.user.id!,
          lessonId: lesson.id,
          input: {
            topic,
            templateKey,
            level: lessonLevel,
            characterIds: charIds,
            backgroundIds: bgIds,
          },
          status: "success",
        },
      })
      .catch(() => {});

    return NextResponse.json({ lesson: updated });
  } catch (err) {
    console.error("[generate lesson]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Loi server" },
      { status: 500 },
    );
  }
}
