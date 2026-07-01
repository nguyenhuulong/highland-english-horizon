import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ROLE_HOME } from "@/lib/rbac";

export default async function DashboardIndex() {
  const session = await auth();
  const role = session?.user?.role || "STUDENT";
  redirect(ROLE_HOME[role] || "/dashboard/student");
}
