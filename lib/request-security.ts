import { canonicalProductionOrigin } from "@/lib/canonical-site-url";

/**
 * State-changing staff/admin requests must originate from the public site.
 * The Origin header is supplied by browsers for the fetch requests used here.
 */
export function hasCanonicalOrigin(request: Request) {
  return request.headers.get("origin") === canonicalProductionOrigin;
}
