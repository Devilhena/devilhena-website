export const canonicalProductionOrigin = "https://www.devilhena.com";

export function getCanonicalCheckoutOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured) throw new Error("Canonical site URL is not configured.");
  let url: URL;
  try { url = new URL(configured); } catch { throw new Error("Canonical site URL is invalid."); }
  if (url.origin !== canonicalProductionOrigin || url.protocol !== "https:" || url.hostname !== "www.devilhena.com" || url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    throw new Error("Canonical site URL is not approved.");
  }
  return canonicalProductionOrigin;
}
