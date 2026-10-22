"use client";

import Link from "next/link";
import { useState } from "react";

export function ForgotAdminPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Unable to request a reset link.");
      setMessage(payload.message || "If that email belongs to an administrator, a reset link will arrive shortly.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to request a reset link."); }
    finally { setLoading(false); }
  }
  return <form onSubmit={submit} className="mt-8 space-y-6"><label className="block"><span className="text-xs font-semibold uppercase tracking-[.15em] text-earth">Admin email</span><input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="focus-ring mt-2 w-full border-b border-earth/30 bg-transparent py-3 text-sm" required /></label>{message && <p role="status" className="text-sm leading-6 text-forest">{message}</p>}{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<div className="flex flex-wrap items-center gap-4"><button disabled={loading} className="focus-ring min-h-12 rounded-full bg-forest px-6 py-3 text-xs font-semibold tracking-[.15em] text-cream transition hover:bg-earth disabled:opacity-60">{loading ? "SENDING…" : "EMAIL RESET LINK"}</button><Link href="/admin/login" className="focus-ring text-xs font-semibold tracking-[.12em] text-earth underline">BACK TO LOGIN</Link></div></form>;
}

export function ResetAdminPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState(""); const [confirmation, setConfirmation] = useState("");
  const [complete, setComplete] = useState(false); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (password !== confirmation) { setError("The passwords do not match."); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/admin/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Unable to reset the password.");
      setComplete(true); setPassword(""); setConfirmation("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to reset the password."); }
    finally { setLoading(false); }
  }
  if (!token) return <div className="mt-8"><p role="alert" className="text-sm text-red-700">This reset link is missing or invalid.</p><Link href="/admin/forgot-password" className="focus-ring mt-5 inline-block text-xs font-semibold tracking-[.12em] text-earth underline">REQUEST A NEW LINK</Link></div>;
  if (complete) return <div className="mt-8"><p role="status" className="text-sm leading-6 text-forest">Your password has been changed and old sessions have been signed out.</p><Link href="/admin/login" className="focus-ring mt-5 inline-block rounded-full bg-forest px-6 py-3 text-xs font-semibold tracking-[.15em] text-cream">CONTINUE TO LOGIN</Link></div>;
  return <form onSubmit={submit} className="mt-8 space-y-6"><label className="block"><span className="text-xs font-semibold uppercase tracking-[.15em] text-earth">New password</span><input autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} maxLength={200} className="focus-ring mt-2 w-full border-b border-earth/30 bg-transparent py-3 text-sm" required /><span className="mt-2 block text-xs leading-5 text-forest/60">At least 10 characters with uppercase, lowercase, and a number.</span></label><label className="block"><span className="text-xs font-semibold uppercase tracking-[.15em] text-earth">Confirm new password</span><input autoComplete="new-password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={10} maxLength={200} className="focus-ring mt-2 w-full border-b border-earth/30 bg-transparent py-3 text-sm" required /></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={loading} className="focus-ring min-h-12 rounded-full bg-forest px-6 py-3 text-xs font-semibold tracking-[.15em] text-cream transition hover:bg-earth disabled:opacity-60">{loading ? "RESETTING…" : "RESET PASSWORD"}</button></form>;
}
