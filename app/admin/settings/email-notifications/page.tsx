import { redirect } from "next/navigation";
import { EmailNotificationSettingsDashboard } from "@/components/admin/EmailNotificationSettingsDashboard";
import { requireAdminUser } from "@/lib/staff-auth";

export default async function EmailNotificationSettingsPage() {
  if (!(await requireAdminUser())) redirect("/admin/login");
  return <EmailNotificationSettingsDashboard />;
}
