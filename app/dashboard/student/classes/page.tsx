import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import JoinClassForm from "@/components/dashboard/JoinClassForm";

export default async function StudentClassesPage() {
  const session = await auth();
  const memberships = await prisma.classMember.findMany({
    where: { studentId: session!.user.id },
    include: { class: { include: { teacher: { select: { name: true } }, members: true } } },
  });

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>🏫 Lớp học của tôi</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Tham gia lớp học bằng mã do giáo viên cung cấp.</p>

      <div style={{ background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 14, padding: 18, marginBottom: 24, maxWidth: 480 }}>
        <JoinClassForm />
      </div>

      {memberships.length === 0 ? (
        <div style={{ color: "var(--text-muted)" }}>Bạn chưa tham gia lớp học nào.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {memberships.map((m) => (
            <div key={m.id} style={{ background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 14, padding: 18 }}>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>{m.class.name}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Giáo viên: {m.class.teacher.name}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{m.class.members.length} học sinh</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
