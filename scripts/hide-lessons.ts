import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
p.lesson.updateMany({ where: { id: { in: process.argv.slice(2) } }, data: { status: "DRAFT" } }).then(r => { console.log("hidden", r.count); return p.$disconnect(); });
