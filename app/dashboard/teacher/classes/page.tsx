import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import CreateClassForm from "@/components/dashboard/CreateClassForm";

export default async function TeacherClassesPage() {
  const session = await auth();
  const classes = await prisma.class.findMany({
    where: { teacherId: session!.user.id },
    include: { members: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>🏫 Lớp học</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Tạo lớp học và chia sẻ mã lớp cho học sinh.</p>

      <div style={{ background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 14, padding: 18, marginBottom: 24, maxWidth: 480 }}>
        <CreateClassForm />
      </div>

      {classes.length === 0 ? (
        <div style={{ color: "var(--text-muted)" }}>Chưa có lớp học nào.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {classes.map((c) => (
            <Link key={c.id} href={`/dashboard/teacher/classes/${c.id}`} style={{ background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 14, padding: 18, textDecoration: "none", color: "var(--text)" }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>{c.name}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 4 }}>{c.members.length} học sinh</div>
              <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, background: "var(--surface)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: 1 }}>
                Mã: {c.joinCode}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
