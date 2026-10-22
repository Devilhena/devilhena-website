import { canonicalProductionOrigin } from "@/lib/canonical-site-url";

export async function sendAdminPasswordResetEmail(email: string, token: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ADMIN_PASSWORD_RESET_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Password recovery email is not configured.");
  const resetUrl = new URL("/admin/reset-password", canonicalProductionOrigin);
  resetUrl.searchParams.set("token", token);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Reset your De Vilhena owner password",
      text: `Use this secure link within 15 minutes to reset your De Vilhena owner password:\n\n${resetUrl.toString()}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>Use the secure link below within 15 minutes to reset your De Vilhena owner password.</p><p><a href="${resetUrl.toString()}">Reset owner password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    }),
  });
  if (!response.ok) throw new Error("Password recovery email could not be sent.");
}
