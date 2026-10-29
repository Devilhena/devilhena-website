import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  let isAdmin = false;

  try {
    isAdmin = Boolean(await requireAdminUser());
  } catch {
    redirect("/admin/login");
  }

  if (!isAdmin) redirect("/admin/login");

  redirect("/admin");
}
