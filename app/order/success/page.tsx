import { OrderConfirmation } from "@/components/cart/OrderConfirmation";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order_id?: string }> }) {
  const orderId = (await searchParams).order_id;
  return orderId ? <OrderConfirmation orderId={orderId} /> : <main className="min-h-screen px-5 pt-32"><p>Order reference missing.</p></main>;
}
