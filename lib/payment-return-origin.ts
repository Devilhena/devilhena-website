function isApprovedPaymentReturnOrigin(url: URL) {
  return url.protocol === "https:"
    && url.pathname === "/"
    && !url.search
    && !url.hash
    && !url.username
    && !url.password;
}

export function getPaymentReturnOrigin() {
  const configured = process.env.STRIPE_PAYMENT_RETURN_ORIGIN;
  if (!configured) throw new Error("Payment return origin is not configured.");

  let url: URL;
  try { url = new URL(configured); } catch { throw new Error("Payment return origin is invalid."); }
  if (!isApprovedPaymentReturnOrigin(url)) throw new Error("Payment return origin is not approved.");
  return url.origin;
}
