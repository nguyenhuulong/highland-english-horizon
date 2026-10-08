import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
p.lesson.update({ where: { id: process.argv[2] }, data: { status: "PUBLISHED" } }).then(() => { console.log("published"); return p.$disconnect(); });
