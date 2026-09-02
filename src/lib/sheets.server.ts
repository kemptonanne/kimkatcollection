/**
 * Server-only access to the live-sale bag tracker via a Google Apps Script
 * Web App API (fetch-based, no Lovable connector, no Supabase).
 *
 * Env vars:
 *   BAG_API_URL   — the Apps Script /exec URL
 *   BAG_API_TOKEN — shared secret token required by every endpoint
 *
 * Endpoints used:
 *   GET  ?action=getBag&bagNumber=…&token=…      (fast path: bag + its claims in one call)
 *   GET  ?action=getAllItems&token=…             (fast path: whole Claims tab in one call)
 *   GET  ?action=getBags&token=…
 *   GET  ?action=getBagItems&bagNumber=…&token=…
 *   POST { action: "updateBag", token, bagNumber, paymentsReceived?, dueDate?, status? }
 *   POST { action: "addItem", token, bagNumber, companyName, item, price, qty }
 *   POST { action: "deleteItem", token, bagNumber, companyName, item, price, qty, dateClaimed }
 * All POSTs use Content-Type: text/plain (Apps Script can't handle CORS preflight).
 *
 * The getBag / getAllItems actions only exist in the newer Apps Script version;
 * both calls fall back to the older multi-request path automatically.
 */

export type BagRow = {
  rowNumber: number;
  bagNumber: string;
  tiktokHandle: string;
  customerName: string;
  bagTotal: string;
  paymentsReceived: string;
  balanceDue: string;
  dueDate: string;
  status: string;
};

export type BagItemRow = {
  rowNumber: number;
  bagNumber: string;
  companyName: string;
  item: string;
  price: string;
  qty: string;
  total: string;
  dateClaimed: string;
};

function apiUrl(): string {
  const value = process.env["BAG_API_URL"];
  if (!value) throw new Error("Missing BAG_API_URL. The bag API is not configured.");
  return value;
}

function apiToken(): string {
  const value = process.env["BAG_API_TOKEN"];
  if (!value) throw new Error("Missing BAG_API_TOKEN. The bag API is not configured.");
  return value;
}

function asText(value: unknown): string {
  return (value ?? "").toString().trim();
}

// ---------- Short-lived read cache ----------
// Apps Script responses take ~1-3s, so repeat reads within a few seconds are
// served from memory. Any write clears the cache immediately.

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { at: number; promise: Promise<unknown> }>();

function cachedRead<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.promise as Promise<T>;
  const promise = load().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, { at: Date.now(), promise });
  return promise;
}

function clearBagCache(): void {
  cache.clear();
}

// ---------- Transport ----------

class BagApiError extends Error {
  constructor(
    message: string,
    readonly detail: string,
  ) {
    super(message);
  }
}

async function apiGet<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(apiUrl());
  url.searchParams.set("token", apiToken());
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const started = Date.now();
  const response = await fetch(url.toString(), { redirect: "follow" });
  const elapsed = Date.now() - started;
  console.info(`[bag-api] GET ${params["action"] ?? "?"} → ${response.status} in ${elapsed}ms`);

  if (!response.ok) {
    const body = await response.text();
    console.error(`Bag API request failed [${response.status}]: ${body}`);
    throw new BagApiError(`Bag API request failed [${response.status}]`, body);
  }
  const data = (await response.json()) as { ok?: boolean; error?: string } & T;
  if (data.ok === false) {
    console.error(`Bag API returned an error: ${data.error ?? "unknown"}`);
    throw new BagApiError(`Bag API error: ${data.error ?? "unknown"}`, data.error ?? "");
  }
  return data;
}

/** True when the script rejected the action because it's an older deployment. */
function isUnknownAction(error: unknown): boolean {
  const detail = error instanceof BagApiError ? `${error.message} ${error.detail}` : "";
  return /unknown action|invalid action|unsupported action/i.test(detail);
}

async function apiPost(payload: Record<string, unknown>): Promise<void> {
  const started = Date.now();
  const response = await fetch(apiUrl(), {
    method: "POST",
    redirect: "follow",
    // text/plain avoids a CORS preflight, which Apps Script does not support.
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ ...payload, token: apiToken() }),
  });
  console.info(
    `[bag-api] POST ${String(payload["action"] ?? "?")} → ${response.status} in ${Date.now() - started}ms`,
  );
  if (!response.ok) {
    const body = await response.text();
    console.error(`Bag API write failed [${response.status}]: ${body}`);
    throw new Error(`Bag API write failed [${response.status}]`);
  }
  const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
  if (data && data.ok === false) {
    console.error(`Bag API write returned an error: ${data.error ?? "unknown"}`);
    throw new Error(`Bag API error: ${data.error ?? "unknown"}`);
  }
  clearBagCache();
}

// ---------- Mapping ----------

function toBagRow(bag: Record<string, unknown>, rowNumber: number): BagRow {
  return {
    rowNumber,
    bagNumber: asText(bag["bagNumber"]),
    tiktokHandle: asText(bag["tiktokHandle"]),
    customerName: asText(bag["customerName"]),
    bagTotal: asText(bag["bagTotal"]),
    paymentsReceived: asText(bag["paymentsReceived"]),
    balanceDue: asText(bag["balanceDue"]),
    dueDate: asText(bag["dueDate"]),
    status: asText(bag["status"]),
  };
}

function toItemRow(
  item: Record<string, unknown>,
  rowNumber: number,
  fallbackBagNumber = "",
): BagItemRow {
  return {
    rowNumber,
    bagNumber: asText(item["bagNumber"]) || fallbackBagNumber,
    companyName: asText(item["companyName"]),
    item: asText(item["item"]),
    price: asText(item["price"]),
    qty: asText(item["qty"]) || "1",
    total: asText(item["total"]),
    dateClaimed: asText(item["dateClaimed"]),
  };
}

