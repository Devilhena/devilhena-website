import type { Metadata } from "next";
import { ForgotAdminPasswordForm } from "@/components/admin/AdminPasswordRecovery";

export const metadata: Metadata = { title: "Reset owner password", referrer: "no-referrer" };
export const dynamic = "force-dynamic";

export default function ForgotAdminPasswordPage() {
  return <main className="min-h-screen px-5 pb-20 pt-32 lg:px-10"><div className="mx-auto max-w-md rounded-[2rem] border border-earth/15 bg-beige/45 p-7 sm:p-10"><p className="eyebrow">De Vilhena Bistrot</p><h1 className="mt-3 font-display text-4xl">Reset owner <i className="text-earth">password.</i></h1><p className="mt-4 text-sm leading-7 text-forest/70">Enter your administrator email. We will send a secure link that expires after 15 minutes.</p><ForgotAdminPasswordForm /></div></main>;
}
