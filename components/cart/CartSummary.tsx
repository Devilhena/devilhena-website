"use client";
import { formatPrice, useCart } from "./CartProvider";
export function CartSummary(){const{subtotal}=useCart();return <div className="border-y border-earth/20 py-5"><div className="flex items-center justify-between font-display text-xl"><span>Total</span><span className="text-earth">{formatPrice(subtotal)}</span></div></div>}
