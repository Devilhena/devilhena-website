import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { requireAdminUser } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  try {
    if (!(await requireAdminUser())) redirect("/admin/login");
  } catch {
    redirect("/admin/login");
  }

  return <AdminDashboard />;
}
