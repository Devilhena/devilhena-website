import { canonicalProductionOrigin, currentVercelPreviewOrigin } from "@/lib/canonical-site-url";

/**
 * State-changing staff/admin requests must originate from the public site.
 * The Origin header is supplied by browsers for the fetch requests used here.
 */
export function hasCanonicalOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin === canonicalProductionOrigin) return true;
  const previewOrigin = currentVercelPreviewOrigin(request);
  if (previewOrigin && origin === previewOrigin) return true;
  // Local development is deliberately opt-in through NODE_ENV and never applies
  // to a Vercel preview or production deployment.
  return process.env.NODE_ENV === "development" && /^http:\/\/localhost:\d+$/.test(origin || "");
}
