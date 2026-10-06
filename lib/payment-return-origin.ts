function isApprovedPaymentReturnOrigin(url: URL) {
  return url.protocol === "https:"
    && url.pathname === "/"
    && !url.search
    && !url.hash
    && !url.username
    && !url.password;
}

function isApprovedVercelPreviewOrigin(url: URL) {
  return isApprovedPaymentReturnOrigin(url)
    && url.hostname.endsWith(".vercel.app");
}

function parseVercelBranchUrl(value: string) {
  const candidate = value.startsWith("https://") ? value : `https://${value}`;
  let url: URL;
  try { url = new URL(candidate); } catch { throw new Error("Vercel branch URL is invalid."); }
  if (!isApprovedVercelPreviewOrigin(url)) throw new Error("Vercel branch URL is not approved.");
  return url.origin;
}

export function getPaymentReturnOrigin(request?: Request) {
  if (process.env.VERCEL_ENV === "preview") {
    const branchUrl = process.env.VERCEL_BRANCH_URL;
    if (branchUrl) return parseVercelBranchUrl(branchUrl);

    if (!request?.headers.get("x-vercel-id")) throw new Error("Preview request origin is unavailable.");
    let requestUrl: URL;
    try { requestUrl = new URL(request.url); } catch { throw new Error("Preview request origin is invalid."); }
    if (!isApprovedVercelPreviewOrigin(requestUrl)) throw new Error("Preview request origin is not approved.");
    return requestUrl.origin;
  }

  const configured = process.env.STRIPE_PAYMENT_RETURN_ORIGIN;
  if (!configured) throw new Error("Payment return origin is not configured.");

  let url: URL;
  try { url = new URL(configured); } catch { throw new Error("Payment return origin is invalid."); }
  if (!isApprovedPaymentReturnOrigin(url)) throw new Error("Payment return origin is not approved.");
  return url.origin;
}
