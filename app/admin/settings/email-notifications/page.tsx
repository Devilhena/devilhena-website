import Link from "next/link";
import { redirect } from "next/navigation";
import { EmailNotificationSettingsDashboard } from "@/components/admin/EmailNotificationSettingsDashboard";
import { requireAdminUser } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export default async function EmailNotificationSettingsPage() {
  let admin;

  try {
    admin = await requireAdminUser();
  } catch {
    redirect("/admin/login");
  }

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-cream px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin/staff"
          className="focus-ring inline-flex rounded-full border border-earth/25 px-5 py-3 text-xs font-semibold tracking-[.12em] text-forest"
        >
          ← BACK TO STAFF MANAGEMENT
        </Link>
        <EmailNotificationSettingsDashboard />
      </div>
    </main>
  );
}
