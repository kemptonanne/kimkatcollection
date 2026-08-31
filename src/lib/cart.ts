import { useSyncExternalStore } from "react";

export type CartLine = {
  id: string;
  title: string;
  price: number;
  image: string | null;
  quantity: number;
};

const KEY = "kimkat-cart-v1";
let lines: CartLine[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function read(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function commit(next: CartLine[]) {
  lines = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  if (!hydrated) {
    hydrated = true;
    lines = read();
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const EMPTY: CartLine[] = [];

export function useCart(): CartLine[] {
  return useSyncExternalStore(
    subscribe,
    () => lines,
    () => EMPTY,
  );
}

export function addToCart(line: Omit<CartLine, "quantity">, quantity = 1) {
  const existing = lines.find((l) => l.id === line.id);
  commit(
    existing
      ? lines.map((l) => (l.id === line.id ? { ...l, quantity: l.quantity + quantity } : l))
      : [...lines, { ...line, quantity }],
  );
}

export function setQuantity(id: string, quantity: number) {
  commit(
    quantity <= 0
      ? lines.filter((l) => l.id !== id)
      : lines.map((l) => (l.id === id ? { ...l, quantity } : l)),
  );
}

export function removeFromCart(id: string) {
  commit(lines.filter((l) => l.id !== id));
}

export function clearCart() {
  commit([]);
}

export function cartTotal(items: CartLine[]): number {
  return items.reduce((sum, l) => sum + l.price * l.quantity, 0);
}

export function cartCount(items: CartLine[]): number {
  return items.reduce((sum, l) => sum + l.quantity, 0);
}
