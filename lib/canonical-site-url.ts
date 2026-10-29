export const canonicalProductionOrigin = "https://www.devilhena.com";

function isApprovedProductionSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured) throw new Error("Canonical site URL is not configured.");
  let url: URL;
  try { url = new URL(configured); } catch { throw new Error("Canonical site URL is invalid."); }
  if (url.origin !== canonicalProductionOrigin || url.protocol !== "https:" || url.hostname !== "www.devilhena.com" || url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    throw new Error("Canonical site URL is not approved.");
  }
}

/**
 * Returns a Preview origin only when it is the HTTPS hostname assigned to this
 * exact Vercel deployment. Request headers alone can never introduce an origin.
 */
export function currentVercelPreviewOrigin(request: Request) {
  if (process.env.VERCEL_ENV !== "preview") return undefined;
  const deploymentHost = process.env.VERCEL_URL?.trim().toLowerCase();
  if (!deploymentHost || !/^[a-z0-9](?:[a-z0-9-]{0,251}[a-z0-9])?\.vercel\.app$/.test(deploymentHost)) return undefined;
  try {
    const requestUrl = new URL(request.url);
    if (requestUrl.protocol !== "https:" || requestUrl.hostname.toLowerCase() !== deploymentHost || requestUrl.port || requestUrl.username || requestUrl.password) return undefined;
    return `https://${deploymentHost}`;
  } catch {
    return undefined;
  }
}

export function getApprovedCheckoutOrigin(request: Request) {
  const previewOrigin = currentVercelPreviewOrigin(request);
  if (previewOrigin) return previewOrigin;
  isApprovedProductionSiteUrl();
  return canonicalProductionOrigin;
}
