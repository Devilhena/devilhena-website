"use client";

import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminOrderHistory } from "@/components/admin/AdminOrderHistory";
import { AdminOrdersDashboard } from "@/components/admin/AdminOrdersDashboard";
import { AdminStaffDashboard } from "@/components/admin/AdminStaffDashboard";
import { EmailNotificationSettingsDashboard } from "@/components/admin/EmailNotificationSettingsDashboard";

const sections = [
  { id: "orders", label: "LIVE ORDERS" },
  { id: "history", label: "ORDER HISTORY" },
  { id: "staff", label: "STAFF" },
  { id: "email", label: "EMAIL NOTIFICATIONS" },
] as const;

type SectionId = (typeof sections)[number]["id"];

function sectionFromUrl(): SectionId {
  if (typeof window === "undefined") return "orders";
  const value = new URLSearchParams(window.location.search).get("section");
  return sections.some((section) => section.id === value) ? value as SectionId : "orders";
}

export function AdminDashboard() {
  const router = useRouter();
  const [section, setSection] = useState<SectionId>("orders");

  useEffect(() => {
    setSection(sectionFromUrl());
  }, []);

  function selectSection(next: SectionId) {
    setSection(next);
    const url = new URL(window.location.href);
    if (next === "orders") url.searchParams.delete("section");
    else url.searchParams.set("section", next);
    window.history.replaceState(null, "", url.toString());
  }

  async function logout() {
    await fetch("/api/staff/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen px-4 pb-16 pt-28 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-earth/15 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">De Vilhena Bistrot</p>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl">Admin <i className="text-earth">Dashboard.</i></h1>
            <p className="mt-3 text-sm text-forest/65">Restaurant management in one place.</p>
          </div>
          <button onClick={() => void logout()} className="focus-ring inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-earth/25 px-4 text-xs font-semibold tracking-[.12em] text-forest sm:self-auto">
            <LogOut size={15} />SIGN OUT
          </button>
        </header>

        <nav aria-label="Admin dashboard sections" className="mt-6 flex flex-wrap gap-2">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectSection(item.id)}
              className={"focus-ring min-h-10 rounded-full px-4 text-xs font-semibold tracking-[.12em] " + (section === item.id ? "bg-forest text-cream" : "border border-earth/20 text-forest")}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-8">
          {section === "orders" && <AdminOrdersDashboard />}
          {section === "history" && <AdminOrderHistory />}
          {section === "staff" && <AdminStaffDashboard />}
          {section === "email" && <EmailNotificationSettingsDashboard />}
        </div>
      </div>
    </main>
  );
}
