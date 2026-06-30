import { redirect } from "next/navigation";
// SUPER_ADMIN đã được gộp vào ADMIN
export default function SuperAdminPage() {
  redirect("/dashboard/admin");
}
