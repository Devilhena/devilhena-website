export type PaymentSession = {
  fingerprint: string;
  clientSecret: string;
  totalInCents: number;
  returnUrl: string;
};

export const paymentSessionKey = "de-vilhena-embedded-payment";

export function readPaymentSession() {
  try {
    const raw = window.sessionStorage.getItem(paymentSessionKey);
    if (!raw) return undefined;
    const value = JSON.parse(raw) as Partial<PaymentSession>;
    if (typeof value.fingerprint !== "string" || typeof value.clientSecret !== "string" || typeof value.totalInCents !== "number" || typeof value.returnUrl !== "string") return undefined;
    return value as PaymentSession;
  } catch {
    return undefined;
  }
}

export function savePaymentSession(session: PaymentSession) {
  window.sessionStorage.setItem(paymentSessionKey, JSON.stringify(session));
}

export function clearPaymentSession() {
  window.sessionStorage.removeItem(paymentSessionKey);
}
