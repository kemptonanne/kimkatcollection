export function money(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : (value ?? 0);
  if (!Number.isFinite(n)) return "$0.00";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function parseMoney(value: string | null | undefined): number {
  if (!value) return 0;
  const n = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export const PAYMENT_LINKS = [
  { name: "Venmo", handle: "Kim-Kempton", url: "https://venmo.com/Kim-Kempton" },
  { name: "Cash App", handle: "$KimKat0707", url: "https://cash.app/$KimKat0707" },
  {
    name: "PayPal",
    handle: "kimberlykempton77",
    url: "https://www.paypal.com/paypalme/kimberlykempton77",
  },
] as const;

export const SIGNUP_FORM_URL = "https://forms.gle/D56V8iAxyrtbjczL7";

export const BAG_STATUSES = ["Open", "Active", "Hold", "Closed"] as const;
export type BagStatus = (typeof BAG_STATUSES)[number];
