import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CULTURAL_GROUPS } from "../data/culture";
import { DEFAULT_BADGES } from "../data/badges";
import { STORIES } from "../data/stories";
import { Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding ethnic groups...");
  for (const g of CULTURAL_GROUPS) {
    await prisma.ethnicGroup.upsert({
      where: { slug: g.slug },
      create: {
        slug: g.slug,
        nameVi: g.nameVi,
        nameEn: g.nameEn,
        emoji: g.emoji,
        description: g.description,
        costume: g.costume,
        festivals: g.festivals,
        instruments: g.instruments,
        crafts: g.crafts,
        cuisine: g.cuisine,
        locations: g.locations,
        architecture: g.architecture,
      },
      update: {},
    });
  }

  console.log("Seeding badges...");
  for (const b of DEFAULT_BADGES) {
    await prisma.badge.upsert({
      where: { code: b.code },
      create: b,
      update: {},
    });
  }

  console.log("Seeding default accounts...");
  const password = await bcrypt.hash("Highland@2026", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@highlandenglish.vn" },
    create: {
      name: "Ban Tổ Chức",
      email: "superadmin@highlandenglish.vn",
      password,
      role: "SUPER_ADMIN",
      avatar: "🛡️",
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { email: "admin@highlandenglish.vn" },
    create: {
      name: "Quản trị viên",
      email: "admin@highlandenglish.vn",
      password,
      role: "ADMIN",
      avatar: "🛡️",
    },
    update: {},
  });

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@highlandenglish.vn" },
    create: {
      name: "Cô Hương",
      email: "teacher@highlandenglish.vn",
      password,
      role: "TEACHER",
      avatar: "🧑‍🏫",
    },
    update: {},
  });

  const student = await prisma.user.upsert({
    where: { email: "student@highlandenglish.vn" },
    create: {
      name: "Ya Đin",
      email: "student@highlandenglish.vn",
      password,
      role: "STUDENT",
      ethnicGroup: "K'Ho",
      ageGroup: 10,
      avatar: "🧒",
    },
    update: {},
  });

  console.log("Seeding sample class...");
  const cls = await prisma.class.upsert({
    where: { joinCode: "DEMO01" },
    create: {
      name: "Lớp 5A - Trường Tiểu học Lạc Dương",
      teacherId: teacher.id,
      joinCode: "DEMO01",
    },
    update: {},
  });
  await prisma.classMember.upsert({
    where: { classId_studentId: { classId: cls.id, studentId: student.id } },
    create: { classId: cls.id, studentId: student.id },
    update: {},
  });

  console.log("Seeding sample lessons from STORIES...");
  const ethnicMap: Record<string, string> = {
    "K'Ho": "kho",
    Mạ: "ma",
    "M'Nông": "mnong",
    "H'Mông": "hmong",
    Tày: "tay",
    Nùng: "nung",
  };

  for (const story of STORIES) {
    const slug = ethnicMap[story.ethnic_culture];
    const ethnicGroup = slug
      ? await prisma.ethnicGroup.findUnique({ where: { slug } })
      : null;

    const exists = await prisma.lesson.findFirst({
      where: { titleEn: story.title.en, source: "SAMPLE" },
    });
    if (exists) continue;

    await prisma.lesson.create({
      data: {
        titleVi: story.title.vi,
        titleEn: story.title.en,
        topic: story.title.en,
        level: story.level,
        ageGroup: 10,
        color: story.color,
        emoji: story.emoji,
        descriptionVi: story.description_vi,
        vocabulary: JSON.parse(JSON.stringify(story.vocabulary)),
        panels: JSON.parse(JSON.stringify(story.panels)),
        quiz: JSON.parse(JSON.stringify(story.quiz)),
        missions: JSON.parse(
          JSON.stringify(
            ethnicGroup
              ? [
                  {
                    id: `mission-${story.id}-1`,
                    type: "select",
                    title: `Khám phá văn hóa ${story.ethnic_culture}`,
                    prompt: `Lễ hội nào dưới đây thuộc về người ${story.ethnic_culture}?`,
                    options: [
                      {
                        id: "a",
                        label:
                          (ethnicGroup.festivals as string[])[0] || "Lễ hội",
                        emoji: "🎉",
                        correct: true,
                      },
                      {
                        id: "b",
                        label: "Lễ hội Trung thu",
                        emoji: "🥮",
                        correct: false,
                      },
                      {
                        id: "c",
                        label: "Lễ hội Halloween",
                        emoji: "🎃",
                        correct: false,
                      },
                    ],
                    fact: ethnicGroup.description,
                  },
                ]
              : [],
          ),
        ),
        status: "PUBLISHED",
        source: "SAMPLE",
        authorId: teacher.id,
        ethnicGroupId: ethnicGroup?.id,
      },
    });
  }

  console.log("Seeding comic characters...");
  const khoGroup = await prisma.ethnicGroup.findUnique({
    where: { slug: "kho" },
  });
  const hmongGroup = await prisma.ethnicGroup.findUnique({
    where: { slug: "hmong" },
  });
  const maGroup = await prisma.ethnicGroup.findUnique({
    where: { slug: "ma" },
  });

  const charData = [
    {
      name: "Ya Đin",
      nameEn: "Ya Din",
      role: "child",
      gender: "female",
      ethnicGroupId: khoGroup?.id ?? null,
      descriptionVi: "Bé gái K'Ho 10 tuổi, vui vẻ, tò mò, yêu văn hóa dân tộc",
      descriptionEn:
        "10-year-old K'Ho girl, cheerful, curious, loves her culture",
      costumePrompt:
        "wearing K'Ho traditional red blouse with gold geometric patterns, silver bead necklace, dark blue skirt",
      appearancePrompt:
        "10-year-old girl, round face, dark brown eyes, black hair in two braids, warm skin tone",
      thumbnailEmoji: "🧒",
      createdById: teacher.id,
    },
    {
      name: "K'Lang",
      nameEn: "K'Lang",
      role: "child",
      gender: "male",
      ethnicGroupId: khoGroup?.id ?? null,
      descriptionVi: "Bé trai K'Ho 11 tuổi, nghịch ngợm và dũng cảm",
      descriptionEn: "11-year-old K'Ho boy, playful and brave",
      costumePrompt:
        "wearing K'Ho traditional short sleeve shirt with red and black stripes, dark trousers",
      appearancePrompt:
        "11-year-old boy, short black hair, bright smile, athletic build, warm skin tone",
      thumbnailEmoji: "👦",
      createdById: teacher.id,
    },
    {
      name: "Mỷ",
      nameEn: "My",
      role: "child",
      gender: "female",
      ethnicGroupId: hmongGroup?.id ?? null,
      descriptionVi: "Bé gái H'Mông 9 tuổi sống ở chợ phiên vùng cao",
      descriptionEn: "9-year-old H'Mong girl living near the highland market",
      costumePrompt:
        "wearing H'Mong traditional colorful pleated skirt with embroidered patterns in blue yellow red, silver coin necklace, white long sleeve blouse",
      appearancePrompt:
        "9-year-old girl, round rosy cheeks, bright eyes, black hair, small frame, curious expression",
      thumbnailEmoji: "👧",
      createdById: teacher.id,
    },
    {
      name: "Ami",
      nameEn: "Ami",
      role: "child",
      gender: "female",
      ethnicGroupId: maGroup?.id ?? null,
      descriptionVi: "Bé gái Mạ 10 tuổi, thích chạy nhảy trong rừng",
      descriptionEn: "10-year-old Ma girl who loves running in the forest",
      costumePrompt:
        "wearing Ma traditional dark blue indigo top with simple embroidery, dark wrap skirt, rattan bracelet",
      appearancePrompt:
        "10-year-old girl, slightly curly black hair, wide bright eyes, athletic and energetic posture",
      thumbnailEmoji: "🌿",
      createdById: teacher.id,
    },
  ];

  for (const c of charData) {
    const existing = await prisma.comicCharacter.findFirst({
      where: { name: c.name },
    });
    if (!existing) {
      await prisma.comicCharacter.create({ data: c });
    }
  }

  console.log("Seeding comic backgrounds...");
  const bgData = [
    {
      key: "morning_village",
      nameVi: "Làng buổi sáng",
      nameEn: "Morning village",
      category: "village",
      thumbnailEmoji: "🌅",
      prompt:
        "K'Ho highland village at sunrise, traditional wooden stilt houses with thatched roofs, green mountains in background, morning mist, golden warm light, lush tropical vegetation, peaceful rural scene, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "festival_ground",
      nameVi: "Sân lễ hội",
      nameEn: "Festival ground",
      category: "festival",
      thumbnailEmoji: "🎉",
      prompt:
        "K'Ho gong festival celebration ground, colorful triangle banners hanging between bamboo poles, central bonfire, circle of villagers in traditional costumes, night sky with stars, warm orange firelight, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "market_morning",
      nameVi: "Chợ phiên buổi sáng",
      nameEn: "Highland morning market",
      category: "market",
      thumbnailEmoji: "🛒",
      prompt:
        "vibrant highland ethnic market at morning, colorful fabric stalls with red and green awnings, vegetable and handicraft displays, mountain ethnic minority people in traditional costumes, mountains visible in background, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "forest_entrance",
      nameVi: "Cửa rừng",
      nameEn: "Forest entrance",
      category: "forest",
      thumbnailEmoji: "🌲",
      prompt:
        "entrance to tropical highland forest, tall ancient trees with hanging vines, dappled sunlight through canopy, colorful tropical birds, lush green ferns and undergrowth, children book illustration style, vibrant colors",
      createdById: teacher.id,
    },
    {
      key: "big_tree",
      nameVi: "Cây đại thụ",
      nameEn: "Ancient big tree",
      category: "forest",
      thumbnailEmoji: "🌳",
      prompt:
        "enormous ancient tree in highland forest, massive trunk with gnarled roots, children playing near the base, shafts of golden light through dense canopy, magical forest atmosphere, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "cloth_stall",
      nameVi: "Gian hàng vải",
      nameEn: "Fabric stall",
      category: "market",
      thumbnailEmoji: "🧵",
      prompt:
        "colorful fabric stall at highland market, bolts of traditional ethnic patterned cloth in red blue and gold, friendly vendor in traditional costume, children admiring the colorful fabrics, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "vegetable_stall",
      nameVi: "Gian hàng rau củ",
      nameEn: "Vegetable stall",
      category: "market",
      thumbnailEmoji: "🥬",
      prompt:
        "fresh vegetable stall at highland market, colorful arrangement of mountain vegetables and herbs, bamboo baskets full of produce, friendly market scene, morning sunlight, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "harvest",
      nameVi: "Mùa gặt lúa",
      nameEn: "Rice harvest",
      category: "village",
      thumbnailEmoji: "🌾",
      prompt:
        "golden rice terrace harvest season in highland, rows of golden rice stalks ready for harvest, farmers in traditional costumes working together, beautiful mountain landscape background, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "costume",
      nameVi: "Mặc trang phục truyền thống",
      nameEn: "Traditional costume",
      category: "house",
      thumbnailEmoji: "👘",
      prompt:
        "inside traditional K'Ho wooden house, family preparing traditional costumes for festival, colorful ethnic garments hanging and being dressed, warm interior light, carved wooden details, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "drum",
      nameVi: "Tiếng trống lễ hội",
      nameEn: "Festival drums",
      category: "festival",
      thumbnailEmoji: "🥁",
      prompt:
        "K'Ho gong and drum ceremony, musicians playing traditional gongs and drums around bonfire, night festival scene with dancing flames, villagers in traditional red costumes, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "dance",
      nameVi: "Múa truyền thống",
      nameEn: "Traditional dance",
      category: "festival",
      thumbnailEmoji: "💃",
      prompt:
        "highland traditional dance performance, circle of dancers in colorful ethnic costumes, graceful movements with arms raised, festival ground with lanterns and bonfire in background, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "birds",
      nameVi: "Chim rừng",
      nameEn: "Forest birds",
      category: "forest",
      thumbnailEmoji: "🦜",
      prompt:
        "colorful tropical birds in highland forest canopy, hornbills and kingfishers perched on branches, children looking up in wonder, lush green jungle background, gentle morning light, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "butterfly",
      nameVi: "Bướm trong rừng",
      nameEn: "Butterflies in forest",
      category: "forest",
      thumbnailEmoji: "🦋",
      prompt:
        "magical highland forest clearing full of colorful butterflies, children chasing butterflies through wildflowers, golden afternoon light filtering through trees, enchanting fairy-tale atmosphere, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "bargain",
      nameVi: "Mặc cả ở chợ",
      nameEn: "Bargaining at market",
      category: "market",
      thumbnailEmoji: "🤝",
      prompt:
        "friendly bargaining scene at highland market, ethnic minority vendor and young customer discussing price with smiles, colorful market goods displayed, lively market atmosphere, children book illustration style",
      createdById: teacher.id,
    },
  ];

  for (const b of bgData) {
    const existing = await prisma.comicBackground.findUnique({
      where: { key: b.key },
    });
    if (!existing) {
      await prisma.comicBackground.create({
        data: b,
      });
    }
  }

  console.log("Done. Super admin:", superAdmin.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
