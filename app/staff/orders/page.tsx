import { redirect } from "next/navigation";
import { StaffOrdersDashboard } from "@/components/staff/StaffOrdersDashboard";
import { requireStaffUser } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export default async function StaffOrdersPage() {
  try {
    if (!(await requireStaffUser())) redirect("/staff/login");
  } catch { redirect("/staff/login"); }
  return <StaffOrdersDashboard />;
}