// ---------- Bags ----------

export async function readBags(): Promise<BagRow[]> {
  return cachedRead("bags", async () => {
    const data = await apiGet<{ bags?: Record<string, unknown>[] }>({ action: "getBags" });
    return (data.bags ?? [])
      .map((bag, i) => toBagRow(bag, i + 2)) // synthetic row number; kept for UI keys
      .filter((bag) => bag.bagNumber !== "");
  });
}

/**
 * Single-call lookup of one bag plus its claims. Falls back to the two-call
 * path when the deployed Apps Script doesn't know the `getBag` action.
 */
export async function readBagWithItems(
  bagNumber: string,
): Promise<{ bag: BagRow; items: BagItemRow[] } | null> {
  const needle = bagNumber.trim().toLowerCase();
  return cachedRead(`bag:${needle}`, async () => {
    try {
      const data = await apiGet<{
        bag?: Record<string, unknown> | null;
        items?: Record<string, unknown>[];
      }>({ action: "getBag", bagNumber });
      if (data.bag) {
        const bagNum = asText(data.bag["bagNumber"]) || bagNumber;
        return {
          // rowNumber is only a UI key on the public page; no extra request for it.
          bag: toBagRow(data.bag, 2),
          items: (data.items ?? [])
            .map((item, i) => toItemRow(item, i + 2, bagNum))
            .filter((item) => item.item !== ""),
        };
      }
      if ("bag" in data) return null; // script answered: no such bag
    } catch (error) {
      if (!isUnknownAction(error)) throw error;
    }

    // Fallback: older deployment — list bags, then that bag's items.
    const bags = await readBags();
    const bag = bags.find((b) => b.bagNumber.toLowerCase() === needle);
    if (!bag) return null;
    return { bag, items: await itemsForBag(bag.bagNumber) };
  });
}

// ---------- Bag items (Claims tab) ----------

export async function readBagItems(bagNumber?: string): Promise<BagItemRow[]> {
  if (bagNumber) return itemsForBag(bagNumber);

  return cachedRead("items:all", async () => {
    // Fast path: whole Claims tab in one request.
    try {
      const data = await apiGet<{ items?: Record<string, unknown>[] }>({ action: "getAllItems" });
      if (data.items) {
        return data.items
          .map((item, i) => toItemRow(item, i + 2))
          .filter((item) => item.item !== "");
      }
    } catch (error) {
      if (!isUnknownAction(error)) throw error;
    }

    // Fallback: older deployment — the API is per-bag, so fetch every bag's items.
    const bags = await readBags();
    const groups = await Promise.all(bags.map((bag) => itemsForBag(bag.bagNumber)));
    let row = 2;
    return groups.flat().map((item) => ({ ...item, rowNumber: row++ }));
  });
}

async function itemsForBag(bagNumber: string): Promise<BagItemRow[]> {
  return cachedRead(`items:${bagNumber.toLowerCase()}`, async () => {
    const data = await apiGet<{ items?: Record<string, unknown>[] }>({
      action: "getBagItems",
      bagNumber,
    });
    return (data.items ?? [])
      .map((item, i) => toItemRow(item, i + 2, bagNumber))
      .filter((item) => item.item !== "");
  });
}

// ---------- Writes ----------

/** Writes only the three editable Bags fields for one bag. */
export async function writeBagEditableFields(
  rowNumber: number,
  fields: { paymentsReceived: string; dueDate: string; status: string },
): Promise<void> {
  const bag = await bagByRowNumber(rowNumber);
  await apiPost({
    action: "updateBag",
    bagNumber: bag.bagNumber,
    paymentsReceived: fields.paymentsReceived,
    dueDate: fields.dueDate,
    status: fields.status,
  });
}

export async function appendBagItem(item: {
  bagNumber: string;
  companyName: string;
  item: string;
  price: string;
  qty: string;
}): Promise<void> {
  await apiPost({
    action: "addItem",
    bagNumber: item.bagNumber,
    companyName: item.companyName,
    item: item.item,
    price: item.price,
    qty: item.qty,
  });
}

export async function writeBagItem(
  rowNumber: number,
  item: { bagNumber: string; companyName: string; item: string; price: string; qty: string },
): Promise<void> {
  // The API has no "edit item" endpoint, so replace the row: delete then re-add.
  const existing = await itemByRowNumber(rowNumber);
  await deleteItemPost(existing);
  await appendBagItem(item);
}

export async function deleteBagItemRow(rowNumber: number): Promise<void> {
  const item = await itemByRowNumber(rowNumber);
  await deleteItemPost(item);
}

async function deleteItemPost(item: BagItemRow): Promise<void> {
  await apiPost({
    action: "deleteItem",
    bagNumber: item.bagNumber,
    companyName: item.companyName,
    item: item.item,
    price: item.price,
    qty: item.qty,
    dateClaimed: item.dateClaimed,
  });
}

// ---------- Row-number lookups (rowNumber is synthetic, assigned by read order) ----------

async function bagByRowNumber(rowNumber: number): Promise<BagRow> {
  const bags = await readBags();
  const bag = bags.find((b) => b.rowNumber === rowNumber);
  if (!bag) throw new Error(`No bag found for row ${rowNumber}. Refresh and try again.`);
  return bag;
}

async function itemByRowNumber(rowNumber: number): Promise<BagItemRow> {
  const items = await readBagItems();
  const item = items.find((i) => i.rowNumber === rowNumber);
  if (!item) throw new Error(`No item found for row ${rowNumber}. Refresh and try again.`);
  return item;
}
