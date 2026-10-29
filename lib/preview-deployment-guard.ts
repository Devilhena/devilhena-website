/**
 * A Preview deployment must be explicitly approved before it can use external
 * services. This protects newly pushed branches while their branch-specific
 * Vercel variables are still being configured.
 *
 * These checks intentionally apply only to Vercel Preview deployments. They
 * do not change local development or Production behaviour.
 */
const previewApprovalValue = "devilhena-preview-order-email-notifications";

function isVercelPreview() {
  return process.env.VERCEL_ENV === "preview";
}

function requirePreviewApproval() {
  if (!isVercelPreview()) return;
  if (process.env.PREVIEW_DEPLOYMENT_GUARD !== previewApprovalValue) {
    throw new Error("Preview external services are not approved.");
  }
}

export function assertPreviewDatabaseAccess(connectionString: string) {
  if (!isVercelPreview()) return;
  requirePreviewApproval();

  const expectedHost = process.env.PREVIEW_DATABASE_HOST?.trim().toLowerCase();
  let actualHost: string;
  try {
    actualHost = new URL(connectionString).hostname.toLowerCase();
  } catch {
    throw new Error("Preview database configuration is invalid.");
  }

  if (!expectedHost || actualHost !== expectedHost) {
    throw new Error("Preview database is not approved.");
  }
}

export function assertPreviewStripeAccess(secretKey: string) {
  if (!isVercelPreview()) return;
  requirePreviewApproval();
  if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("rk_test_")) {
    throw new Error("Preview Stripe must use Test Mode.");
  }
}

export function assertPreviewEmailDeliveryAccess() {
  if (!isVercelPreview()) return;
  requirePreviewApproval();
  if (process.env.PREVIEW_EMAIL_NOTIFICATIONS_ENABLED !== "true") {
    throw new Error("Preview email delivery is not approved.");
  }
}
