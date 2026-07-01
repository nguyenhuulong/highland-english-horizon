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
      role: "ADMIN",
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
  const mnongGroup = await prisma.ethnicGroup.findUnique({
    where: { slug: "mnong" },
  });
  const tayGroup = await prisma.ethnicGroup.findUnique({
    where: { slug: "tay" },
  });
  const nungGroup = await prisma.ethnicGroup.findUnique({
    where: { slug: "nung" },
  });

const charData = [
  // =========================
  // H'MÔNG
  // =========================
  {
    name: "Sùng Mỷ",
    nameEn: "Sung My",
    role: "child",
    gender: "female",
    ethnicGroupId: hmongGroup?.id ?? null,
    descriptionVi:
      "Bé gái H'Mông 9 tuổi, hiền lành, thích thêu váy và theo mẹ đến chợ phiên.",
    descriptionEn:
      "9-year-old H'Mong girl, gentle and curious, enjoys embroidery and visiting the mountain market with her mother.",
    costumePrompt:
      "wearing H'Mong traditional pleated indigo skirt with colorful embroidered geometric patterns, white long-sleeve blouse, embroidered apron, silver coin necklace, colorful headscarf",
    appearancePrompt:
      "9-year-old girl, round face, rosy cheeks, warm light-brown skin, bright dark eyes, straight black hair tied into two short braids, petite build, gentle smile",
    thumbnailEmoji: "🪡",
    createdById: teacher.id,
  },

  // =========================
  // M'NÔNG
  // =========================
  {
    name: "N'Thao",
    nameEn: "N'Thao",
    role: "child",
    gender: "male",
    ethnicGroupId: mnongGroup?.id ?? null,
    descriptionVi:
      "Bé trai M'Nông 10 tuổi, năng động, thích theo cha ra rẫy và chăm sóc voi.",
    descriptionEn:
      "10-year-old M'Nong boy, energetic and adventurous, enjoys helping his father on the farm and learning about elephants.",
    costumePrompt:
      "wearing M'Nong traditional black woven sleeveless shirt with red and white woven stripes, black shorts, woven belt, simple woven shoulder cloth",
    appearancePrompt:
      "10-year-old boy, oval face, warm brown skin, bright dark eyes, short black hair, slim athletic build, cheerful smile",
    thumbnailEmoji: "🐘",
    createdById: teacher.id,
  },

  // =========================
  // K'HO
  // =========================
  {
    name: "Ya Đin",
    nameEn: "Ya Din",
    role: "child",
    gender: "female",
    ethnicGroupId: khoGroup?.id ?? null,
    descriptionVi:
      "Bé gái K'Ho 10 tuổi, ham học hỏi, yêu thích nghe bà kể chuyện và tìm hiểu văn hóa dân tộc.",
    descriptionEn:
      "10-year-old K'Ho girl, curious and cheerful, enjoys listening to traditional stories and learning about her culture.",
    costumePrompt:
      "wearing K'Ho traditional red woven blouse with black and yellow geometric patterns, dark indigo skirt, silver bead necklace, woven sash",
    appearancePrompt:
      "10-year-old girl, oval face, warm brown skin, bright dark brown eyes, long black hair in two braids, friendly smile, average build",
    thumbnailEmoji: "🌸",
    createdById: teacher.id,
  },

  // =========================
  // MẠ
  // =========================
  {
    name: "Pơ Mai",
    nameEn: "Po Mai",
    role: "child",
    gender: "female",
    ethnicGroupId: maGroup?.id ?? null,
    descriptionVi:
      "Bé gái Mạ 9 tuổi, hoạt bát, thích khám phá rừng và hái các loại quả cùng gia đình.",
    descriptionEn:
      "9-year-old Ma girl, lively and adventurous, enjoys exploring the forest and gathering wild fruits with her family.",
    costumePrompt:
      "wearing Ma traditional indigo woven blouse with simple red embroidery, dark wrap skirt, rattan bracelet, beaded necklace",
    appearancePrompt:
      "9-year-old girl, heart-shaped face, warm brown skin, lively dark eyes, slightly wavy black hair tied back, slim build, joyful expression",
    thumbnailEmoji: "🌿",
    createdById: teacher.id,
  },

  // =========================
  // NÙNG
  // =========================
  {
    name: "Lường Khánh",
    nameEn: "Luong Khanh",
    role: "child",
    gender: "female",
    ethnicGroupId: nungGroup?.id ?? null,
    descriptionVi:
      "Bé gái Nùng 10 tuổi, chăm chỉ, thích học hát dân ca và giúp mẹ dệt vải.",
    descriptionEn:
      "10-year-old Nung girl, diligent and kind, enjoys learning folk songs and helping her mother weave fabric.",
    costumePrompt:
      "wearing Nung traditional indigo tunic with subtle embroidered cuffs, black trousers, silver necklace, dark indigo headscarf",
    appearancePrompt:
      "10-year-old girl, oval face, fair warm skin, calm dark eyes, straight black hair tucked under headscarf, gentle smile, slender build",
    thumbnailEmoji: "🧵",
    createdById: teacher.id,
  },

  // =========================
  // TÀY
  // =========================
  {
    name: "Lâm Bảo",
    nameEn: "Lam Bao",
    role: "child",
    gender: "male",
    ethnicGroupId: tayGroup?.id ?? null,
    descriptionVi:
      "Bé trai Tày 11 tuổi, thông minh, thích câu cá, bơi suối và nghe ông kể chuyện làng.",
    descriptionEn:
      "11-year-old Tay boy, friendly and curious, enjoys fishing, swimming in streams and listening to village stories.",
    costumePrompt:
      "wearing Tay traditional indigo shirt with standing collar, black trousers, woven cloth belt, dark indigo headscarf",
    appearancePrompt:
      "11-year-old boy, round face, warm light-brown skin, bright dark eyes, short black hair, lean build, confident smile",
    thumbnailEmoji: "🐟",
    createdById: teacher.id,
  },
  // =========================
  // K'HO - ADULT
  // =========================
  {
    name: "H'Brih",
    nameEn: "H'Brih",
    role: "adult",
    gender: "female",
    ethnicGroupId: khoGroup?.id ?? null,
    descriptionVi:
      "Người phụ nữ K'Ho 28 tuổi, nghệ nhân dệt thổ cẩm, hiền hậu và luôn sẵn sàng hướng dẫn trẻ em học nghề truyền thống.",
    descriptionEn:
      "28-year-old K'Ho woman, skilled brocade weaver, kind and patient, enjoys teaching children traditional weaving.",
    costumePrompt:
      "wearing K'Ho traditional red woven blouse with black and yellow geometric patterns, dark indigo skirt, silver bead necklace, woven sash",
    appearancePrompt:
      "28-year-old woman, oval face, warm brown skin, kind dark brown eyes, long black hair tied into a low bun, graceful posture, gentle smile",
    thumbnailEmoji: "🧶",
    createdById: teacher.id,
  },

  // =========================
  // H'MÔNG - ADULT
  // =========================
  {
    name: "A Chư",
    nameEn: "A Chu",
    role: "adult",
    gender: "male",
    ethnicGroupId: hmongGroup?.id ?? null,
    descriptionVi:
      "Người đàn ông H'Mông 31 tuổi, chăm chỉ làm nương, giỏi chế tác khèn và luôn giúp đỡ bà con trong bản.",
    descriptionEn:
      "31-year-old H'Mong man, hardworking farmer and khene craftsman, respected for helping people in his village.",
    costumePrompt:
      "wearing H'Mong traditional indigo jacket with colorful embroidered trim, black trousers, embroidered sash, black headscarf",
    appearancePrompt:
      "31-year-old man, square face, sun-tanned skin, dark eyes, short black hair, lean muscular build, calm and confident expression",
    thumbnailEmoji: "🎋",
    createdById: teacher.id,
  },

  // =========================
  // M'NÔNG - ADULT
  // =========================
  {
    name: "Y Điớp",
    nameEn: "Y Diep",
    role: "adult",
    gender: "female",
    ethnicGroupId: mnongGroup?.id ?? null,
    descriptionVi:
      "Người phụ nữ M'Nông 27 tuổi, chăm sóc rẫy cà phê của gia đình và nổi tiếng khéo dệt gùi mây tre.",
    descriptionEn:
      "27-year-old M'Nong woman, coffee farmer and skilled basket weaver, energetic and caring.",
    costumePrompt:
      "wearing M'Nong traditional black woven dress with red and white woven stripes, beaded necklace, woven belt",
    appearancePrompt:
      "27-year-old woman, oval face, warm brown skin, bright dark eyes, long black hair tied back, healthy build, warm friendly smile",
    thumbnailEmoji: "☕",
    createdById: teacher.id,
  },

  // =========================
  // TÀY - ADULT
  // =========================
  {
    name: "Nông Văn Hiếu",
    nameEn: "Nong Van Hieu",
    role: "adult",
    gender: "male",
    ethnicGroupId: tayGroup?.id ?? null,
    descriptionVi:
      "Người đàn ông Tày 33 tuổi, giáo viên địa phương, yêu văn hóa dân tộc và thường hướng dẫn trẻ em học tiếng Anh.",
    descriptionEn:
      "33-year-old Tay man, local teacher who enjoys preserving traditional culture while teaching English to children.",
    costumePrompt:
      "wearing Tay traditional indigo long tunic with standing collar, black trousers, woven cloth belt, dark indigo headscarf",
    appearancePrompt:
      "33-year-old man, oval face, warm light-brown skin, bright dark eyes, neatly trimmed short black hair, average build, confident smile",
    thumbnailEmoji: "📚",
    createdById: teacher.id,
  },

  // =========================
  // MẠ - ELDER
  // =========================
  {
    name: "Ama K'Bram",
    nameEn: "Ama K'Bram",
    role: "elder",
    gender: "male",
    ethnicGroupId: maGroup?.id ?? null,
    descriptionVi:
      "Già làng Mạ 68 tuổi, hiểu biết phong tục truyền thống, thường kể chuyện và dạy thanh niên gìn giữ văn hóa dân tộc.",
    descriptionEn:
      "68-year-old Ma village elder, knowledgeable about traditions, enjoys storytelling and teaching young people about their culture.",
    costumePrompt:
      "wearing Ma traditional indigo long tunic with simple woven red embroidery, dark trousers, rattan bracelet, woven shoulder cloth",
    appearancePrompt:
      "68-year-old man, weathered face, warm brown skin, kind dark eyes, gray-black hair, thin gray beard, upright posture, wise gentle expression",
    thumbnailEmoji: "🪵",
    createdById: teacher.id,
  },

  // =========================
  // NÙNG - ELDER
  // =========================
  {
    name: "Bà Then Lan",
    nameEn: "Then Lan",
    role: "elder",
    gender: "female",
    ethnicGroupId: nungGroup?.id ?? null,
    descriptionVi:
      "Nghệ nhân Nùng 65 tuổi, am hiểu hát Then và nghề dệt truyền thống, được trẻ em trong làng rất yêu quý.",
    descriptionEn:
      "65-year-old Nung artisan, experienced Then folk singer and traditional weaver, beloved by children in the village.",
    costumePrompt:
      "wearing Nung traditional indigo tunic with elegant embroidered cuffs, black skirt, silver necklace, indigo headscarf",
    appearancePrompt:
      "65-year-old woman, gentle oval face with light wrinkles, fair warm skin, kind dark eyes, gray-black hair neatly tied in a bun, warm welcoming smile",
    thumbnailEmoji: "🎶",
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
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
