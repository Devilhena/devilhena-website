"use client";

import { useState } from "react";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { AdminStaffDashboard } from "@/components/admin/AdminStaffDashboard";
import { EmailNotificationSettingsDashboard } from "@/components/admin/EmailNotificationSettingsDashboard";

const sections = [
  { id: "orders", label: "Orders" },
  { id: "staff", label: "Staff" },
  { id: "email", label: "Email notifications" },
] as const;

type SectionId = (typeof sections)[number]["id"];

export function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<SectionId>("orders");

  return (
    <main className="min-h-screen px-4 pb-16 pt-28 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-earth/15 pb-7">
          <p className="eyebrow">De Vilhena Bistrot</p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl">
            Admin <i className="text-earth">Dashboard.</i>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-forest/70">
            Manage restaurant orders, staff accounts, and notification settings in one place.
          </p>
          <nav aria-label="Admin dashboard sections" className="mt-6 flex flex-wrap gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                aria-pressed={activeSection === section.id}
                className={`focus-ring min-h-11 rounded-full px-4 text-xs font-semibold tracking-[.12em] ${activeSection === section.id ? "bg-forest text-cream" : "border border-earth/25 text-forest"}`}
              >
                {section.label.toUpperCase()}
              </button>
            ))}
          </nav>
        </header>

        {activeSection === "orders" && <AdminOrders />}
        {activeSection === "staff" && <AdminStaffDashboard />}
        {activeSection === "email" && <EmailNotificationSettingsDashboard />}
      </div>
    </main>
  );
}
