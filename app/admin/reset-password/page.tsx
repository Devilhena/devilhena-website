import type { Metadata } from "next";
import { ResetAdminPasswordForm } from "@/components/admin/AdminPasswordRecovery";

export const metadata: Metadata = { title: "Choose a new owner password", referrer: "no-referrer" };
export const dynamic = "force-dynamic";

export default async function ResetAdminPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return <main className="min-h-screen px-5 pb-20 pt-32 lg:px-10"><div className="mx-auto max-w-md rounded-[2rem] border border-earth/15 bg-beige/45 p-7 sm:p-10"><p className="eyebrow">De Vilhena Bistrot</p><h1 className="mt-3 font-display text-4xl">Choose a new <i className="text-earth">password.</i></h1><p className="mt-4 text-sm leading-7 text-forest/70">A successful reset signs out every existing owner session.</p><ResetAdminPasswordForm token={token} /></div></main>;
}
