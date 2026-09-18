import { StaffLoginForm } from "@/components/staff/StaffLoginForm";

export const dynamic = "force-dynamic";

export default function StaffLoginPage() {
  return <main className="min-h-screen px-5 pb-20 pt-32 lg:px-10"><div className="mx-auto max-w-md rounded-[2rem] border border-earth/15 bg-beige/45 p-7 sm:p-10"><p className="eyebrow">De Vilhena Bistrot</p><h1 className="mt-3 font-display text-4xl">Staff <i className="text-earth">login.</i></h1><p className="mt-4 text-sm leading-7 text-forest/70">Sign in to view and manage paid restaurant orders.</p><StaffLoginForm /></div></main>;
}
