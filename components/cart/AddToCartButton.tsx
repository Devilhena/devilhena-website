"use client";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { type CartProduct, useCart } from "./CartProvider";
export function AddToCartButton({product,dark=false}:{product:CartProduct;dark?:boolean}){const{addItem}=useCart();const[added,setAdded]=useState(false);function add(){addItem(product);setAdded(true);window.setTimeout(()=>setAdded(false),1300)}return <button onClick={add} className={`focus-ring mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-[.14em] transition ${dark?"border-cream/40 text-cream hover:bg-cream hover:text-forest":"border-earth/30 text-forest hover:border-forest hover:bg-forest hover:text-cream"}`} aria-label={`Add ${product.name} to cart`}>{added?<><Check size={13}/>ADDED</>:<><Plus size={13}/>ADD TO CART</>}</button>}
