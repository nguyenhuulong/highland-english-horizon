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
