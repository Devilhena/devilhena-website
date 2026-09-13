"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartProduct={id:string;name:string;price:string;category:string;description?:string};
export type CartLine=CartProduct & {quantity:number;unitPrice:number};
type CartContextValue={items:CartLine[];itemCount:number;subtotal:number;addItem:(product:CartProduct)=>void;increase:(id:string)=>void;decrease:(id:string)=>void;remove:(id:string)=>void;clear:()=>void};
const CartContext=createContext<CartContextValue|undefined>(undefined);
const STORAGE_KEY="de-vihelhana-cart";
const priceToNumber=(price:string)=>Number(price.replace(/[^0-9.]/g,""));
export const formatPrice=(amount:number)=>`€${amount.toFixed(2)}`;
const persist=(items:CartLine[])=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(items))}catch{}};

export function CartProvider({children}:{children:React.ReactNode}){const[items,setItems]=useState<CartLine[]>([]);const[ready,setReady]=useState(false);useEffect(()=>{try{const saved=localStorage.getItem(STORAGE_KEY);if(saved)setItems(JSON.parse(saved));}catch{}finally{setReady(true)}},[]);useEffect(()=>{if(ready)persist(items)},[items,ready]);const value=useMemo<CartContextValue>(()=>({items,itemCount:items.reduce((count,item)=>count+item.quantity,0),subtotal:items.reduce((total,item)=>total+item.unitPrice*item.quantity,0),addItem(product){setItems(current=>{const existing=current.find(item=>item.id===product.id);const next=existing?current.map(item=>item.id===product.id?{...item,quantity:item.quantity+1}:item):[...current,{...product,unitPrice:priceToNumber(product.price),quantity:1}];persist(next);return next})},increase(id){setItems(current=>{const next=current.map(item=>item.id===id?{...item,quantity:item.quantity+1}:item);persist(next);return next})},decrease(id){setItems(current=>{const next=current.flatMap(item=>item.id===id?(item.quantity===1?[]:[{...item,quantity:item.quantity-1}]):[item]);persist(next);return next})},remove(id){setItems(current=>{const next=current.filter(item=>item.id!==id);persist(next);return next})},clear(){setItems(()=>{persist([]);return[]})}}),[items]);return <CartContext.Provider value={value}>{children}</CartContext.Provider>}
export function useCart(){const context=useContext(CartContext);if(!context)throw new Error("useCart must be used inside CartProvider");return context}
