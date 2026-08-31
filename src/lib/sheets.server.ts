/**
 * Server-only Google Sheets access for the live-sale bag tracker.
 * Auth: Google service account (JWT -> OAuth access token), no connector needed.
 *
 * Bags tab columns:  A Bag # | B TikTok Handle | C Customer Name | D Bag Total
 *                    E Payments Received | F Remaining Balance | G Due Date | H Status
 * Only E, G and H are ever written to — the rest are sheet formulas.
 *
 * Bag Items tab:     A Bag # | B Item Description | C Price | D Date Added
 */

const API = "https://sheets.googleapis.com/v4";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

const BAGS_TAB = "Bags";
const ITEMS_TAB = "Bag Items";

export type BagRow = {
  rowNumber: number;
  bagNumber: string;
  tiktokHandle: string;
  customerName: string;
  bagTotal: string;
  paymentsReceived: string;
  remainingBalance: string;
  dueDate: string;
  status: string;
};

export type BagItemRow = {
  rowNumber: number;
  bagNumber: string;
  description: string;
  price: string;
  dateAdded: string;
};

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. The Google Sheets service account is not configured.`);
  return value;
}

// ---------- Service account auth (edge-safe, Web Crypto only) ----------

type ServiceAccount = { client_email: string; private_key: string };

let cachedToken: { token: string; expiresAt: number } | null = null;
let cachedKey: CryptoKey | null = null;

function serviceAccount(): ServiceAccount {
  // Fallback: two separate secrets instead of the full JSON blob.
  const email = process.env["GOOGLE_SHEETS_CLIENT_EMAIL"];
  const key = process.env["GOOGLE_SHEETS_PRIVATE_KEY"];
  if (email && key) {
    return { client_email: email, private_key: key.replace(/\\n/g, "\n") };
  }

  const raw = env("GOOGLE_SHEETS_SERVICE_ACCOUNT").trim();
  let parsed: Partial<ServiceAccount>;
  try {
    parsed = JSON.parse(raw) as Partial<ServiceAccount>;
  } catch {
    throw new Error(
      `GOOGLE_SHEETS_SERVICE_ACCOUNT is not valid JSON (got ${raw.length} characters). Paste the full service account key file contents.`,
    );
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("GOOGLE_SHEETS_SERVICE_ACCOUNT is missing client_email or private_key.");
  }

  return { client_email: parsed.client_email, private_key: parsed.private_key };
}

function base64Url(data: string | ArrayBuffer): string {
  const bytes =
    typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  cachedKey = await crypto.subtle.importKey(
    "pkcs8",
    bytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return cachedKey;
}

async function accessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) return cachedToken.token;

  const sa = serviceAccount();
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(
    JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }),
  );
  const unsigned = `${header}.${claims}`;
  const key = await importPrivateKey(sa.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${base64Url(signature)}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  if (!response.ok) {
    const body = await response.text();
    console.error(`Google token exchange failed [${response.status}]: ${body}`);
    throw new Error(`Google token exchange failed [${response.status}]: ${body}`);
  }
  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("Google token exchange returned no access token.");
  cachedToken = { token: data.access_token, expiresAt: now + (data.expires_in ?? 3600) };
  return cachedToken.token;
}

// ---------- Sheets API ----------

async function sheetsFetch(path: string, init?: RequestInit): Promise<unknown> {
  const token = await accessToken();
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Google Sheets request failed [${response.status}]: ${body}`);
    throw new Error(`Google Sheets request failed [${response.status}]: ${body}`);
  }

  return response.json();
}

function sheetId(): string {
  return env("BAGS_SHEET_ID");
}

function cell(row: string[] | undefined, index: number): string {
  return (row?.[index] ?? "").toString().trim();
}

export async function readBags(): Promise<BagRow[]> {
  const data = (await sheetsFetch(`/spreadsheets/${sheetId()}/values/${BAGS_TAB}!A2:H1000`)) as {
    values?: string[][];
  };
  return (data.values ?? [])
    .map((row, i) => ({
      rowNumber: i + 2,
      bagNumber: cell(row, 0),
      tiktokHandle: cell(row, 1),
      customerName: cell(row, 2),
      bagTotal: cell(row, 3),
      paymentsReceived: cell(row, 4),
      remainingBalance: cell(row, 5),
      dueDate: cell(row, 6),
      status: cell(row, 7),
    }))
    .filter((bag) => bag.bagNumber !== "");
}

export async function readBagItems(bagNumber?: string): Promise<BagItemRow[]> {
  const data = (await sheetsFetch(`/spreadsheets/${sheetId()}/values/${ITEMS_TAB}!A2:D2000`)) as {
    values?: string[][];
  };
  const rows = (data.values ?? [])
    .map((row, i) => ({
      rowNumber: i + 2,
      bagNumber: cell(row, 0),
      description: cell(row, 1),
      price: cell(row, 2),
      dateAdded: cell(row, 3),
    }))
    .filter((item) => item.bagNumber !== "" || item.description !== "");

  return bagNumber ? rows.filter((item) => item.bagNumber === bagNumber) : rows;
}

/** Writes only the three editable Bags columns for one row. */
export async function writeBagEditableFields(
  rowNumber: number,
  fields: { paymentsReceived: string; dueDate: string; status: string },
): Promise<void> {
  await sheetsFetch(`/spreadsheets/${sheetId()}/values:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "USER_ENTERED",
      data: [
        { range: `${BAGS_TAB}!E${rowNumber}`, values: [[fields.paymentsReceived]] },
        { range: `${BAGS_TAB}!G${rowNumber}`, values: [[fields.dueDate]] },
        { range: `${BAGS_TAB}!H${rowNumber}`, values: [[fields.status]] },
      ],
    }),
  });
}

export async function appendBagItem(item: {
  bagNumber: string;
  description: string;
  price: string;
  dateAdded: string;
}): Promise<void> {
  await sheetsFetch(
    `/spreadsheets/${sheetId()}/values/${ITEMS_TAB}!A:D:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      body: JSON.stringify({
        values: [[item.bagNumber, item.description, item.price, item.dateAdded]],
      }),
    },
  );
}

export async function writeBagItem(
  rowNumber: number,
  item: { bagNumber: string; description: string; price: string; dateAdded: string },
): Promise<void> {
  await sheetsFetch(
    `/spreadsheets/${sheetId()}/values/${ITEMS_TAB}!A${rowNumber}:D${rowNumber}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      body: JSON.stringify({
        values: [[item.bagNumber, item.description, item.price, item.dateAdded]],
      }),
    },
  );
}

async function tabGid(title: string): Promise<number> {
  const data = (await sheetsFetch(
    `/spreadsheets/${sheetId()}?fields=sheets(properties(sheetId,title))`,
  )) as { sheets?: { properties?: { sheetId?: number; title?: string } }[] };
  const match = data.sheets?.find((s) => s.properties?.title === title);
  if (!match?.properties || typeof match.properties.sheetId !== "number") {
    throw new Error(`Sheet tab "${title}" was not found in the spreadsheet.`);
  }
  return match.properties.sheetId;
}

export async function deleteBagItemRow(rowNumber: number): Promise<void> {
  const gid = await tabGid(ITEMS_TAB);
  await sheetsFetch(`/spreadsheets/${sheetId()}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: gid,
              dimension: "ROWS",
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        },
      ],
    }),
  });
}
