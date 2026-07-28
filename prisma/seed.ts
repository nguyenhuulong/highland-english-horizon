import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CULTURAL_GROUPS } from "../data/culture";
import { DEFAULT_BADGES } from "../data/badges";
import { STORIES } from "../data/stories";

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

  await prisma.user.upsert({
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
  const mnongGroup = await prisma.ethnicGroup.findUnique({
    where: { slug: "mnong" },
  });
  const tayGroup = await prisma.ethnicGroup.findUnique({
    where: { slug: "tay" },
  });
  const nungGroup = await prisma.ethnicGroup.findUnique({
    where: { slug: "nung" },
  });

  // descriptionVi/En và thumbnailEmoji được tự điền từ appearancePrompt (theo logic đã đơn giản hoá ở CharacterManager)
  const charData = [
    // ── Trẻ em ────────────────────────────────────────────────────────────
    {
      name: "H'Linh",
      nameEn: "H'Linh",
      role: "child",
      gender: "female",
      ethnicGroupId: hmongGroup?.id ?? null,
      appearancePrompt:
        "9-year-old H'Mong girl, round face, warm brown skin, bright dark eyes, straight black hair in two braids, cheerful smile",
      costumePrompt: "H'Mong traditional costume",
      descriptionVi:
        "Bé gái H'Mông 9 tuổi, hoạt bát, thích thêu thổ cẩm và đi chợ phiên.",
      descriptionEn:
        "9-year-old H'Mong girl, lively, loves embroidery and the highland market.",
      thumbnailEmoji: "🧒",
      createdById: teacher.id,
    },
    {
      name: "N'Thao",
      nameEn: "N'Thao",
      role: "child",
      gender: "male",
      ethnicGroupId: mnongGroup?.id ?? null,
      appearancePrompt:
        "10-year-old M'Nong boy, oval face, warm brown skin, bright dark eyes, short black hair, cheerful smile",
      costumePrompt: "M'Nong traditional costume",
      descriptionVi:
        "Bé trai M'Nông 10 tuổi, năng động, thích theo cha ra rẫy.",
      descriptionEn:
        "10-year-old M'Nong boy, energetic, enjoys helping on the farm.",
      thumbnailEmoji: "🧒",
      createdById: teacher.id,
    },
    {
      name: "Ya Đin",
      nameEn: "Ya Din",
      role: "child",
      gender: "female",
      ethnicGroupId: khoGroup?.id ?? null,
      appearancePrompt:
        "10-year-old K'Ho girl, oval face, warm brown skin, bright dark eyes, long black hair in two braids, friendly smile",
      costumePrompt: "K'Ho traditional costume",
      descriptionVi:
        "Bé gái K'Ho 10 tuổi, ham học hỏi, yêu thích nghe bà kể chuyện.",
      descriptionEn:
        "10-year-old K'Ho girl, curious and cheerful, loves listening to traditional stories.",
      thumbnailEmoji: "🧒",
      createdById: teacher.id,
    },
    {
      name: "Pơ Mai",
      nameEn: "Po Mai",
      role: "child",
      gender: "female",
      ethnicGroupId: maGroup?.id ?? null,
      appearancePrompt:
        "9-year-old Ma girl, heart-shaped face, warm brown skin, lively dark eyes, slightly wavy black hair tied back, joyful expression",
      costumePrompt: "Ma traditional costume",
      descriptionVi:
        "Bé gái Mạ 9 tuổi, hoạt bát, thích khám phá rừng cùng gia đình.",
      descriptionEn:
        "9-year-old Ma girl, lively, enjoys exploring the forest with her family.",
      thumbnailEmoji: "🧒",
      createdById: teacher.id,
    },
    {
      name: "Lường Khánh",
      nameEn: "Luong Khanh",
      role: "child",
      gender: "female",
      ethnicGroupId: tayGroup?.id ?? null,
      appearancePrompt:
        "10-year-old Tay girl, oval face, warm light-brown skin, calm dark eyes, straight black hair, gentle smile",
      costumePrompt: "Tay traditional costume",
      descriptionVi: "Bé gái Tày 10 tuổi, chăm chỉ, thích dọn nhà sàn cùng bà.",
      descriptionEn:
        "10-year-old Tay girl, diligent, enjoys helping grandmother around the stilt house.",
      thumbnailEmoji: "🧒",
      createdById: teacher.id,
    },
    {
      name: "A Linh",
      nameEn: "A Linh",
      role: "child",
      gender: "male",
      ethnicGroupId: nungGroup?.id ?? null,
      appearancePrompt:
        "11-year-old Nung boy, round face, warm light-brown skin, bright dark eyes, short black hair, confident smile",
      costumePrompt: "Nung traditional costume",
      descriptionVi:
        "Bé trai Nùng 11 tuổi, thông minh, thích nghe hát Then và học đàn tính.",
      descriptionEn:
        "11-year-old Nung boy, smart, enjoys Then music and wants to learn the tinh lute.",
      thumbnailEmoji: "🧒",
      createdById: teacher.id,
    },

    // ── Người lớn ─────────────────────────────────────────────────────────
    {
      name: "H'Brih",
      nameEn: "H'Brih",
      role: "adult",
      gender: "female",
      ethnicGroupId: khoGroup?.id ?? null,
      appearancePrompt:
        "28-year-old K'Ho woman, oval face, warm brown skin, kind dark eyes, long black hair in a low bun, graceful posture",
      costumePrompt: "K'Ho traditional costume",
      descriptionVi:
        "Nghệ nhân dệt thổ cẩm K'Ho 28 tuổi, hiền hậu, thích hướng dẫn trẻ em.",
      descriptionEn:
        "28-year-old K'Ho woman, skilled weaver, kind and patient.",
      thumbnailEmoji: "🧒",
      createdById: teacher.id,
    },
    {
      name: "Y Blô",
      nameEn: "Y Blo",
      role: "adult",
      gender: "male",
      ethnicGroupId: hmongGroup?.id ?? null,
      appearancePrompt:
        "31-year-old H'Mong man, square face, sun-tanned skin, dark eyes, short black hair, lean muscular build, confident expression",
      costumePrompt: "H'Mong traditional costume",
      descriptionVi:
        "Người đàn ông H'Mông 31 tuổi, giỏi chế tác khèn, gắn bó với văn hóa bản làng.",
      descriptionEn:
        "31-year-old H'Mong man, skilled khene craftsman and community cultural keeper.",
      thumbnailEmoji: "🧒",
      createdById: teacher.id,
    },
    {
      name: "Y Điớp",
      nameEn: "Y Diep",
      role: "adult",
      gender: "female",
      ethnicGroupId: mnongGroup?.id ?? null,
      appearancePrompt:
        "27-year-old M'Nong woman, oval face, warm brown skin, bright dark eyes, long black hair tied back, friendly smile",
      costumePrompt: "M'Nong traditional costume",
      descriptionVi:
        "Người phụ nữ M'Nông 27 tuổi, trồng cà phê, khéo đan gùi mây tre.",
      descriptionEn:
        "27-year-old M'Nong woman, coffee farmer and skilled basket weaver.",
      thumbnailEmoji: "🧒",
      createdById: teacher.id,
    },
    {
      name: "Kpă Điêu",
      nameEn: "Kpa Dieu",
      role: "adult",
      gender: "male",
      ethnicGroupId: tayGroup?.id ?? null,
      appearancePrompt:
        "33-year-old Tay man, oval face, warm light-brown skin, bright dark eyes, short black hair, confident smile",
      costumePrompt: "Tay traditional costume",
      descriptionVi:
        "Giáo viên Tày 33 tuổi, yêu văn hóa dân tộc, bảo tồn điệu hát và lễ hội Lồng Tồng.",
      descriptionEn:
        "33-year-old Tay teacher, passionate about ethnic culture and preserving the Lồng Tồng festival.",
      thumbnailEmoji: "🧒",
      createdById: teacher.id,
    },

    // ── Người cao tuổi ────────────────────────────────────────────────────
    {
      name: "Ama K'Bram",
      nameEn: "Ama K'Bram",
      role: "elder",
      gender: "male",
      ethnicGroupId: maGroup?.id ?? null,
      appearancePrompt:
        "68-year-old Ma village elder, weathered face, warm brown skin, kind dark eyes, gray-black hair, thin gray beard, upright posture",
      costumePrompt: "Ma traditional costume",
      descriptionVi:
        "Già làng Mạ 68 tuổi, am hiểu phong tục, thích kể chuyện truyền thống.",
      descriptionEn:
        "68-year-old Ma village elder, storyteller and culture keeper.",
      thumbnailEmoji: "🧒",
      createdById: teacher.id,
    },
    {
      name: "Đinh Thị Hoa",
      nameEn: "Dinh Thi Hoa",
      role: "elder",
      gender: "female",
      ethnicGroupId: nungGroup?.id ?? null,
      appearancePrompt:
        "65-year-old Nung elder woman, gentle oval face with wrinkles, warm skin, kind dark eyes, gray-black hair in a bun, upright posture",
      costumePrompt: "Nung traditional costume",
      descriptionVi:
        "Nghệ nhân hát Then Nùng 65 tuổi, nắm giữ nhiều bài Then cổ, được cả làng kính trọng.",
      descriptionEn:
        "65-year-old Nung Then singer, keeper of ancient Then songs, respected by the whole community.",
      thumbnailEmoji: "🧒",
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
        "K'Ho highland village at sunrise, traditional wooden stilt houses with thatched roofs, green mountains in background, morning mist, golden warm light, peaceful rural scene, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "festival_ground",
      nameVi: "Sân lễ hội",
      nameEn: "Festival ground",
      category: "festival",
      thumbnailEmoji: "🎉",
      prompt:
        "K'Ho gong festival celebration ground, colorful triangle banners, central bonfire, circle of villagers in traditional costumes, night sky with stars, warm orange firelight, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "market_morning",
      nameVi: "Chợ phiên buổi sáng",
      nameEn: "Highland morning market",
      category: "market",
      thumbnailEmoji: "🛒",
      prompt:
        "vibrant highland ethnic market at morning, colorful fabric stalls, vegetable and handicraft displays, ethnic minority people in traditional costumes, mountains in background, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "forest_entrance",
      nameVi: "Cửa rừng",
      nameEn: "Forest entrance",
      category: "forest",
      thumbnailEmoji: "🌲",
      prompt:
        "entrance to tropical highland forest, tall ancient trees with hanging vines, dappled sunlight through canopy, colorful tropical birds, lush green ferns, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "big_tree",
      nameVi: "Cây đại thụ",
      nameEn: "Ancient big tree",
      category: "forest",
      thumbnailEmoji: "🌳",
      prompt:
        "enormous ancient tree in highland forest, massive trunk with gnarled roots, shafts of golden light through dense canopy, magical forest atmosphere, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "cloth_stall",
      nameVi: "Gian hàng vải",
      nameEn: "Fabric stall",
      category: "market",
      thumbnailEmoji: "🧵",
      prompt:
        "colorful fabric stall at highland market, bolts of traditional ethnic patterned cloth in red blue and gold, friendly vendor in traditional costume, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "vegetable_stall",
      nameVi: "Gian hàng rau củ",
      nameEn: "Vegetable stall",
      category: "market",
      thumbnailEmoji: "🥬",
      prompt:
        "fresh vegetable stall at highland market, colorful mountain vegetables and herbs, bamboo baskets full of produce, morning sunlight, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "harvest",
      nameVi: "Mùa gặt lúa",
      nameEn: "Rice harvest",
      category: "village",
      thumbnailEmoji: "🌾",
      prompt:
        "golden rice terrace harvest season in highland, rows of golden rice stalks ready for harvest, farmers in traditional costumes, beautiful mountain landscape background, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "costume",
      nameVi: "Mặc trang phục truyền thống",
      nameEn: "Traditional costume",
      category: "house",
      thumbnailEmoji: "👘",
      prompt:
        "inside traditional K'Ho wooden house, family preparing traditional costumes for festival, colorful ethnic garments, warm interior light, carved wooden details, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "drum",
      nameVi: "Tiếng trống lễ hội",
      nameEn: "Festival drums",
      category: "festival",
      thumbnailEmoji: "🥁",
      prompt:
        "K'Ho gong and drum ceremony, musicians playing traditional gongs around bonfire, night festival scene with dancing flames, villagers in traditional red costumes, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "dance",
      nameVi: "Múa truyền thống",
      nameEn: "Traditional dance",
      category: "festival",
      thumbnailEmoji: "💃",
      prompt:
        "highland traditional dance performance, circle of dancers in colorful ethnic costumes, graceful movements, festival ground with lanterns and bonfire, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "birds",
      nameVi: "Chim rừng",
      nameEn: "Forest birds",
      category: "forest",
      thumbnailEmoji: "🦜",
      prompt:
        "colorful tropical birds in highland forest canopy, hornbills and kingfishers on branches, children looking up in wonder, lush green jungle background, gentle morning light, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "butterfly",
      nameVi: "Bướm trong rừng",
      nameEn: "Butterflies in forest",
      category: "forest",
      thumbnailEmoji: "🦋",
      prompt:
        "magical highland forest clearing full of colorful butterflies, children chasing butterflies through wildflowers, golden afternoon light filtering through trees, children book illustration style",
      createdById: teacher.id,
    },
    {
      key: "bargain",
      nameVi: "Mặc cả ở chợ",
      nameEn: "Bargaining at market",
      category: "market",
      thumbnailEmoji: "🤝",
      prompt:
        "friendly bargaining scene at highland market, ethnic minority vendor and young customer discussing price with smiles, colorful market goods, lively market atmosphere, children book illustration style",
      createdById: teacher.id,
    },
  ];

  for (const b of bgData) {
    const existing = await prisma.comicBackground.findUnique({
      where: { key: b.key },
    });
    if (!existing) {
      await prisma.comicBackground.create({ data: b });
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
