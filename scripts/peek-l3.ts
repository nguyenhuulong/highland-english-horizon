import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
p.lesson.findMany({ where: { titleEn: { in: ["N'Thao's Adventure", "K'Bran and the Little Deer"] } } }).then(async ls => { for (const l of ls) console.log(l.titleEn, "|", l.descriptionVi.slice(0, 120), "|", l.titleVi, "| src", l.source, l.emoji); await p.$disconnect(); });
