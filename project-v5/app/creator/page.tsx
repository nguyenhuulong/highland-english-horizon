import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CreatorEditor from "@/components/creator/CreatorEditor";

export default async function CreatorPage() {
  const session = await auth();

  if (!session?.user || !["TEACHER", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  return <CreatorEditor />;
}
