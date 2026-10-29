import Link from "next/link";

export default function PortalPage() {
  return (
    <main className="min-h-screen px-5 pb-20 pt-32 lg:px-10">
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-earth/15 bg-beige/45 p-7 sm:p-10">
        <p className="eyebrow">De Vilhena Bistrot</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">
          Staff <i className="text-earth">Portal.</i>
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-forest/70">
          Choose the right sign-in area for your role.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/staff/login" className="focus-ring rounded-2xl border border-earth/20 bg-cream/70 p-6 transition hover:-translate-y-0.5">
            <p className="eyebrow">Restaurant team</p>
            <h2 className="mt-3 font-display text-3xl">Staff login</h2>
            <p className="mt-3 text-sm leading-6 text-forest/70">View and manage verified restaurant orders.</p>
          </Link>
          <Link href="/admin/login" className="focus-ring rounded-2xl bg-forest p-6 text-cream transition hover:-translate-y-0.5">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-clay">Restaurant administration</p>
            <h2 className="mt-3 font-display text-3xl">Admin login</h2>
            <p className="mt-3 text-sm leading-6 text-cream/75">Manage orders, staff, and email notifications in one dashboard.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
