import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { CartItem } from "@/types/cart";

const STORAGE_KEY = "kd_cart_v1";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  subtotal: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadCart());

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // stockage indisponible (navigation privée) : on continue en mémoire seulement
    }
  }, []);

  const addItem = useCallback(
    (item: CartItem) => {
      persist([...loadCart(), item]);
    },
    [persist]
  );

  const removeItem = useCallback(
    (id: string) => {
      persist(items.filter((i) => i.id !== id));
    },
    [items, persist]
  );

  const setQuantity = useCallback(
    (id: string, quantity: number) => {
      if (quantity < 1) {
        persist(items.filter((i) => i.id !== id));
        return;
      }
      persist(items.map((i) => (i.id === id ? { ...i, quantity } : i)));
    },
    [items, persist]
  );

  const clear = useCallback(() => persist([]), [persist]);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unit_price_htg * i.quantity, 0),
    [items]
  );
  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const value: CartContextValue = { items, addItem, removeItem, setQuantity, clear, subtotal, count };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans un <CartProvider>");
  return ctx;
}
