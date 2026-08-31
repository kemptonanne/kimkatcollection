/**
 * Server-only Google Sheets access for the live-sale bag tracker.
 * Read/write goes through the Lovable connector gateway.
 *
 * Bags tab columns:  A Bag # | B TikTok Handle | C Customer Name | D Bag Total
 *                    E Payments Received | F Remaining Balance | G Due Date | H Status
 * Only E, G and H are ever written to — the rest are sheet formulas.
 *
 * Bag Items tab:     A Bag # | B Item Description | C Price | D Date Added
 */

const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

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
  if (!value) throw new Error(`Missing ${name}. The Google Sheets connection is not configured.`);
  return value;
}

async function sheetsFetch(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env("LOVABLE_API_KEY")}`,
      "X-Connection-Api-Key": env("GOOGLE_SHEETS_API_KEY"),
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
