import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { requireAdminUser } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let isAdmin = false;

  try {
    isAdmin = Boolean(await requireAdminUser());
  } catch {
    redirect("/admin/login");
  }

  if (!isAdmin) redirect("/admin/login");

  return <AdminDashboard />;
}
