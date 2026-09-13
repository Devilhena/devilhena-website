"use client";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./CartProvider";
export function CartButton(){const{itemCount}=useCart();return <Link href="/cart" className="focus-ring relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-earth/20 text-forest transition hover:border-earth hover:bg-beige" aria-label={`Cart with ${itemCount} item${itemCount===1?"":"s"}`}><ShoppingBag size={18}/>{itemCount>0&&<span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-forest px-1 text-center text-[10px] leading-4 text-cream">{itemCount}</span>}</Link>}
