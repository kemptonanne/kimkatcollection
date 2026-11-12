import { JWT } from "google-auth-library";

type BagRow = {
  bagNumber: string;
  bagTotal: string;
  balanceDue: string;
  dueDate: string;
  status: string;
};

type BagItemRow = {
  item: string;
  price: string;
  qty: string;
  total: string;
  dateClaimed: string;
};

function asText(value: unknown): string {
  return (value ?? "").toString().trim();
}

const CACHE_TTL_MS = 30_000;
let lookupCache: { at: number; promise: ReturnType<typeof readLookupSheets> } | undefined;

function cachedLookupSheets() {
  if (lookupCache && Date.now() - lookupCache.at < CACHE_TTL_MS) return lookupCache.promise;

  const promise = readLookupSheets().catch((error: unknown) => {
    if (lookupCache?.promise === promise) lookupCache = undefined;
    throw error;
  });
  lookupCache = { at: Date.now(), promise };
  return promise;
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

  const { bags, claims } = await cachedLookupSheets();
  const row = bags.find(([number]) => asText(number).toLowerCase() === needle);
  if (!row) return null;

  const [number, , , bagTotal, , balanceDue, dueDate, status] = row;
  const bag = {
    bagNumber: asText(number),
    bagTotal: asText(bagTotal),
    balanceDue: asText(balanceDue),
    dueDate: asText(dueDate),
    status: asText(status),
  };

  const items: BagItemRow[] = [];
  for (const [number, , item, price, qty, total, dateClaimed] of claims) {
    const description = asText(item);
    if (asText(number).toLowerCase() !== needle || !description) continue;
    items.push({
      item: description,
      price: asText(price),
      qty: asText(qty) || "1",
      total: asText(total),
      dateClaimed: asText(dateClaimed),
    });
  }
  return { bag, items };
}
