import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
p.comicCharacter.updateMany({ where: { name: process.argv[2] }, data: { characterImageUrl: process.argv[3] } }).then(r => { console.log("updated", r.count); return p.$disconnect(); });
