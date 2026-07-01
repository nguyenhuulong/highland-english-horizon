import { prisma } from "@/lib/prisma";
import CultureEditor from "@/components/dashboard/CultureEditor";

export default async function AdminCulturePage() {
  const groups = await prisma.ethnicGroup.findMany({ orderBy: { nameVi: "asc" } });

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>🎎 Kho dữ liệu văn hóa</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
        Dữ liệu văn hóa các dân tộc Tây Nguyên và phía Bắc — được AI sử dụng làm bối cảnh khi tạo bài học.
      </p>
      <CultureEditor
        groups={groups.map((g) => ({
          id: g.id,
          slug: g.slug,
          nameVi: g.nameVi,
          emoji: g.emoji,
          description: g.description,
          costume: g.costume as string[],
          festivals: g.festivals as string[],
          instruments: g.instruments as string[],
          crafts: g.crafts as string[],
          cuisine: g.cuisine as string[],
          locations: g.locations as string[],
          architecture: g.architecture,
        }))}
      />
    </div>
  );
}
