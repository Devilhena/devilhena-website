import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  try {
    if (!(await requireAdminUser())) redirect("/admin/login");
  } catch {
    redirect("/admin/login");
  }

  redirect("/admin?section=staff");
}
