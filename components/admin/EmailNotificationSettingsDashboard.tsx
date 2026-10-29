"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { EmailNotificationSettings, EmailRecipientGroup } from "@/lib/order-email-notifications";

const groups: Array<{ key: EmailRecipientGroup; title: string; description: string }> = [
  { key: "MANAGEMENT", title: "Management", description: "Complete paid-order and payment details." },
  { key: "KITCHEN", title: "Kitchen", description: "Complete preparation list without prices or payment information." },
  { key: "BAR", title: "Bar", description: "Drink and wine items only, when a bar recipient is configured." },
];

export function EmailNotificationSettingsDashboard() {
  const [settings, setSettings] = useState<EmailNotificationSettings>();
  const [drafts, setDrafts] = useState<Record<EmailRecipientGroup, string>>({ MANAGEMENT: "", KITCHEN: "", BAR: "" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/settings/email-notifications", { cache: "no-store" });
      if (response.status === 401) { window.location.assign("/admin/login"); return; }
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load settings.");
      setSettings(body.settings);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load settings."); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  function update(group: EmailRecipientGroup, value: Partial<EmailNotificationSettings[EmailRecipientGroup]>) { setSettings((current) => current ? { ...current, [group]: { ...current[group], ...value } } : current); }
  function addRecipient(group: EmailRecipientGroup) { const email = drafts[group].trim(); if (!email || !settings) return; if (settings[group].recipients.includes(email)) return; update(group, { recipients: [...settings[group].recipients, email] }); setDrafts((current) => ({ ...current, [group]: "" })); }
  function removeRecipient(group: EmailRecipientGroup, email: string) { if (!settings) return; update(group, { recipients: settings[group].recipients.filter((recipient) => recipient !== email) }); }
  function editRecipient(group: EmailRecipientGroup, email: string) { if (!settings) return; const replacement = window.prompt("Edit recipient email", email)?.trim(); if (!replacement || replacement === email) return; update(group, { recipients: [...settings[group].recipients.filter((recipient) => recipient !== email), replacement] }); }
  async function save(event: FormEvent) { event.preventDefault(); if (!settings) return; setBusy("save"); setMessage(""); try { const response = await fetch("/api/admin/settings/email-notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || "Unable to save settings."); setSettings(body.settings); setMessage("Email notification settings saved."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save settings."); } finally { setBusy(""); } }
  async function test(group: EmailRecipientGroup) { setBusy(`test-${group}`); setMessage(""); try { const response = await fetch("/api/admin/settings/email-notifications/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || "Unable to send test email."); setMessage(`Test email sent to ${body.sent} recipient${body.sent === 1 ? "" : "s"}.`); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to send test email."); } finally { setBusy(""); } }
  return <main className="min-h-screen px-4 pb-16 pt-28 sm:px-6 lg:px-10"><div className="mx-auto max-w-4xl"><header className="border-b border-earth/15 pb-7"><p className="eyebrow">Settings</p><h1 className="mt-3 font-display text-4xl sm:text-5xl">Email <i className="text-earth">Notifications.</i></h1><p className="mt-3 max-w-2xl text-sm leading-6 text-forest/70">Recipients receive messages only after Stripe has verified a paid order. Saving changes affects future orders only.</p><Link href="/admin/orders" className="focus-ring mt-5 inline-flex rounded-full border border-earth/25 px-4 py-3 text-xs font-semibold tracking-[.12em]">BACK TO ORDERS</Link></header>{message && <p role="status" className="mt-5 rounded-xl bg-beige/70 p-4 text-sm text-forest">{message}</p>}<form className="mt-8 space-y-6" onSubmit={save}>{groups.map((group) => { const setting = settings?.[group.key]; return <section key={group.key} className="rounded-3xl border border-earth/15 bg-cream/70 p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-display text-3xl">{group.title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-forest/65">{group.description}</p></div><label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold tracking-[.12em]"><input type="checkbox" checked={setting?.enabled ?? false} onChange={(event) => update(group.key, { enabled: event.target.checked })} disabled={!setting}/> ENABLED</label></div><div className="mt-5 flex flex-wrap gap-2">{setting?.recipients.map((email) => <span key={email} className="inline-flex items-center gap-2 rounded-full border border-earth/20 px-3 py-2 text-sm">{email}<button type="button" onClick={() => editRecipient(group.key, email)} className="text-xs font-semibold tracking-[.08em] text-earth">EDIT</button><button type="button" aria-label={`Remove ${email}`} onClick={() => removeRecipient(group.key, email)} className="text-earth">×</button></span>)}</div><div className="mt-5 flex flex-col gap-2 sm:flex-row"><input type="email" value={drafts[group.key]} onChange={(event) => setDrafts((current) => ({ ...current, [group.key]: event.target.value }))} placeholder="name@example.com" className="focus-ring min-h-11 flex-1 rounded-xl border border-earth/20 bg-transparent px-3 text-sm"/><button type="button" onClick={() => addRecipient(group.key)} className="focus-ring min-h-11 rounded-full border border-earth/25 px-4 text-xs font-semibold tracking-[.12em]">ADD EMAIL</button><button type="button" disabled={busy === `test-${group.key}`} onClick={() => void test(group.key)} className="focus-ring min-h-11 rounded-full bg-forest px-4 text-xs font-semibold tracking-[.12em] text-cream disabled:opacity-60">{busy === `test-${group.key}` ? "SENDING…" : "SEND TEST"}</button></div></section>; })}<button disabled={!settings || busy === "save"} className="focus-ring min-h-12 rounded-full bg-forest px-6 py-3 text-xs font-semibold tracking-[.15em] text-cream disabled:opacity-60">{busy === "save" ? "SAVING…" : "SAVE CHANGES"}</button></form></div></main>;
}
