import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
p.comicBackground.update({ where: { key: process.argv[2] }, data: { imageUrl: process.argv[3] } }).then(() => { console.log("ok"); return p.$disconnect(); });
