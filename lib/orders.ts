import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export type OrderLine = { productId: string; name: string; category: string; quantity: number; unitPriceInCents: number; totalInCents: number };
export type DeliveryDetails = { type: "hotel-room"; guestName: string; phone: string; floor: string; room: string; instructions?: string } | { type: "pool-area"; guestName: string; phone: string; locationDetails?: string; instructions?: string } | { type: "pickup"; name: string; phone: string; email: string; notes?: string };
export type RestaurantOrder = { id: string; orderNumber: string; createdAt: string; status: "PENDING_PAYMENT" | "PAID"; items: OrderLine[]; totalInCents: number; delivery: DeliveryDetails; stripeCheckoutSessionId?: string; stripePaymentIntentId?: string; processedWebhookEventIds: string[]; paidAt?: string };

const storageDirectory = process.env.ORDER_STORAGE_PATH || join(process.cwd(), ".order-data");
const storageFile = join(storageDirectory, "orders.json");

async function readOrders(): Promise<RestaurantOrder[]> {
  try { return JSON.parse(await readFile(storageFile, "utf8")); } catch { return []; }
}
async function writeOrders(orders: RestaurantOrder[]) { await mkdir(storageDirectory, { recursive: true }); await writeFile(storageFile, JSON.stringify(orders, null, 2)); }

export async function createPendingOrder(input: Omit<RestaurantOrder, "id" | "orderNumber" | "createdAt" | "status" | "processedWebhookEventIds">) {
  const order: RestaurantOrder = { ...input, id: randomUUID(), orderNumber: `DV-${String(Date.now()).slice(-6)}`, createdAt: new Date().toISOString(), status: "PENDING_PAYMENT", processedWebhookEventIds: [] };
  const orders = await readOrders(); orders.push(order); await writeOrders(orders); return order;
}
export async function getOrder(id: string) { return (await readOrders()).find(order => order.id === id); }
export async function setCheckoutSession(id: string, stripeCheckoutSessionId: string) { const orders = await readOrders(); const order = orders.find(item => item.id === id); if (!order) return; order.stripeCheckoutSessionId = stripeCheckoutSessionId; await writeOrders(orders); }
export async function markOrderPaid(id: string, eventId: string, stripeCheckoutSessionId: string, stripePaymentIntentId?: string) { const orders = await readOrders(); const order = orders.find(item => item.id === id); if (!order || order.processedWebhookEventIds.includes(eventId)) return order; order.processedWebhookEventIds.push(eventId); if (order.status !== "PAID") { order.status = "PAID"; order.paidAt = new Date().toISOString(); order.stripeCheckoutSessionId = stripeCheckoutSessionId; order.stripePaymentIntentId = stripePaymentIntentId; } await writeOrders(orders); return order; }
