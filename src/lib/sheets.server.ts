/**
 * Server-only access to the live-sale bag tracker.
 *
 * Public lookup reads Google Sheets using GOOGLE_SHEETS_SPREADSHEET_ID and
 * GOOGLE_SHEETS_CREDENTIALS (service account JSON). The other helpers use the
 * Apps Script web app.
 *
 * Env vars:
 *   BAG_API_URL   — the Apps Script /exec URL
 *   BAG_API_TOKEN — shared secret token required by every endpoint
 *
 * Endpoints used:
 *   GET  ?action=getAllItems&token=…             (fast path: whole Claims tab in one call)
 *   GET  ?action=getBags&token=…
 *   GET  ?action=getBagItems&bagNumber=…&token=…
 *   POST { action: "updateBag", token, bagNumber, paymentsReceived?, dueDate?, status? }
 *   POST { action: "addItem", token, bagNumber, companyName, item, price, qty }
 *   POST { action: "updateItem", token, sheetRow, expected, companyName, item, price, qty }
 *   POST { action: "deleteClaim", token, sheetRow, expected }
 * updateItem/deleteClaim need the newer Apps Script (claims carry `sheetRow`).
 * Against an older deployment edits fail closed: nothing is written.
 * All POSTs use Content-Type: text/plain (Apps Script can't handle CORS preflight).
 *
 * The getAllItems action falls back to per-bag reads on older deployments.
 */

import { JWT } from "google-auth-library";

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
  /** Real spreadsheet row from the newer Apps Script; null on older deployments. */
  sheetRow: number | null;
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
// Repeat reads within 30 seconds share the same promise. Any write clears the cache.

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
    throw new BagApiError(`Bag API write failed [${response.status}]`, body);
  }
  const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
  if (data && data.ok === false) {
    console.error(`Bag API write returned an error: ${data.error ?? "unknown"}`);
    throw new BagApiError(`Bag API error: ${data.error ?? "unknown"}`, data.error ?? "");
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
    sheetRow:
      Number.isInteger(Number(item["sheetRow"])) && Number(item["sheetRow"]) >= 2
        ? Number(item["sheetRow"])
        : null,
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

type SheetValueRange = { values?: unknown[][] };

let sheetsClient: JWT | undefined;

function getSheetsClient(): JWT {
  if (sheetsClient) return sheetsClient;
  const json = process.env["GOOGLE_SHEETS_CREDENTIALS"];
  if (!json) throw new Error("Missing GOOGLE_SHEETS_CREDENTIALS.");

  try {
    const client = new JWT({ scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] });
    client.fromJSON(JSON.parse(json));
    sheetsClient = client;
    return client;
  } catch {
    throw new Error("Invalid GOOGLE_SHEETS_CREDENTIALS.");
  }
}

async function readLookupSheets() {
  const spreadsheetId = process.env["GOOGLE_SHEETS_SPREADSHEET_ID"];
  if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEETS_SPREADSHEET_ID.");

  const client = getSheetsClient();
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchGet`,
  );
  url.searchParams.append("ranges", "Bags!A2:H");
  url.searchParams.append("ranges", "Claims!A2:G");
  url.searchParams.set("valueRenderOption", "FORMATTED_VALUE");

  let valueRanges: SheetValueRange[] | undefined;
  try {
    const { data } = await client.request<{ valueRanges?: SheetValueRange[] }>({
      url: url.toString(),
    });
    valueRanges = data.valueRanges;
  } catch {
    // Auth and HTTP errors can contain request details, including authorization headers.
    throw new Error("Google Sheets bag lookup request failed.");
  }

  const [bags, claims] = valueRanges ?? [];
  if (!bags || !claims) throw new Error("Google Sheets bag lookup returned incomplete ranges.");
  return { bags: bags.values ?? [], claims: claims.values ?? [] };
}

export async function readBagWithItems(
  bagNumber: string,
): Promise<{ bag: BagRow; items: BagItemRow[] } | null> {
  const needle = bagNumber.trim().toLowerCase();
  if (!needle) return null;

  const { bags, claims } = await cachedRead("lookup:sheets", readLookupSheets);
  const bagIndex = bags.findIndex(([number]) => asText(number).toLowerCase() === needle);
  const row = bags[bagIndex];
  if (!row) return null;

  const [
    number,
    tiktokHandle,
    customerName,
    bagTotal,
    paymentsReceived,
    balanceDue,
    dueDate,
    status,
  ] = row;
  const bag = toBagRow(
    {
      bagNumber: number,
      tiktokHandle,
      customerName,
      bagTotal,
      paymentsReceived,
      balanceDue,
      dueDate,
      status,
    },
    bagIndex + 2,
  );

  const items: BagItemRow[] = [];
  for (const [index, claim] of claims.entries()) {
    const [number, companyName, item, price, qty, total, dateClaimed] = claim;
    if (asText(number).toLowerCase() !== needle || !asText(item)) continue;
    items.push(
      toItemRow(
        {
          sheetRow: index + 2,
          bagNumber: number,
          companyName,
          item,
          price,
          qty,
          total,
          dateClaimed,
        },
        items.length + 2,
      ),
    );
  }
  return { bag, items };
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

export type ClaimSnapshot = {
  bagNumber: string;
  companyName: string;
  item: string;
  price: string;
  qty: string;
  dateClaimed: string;
};

export const CLAIM_EDIT_UNSUPPORTED =
  "Editing claims needs the updated Bag Tracker script. Nothing was changed — redeploy the Apps Script, then try again.";

async function claimPost(payload: Record<string, unknown>): Promise<void> {
  try {
    await apiPost(payload);
  } catch (error) {
    clearBagCache();
    if (isUnknownAction(error)) throw new Error(CLAIM_EDIT_UNSUPPORTED);
    const detail = error instanceof BagApiError ? error.detail : "";
    if (/changed since|ambiguous|busy|invalid claim|required/i.test(detail))
      throw new Error(detail);
    throw new Error("Could not save that claim. Nothing was changed — refresh and try again.");
  }
}

function requireSheetRow(sheetRow: number | null): number {
  if (sheetRow === null || !Number.isInteger(sheetRow) || sheetRow < 2) {
    throw new Error(CLAIM_EDIT_UNSUPPORTED);
  }
  return sheetRow;
}

/**
 * Atomic in-place claim edit. The script verifies `expected` still matches the
 * row exactly (and is unique) under a lock, then writes only
 * Company/Item/Price/Qty. Never deletes or re-adds rows.
 */
export async function writeBagItem(
  sheetRow: number | null,
  expected: ClaimSnapshot,
  next: { companyName: string; item: string; price: string; qty: string },
): Promise<void> {
  await claimPost({
    action: "updateItem",
    sheetRow: requireSheetRow(sheetRow),
    expected,
    companyName: next.companyName,
    item: next.item,
    price: next.price,
    qty: next.qty,
  });
}

export async function deleteBagItemRow(
  sheetRow: number | null,
  expected: ClaimSnapshot,
): Promise<void> {
  await claimPost({ action: "deleteClaim", sheetRow: requireSheetRow(sheetRow), expected });
}

// ---------- Row-number lookups (rowNumber is synthetic, assigned by read order) ----------

async function bagByRowNumber(rowNumber: number): Promise<BagRow> {
  const bags = await readBags();
  const bag = bags.find((b) => b.rowNumber === rowNumber);
  if (!bag) throw new Error(`No bag found for row ${rowNumber}. Refresh and try again.`);
  return bag;
}
