"use client";

import { ExpressCheckoutElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { formatPrice } from "./CartProvider";

type EmbeddedPaymentFormProps = {
  amountInCents: number;
  returnUrl: string;
};

export function EmbeddedPaymentForm({ amountInCents, returnUrl }: EmbeddedPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string>();
  const [processing, setProcessing] = useState(false);
  const [walletsAvailable, setWalletsAvailable] = useState<boolean | null>(null);

  async function confirmPayment() {
    if (!stripe || !elements || processing) return;
    setError(undefined);
    setProcessing(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError("Please check your payment details and try again.");
      setProcessing(false);
      return;
    }

    const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    if (paymentError) {
      setError("Payment could not be completed. Please check your payment details and try again.");
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      window.location.assign(returnUrl);
      return;
    }

    setError("Payment could not be completed. Please try again.");
    setProcessing(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await confirmPayment();
  }

  return (
    <form onSubmit={submit} className="mt-8 border-t border-earth/15 pt-8">
      <div className="flex items-center gap-2">
        <LockKeyhole size={17} className="text-earth" />
        <h2 className="font-display text-2xl">Secure Payment</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-forest/65">Your payment details are securely handled by Stripe.</p>
      <div className={walletsAvailable === false ? "hidden" : "mt-6"}>
        <p className="text-xs font-semibold uppercase tracking-[.15em] text-earth">Express checkout</p>
        <div className="mt-3 rounded-2xl border border-earth/15 bg-cream/55 p-4 sm:p-5">
          <ExpressCheckoutElement onConfirm={confirmPayment} onReady={event => setWalletsAvailable(Boolean(event.availablePaymentMethods && Object.values(event.availablePaymentMethods).some(Boolean)))} />
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-earth/15 bg-cream/55 p-4 sm:p-5">
        <PaymentElement options={{ layout: "tabs", wallets: { applePay: "never", googlePay: "never" } }} />
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      <button disabled={!stripe || !elements || processing} className="focus-ring mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-forest px-6 py-3 text-xs font-semibold tracking-[.15em] text-cream transition hover:bg-earth disabled:cursor-not-allowed disabled:opacity-60">
        {processing && <LoaderCircle className="animate-spin" size={15} />}
        {processing ? "PROCESSING PAYMENT…" : `PAY ${formatPrice(amountInCents / 100)}`}
      </button>
    </form>
  );
}
