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
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line): line is CartLine =>
        line != null &&
        typeof line === "object" &&
        typeof line.id === "string" &&
        typeof line.title === "string" &&
        typeof line.price === "number" &&
        Number.isFinite(line.price) &&
        line.price >= 0 &&
        Number.isSafeInteger(line.quantity) &&
        line.quantity > 0 &&
        (line.image === null || typeof line.image === "string"),
    );
  } catch {
    return [];
  }
}

function commit(next: CartLine[]) {
  lines = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // The current cart still works when browser storage is unavailable or full.
    }
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
