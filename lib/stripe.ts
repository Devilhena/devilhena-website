import Stripe from "stripe";
import { assertPreviewStripeAccess } from "@/lib/preview-deployment-guard";

export const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured.");
  assertPreviewStripeAccess(key);
  return new Stripe(key);
};
