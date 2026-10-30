"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { food } from "@/data/activeFoodMenu";
import { drinks, wines } from "@/data/officialMenu";

export type CartProduct = {
  id: string;
  name: string;
  price: string;
  category: string;
  description?: string;
};

export type CartLine = CartProduct & {
  quantity: number;
  unitPrice: number;
};

export type HotelDeliveryDetails = {
  orderReference: string;
  createdAt: string;
  guestName: string;
  phone: string;
  location: "room" | "pool";
  floor?: string;
  room?: string;
  poolDetails?: string;
  instructions?: string;
};

type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  hotelDelivery: HotelDeliveryDetails | undefined;
  addItem: (product: CartProduct) => void;
  increase: (id: string) => void;
  decrease: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  setHotelDelivery: (details: HotelDeliveryDetails) => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "de-vihelhana-cart";
const HOTEL_DELIVERY_STORAGE_KEY = "de-vihelhana-hotel-delivery";
const priceToNumber = (price: string) => Number(price.replace(/[^0-9.]/g, ""));
export const formatPrice = (amount: number) => "€" + amount.toFixed(2);

const activeProducts = new Map<string, CartProduct>(
  [food, drinks, wines].flat().flatMap((category) => category.items.map((menuItem) => [
    category.id + ":" + menuItem.name,
    {
      id: category.id + ":" + menuItem.name,
      name: menuItem.name,
      price: menuItem.price,
      category: category.title,
      ...(menuItem.description ? { description: menuItem.description } : {}),
    },
  ] as const)),
);

function restoreCurrentCart(serialized: string): CartLine[] {
  try {
    const saved: unknown = JSON.parse(serialized);
    if (!Array.isArray(saved)) return [];

    return saved.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const { id, quantity } = entry as { id?: unknown; quantity?: unknown };
      if (typeof id !== "string") return [];

      const product = activeProducts.get(id);
      const validQuantity = Number(quantity);
      if (!product || !Number.isInteger(validQuantity) || validQuantity < 1 || validQuantity > 50) return [];

      return [{
        ...product,
        unitPrice: priceToNumber(product.price),
        quantity: validQuantity,
      }];
    });
  } catch {
    return [];
  }
}

function persist(items: CartLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Browser storage may be unavailable.
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [hotelDelivery, setHotelDeliveryState] = useState<HotelDeliveryDetails>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(restoreCurrentCart(saved));

      const savedDelivery = localStorage.getItem(HOTEL_DELIVERY_STORAGE_KEY);
      if (savedDelivery) setHotelDeliveryState(JSON.parse(savedDelivery));
    } catch {
      // A malformed local value should not prevent the cart from loading.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (ready) persist(items);
  }, [items, ready]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((count, line) => count + line.quantity, 0),
    subtotal: items.reduce((total, line) => total + line.unitPrice * line.quantity, 0),
    hotelDelivery,
    addItem(product) {
      setItems((current) => {
        const existing = current.find((line) => line.id === product.id);
        const next = existing
          ? current.map((line) => line.id === product.id ? { ...line, quantity: Math.min(line.quantity + 1, 50) } : line)
          : [...current, { ...product, unitPrice: priceToNumber(product.price), quantity: 1 }];
        persist(next);
        return next;
      });
    },
    increase(id) {
      setItems((current) => {
        const next = current.map((line) => line.id === id ? { ...line, quantity: Math.min(line.quantity + 1, 50) } : line);
        persist(next);
        return next;
      });
    },
    decrease(id) {
      setItems((current) => {
        const next = current.flatMap((line) => line.id === id ? (line.quantity === 1 ? [] : [{ ...line, quantity: line.quantity - 1 }]) : [line]);
        persist(next);
        return next;
      });
    },
    remove(id) {
      setItems((current) => {
        const next = current.filter((line) => line.id !== id);
        persist(next);
        return next;
      });
    },
    clear() {
      setItems(() => {
        persist([]);
        return [];
      });
      setHotelDeliveryState(undefined);
      try {
        localStorage.removeItem(HOTEL_DELIVERY_STORAGE_KEY);
      } catch {
        // Browser storage may be unavailable.
      }
    },
    setHotelDelivery(details) {
      setHotelDeliveryState(details);
      try {
        localStorage.setItem(HOTEL_DELIVERY_STORAGE_KEY, JSON.stringify(details));
      } catch {
        // Browser storage may be unavailable.
      }
    },
  }), [items, hotelDelivery]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
