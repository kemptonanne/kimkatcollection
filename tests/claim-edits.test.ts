import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { CLAIM_EDIT_UNSUPPORTED, deleteBagItemRow, writeBagItem } from "../src/lib/sheets.server";

// ---- Fake Apps Script runtime over an in-memory Claims sheet ----
type Cell = { v: string; f?: string };
function loadScript(rows: Cell[][]) {
  const sheet = {
    rows,
    getLastRow: () => rows.length + 1,
    getRange: (r: number, c: number, nr = 1, nc = 1) => ({
      getDisplayValues: () =>
        rows.slice(r - 2, r - 2 + nr).map((row) => row.slice(c - 1, c - 1 + nc).map((x) => x.v)),
      setValues: (vals: string[][]) =>
        vals.forEach((vr, i) => vr.forEach((v, j) => (rows[r - 2 + i]![c - 1 + j] = { v }))),
    }),
    deleteRow: (r: number) => rows.splice(r - 2, 1),
  };
  let locked = false;
  const globals = {
    ContentService: { createTextOutput: (t: string) => ({ setMimeType: () => JSON.parse(t) }), MimeType: {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => "tok" }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => sheet }) },
    LockService: { getScriptLock: () => ({ tryLock: () => !locked, releaseLock: () => {} }) },
    Utilities: { formatDate: () => "1/1/2026" },
    Session: { getScriptTimeZone: () => "UTC" },
  };
  const src = readFileSync("apps-script/BagTrackerAPI.gs", "utf8");
  const api = new Function(...Object.keys(globals), `${src}; return { doPost };`)(
    ...Object.values(globals),
  ) as { doPost: (e: unknown) => { ok: boolean; error?: string } };
  const post = (body: object) =>
    api.doPost({ postData: { contents: JSON.stringify({ token: "tok", ...body }) } });
  return { post, rows, setLocked: (v: boolean) => (locked = v) };
}
const claim = (item: string, date = "5/1/2026"): Cell[] =>
  [{ v: "1" }, { v: "Co" }, { v: item }, { v: "10" }, { v: "1" }, { v: "10", f: "=D*E" }, { v: date }];
const exp = (item: string, date = "5/1/2026") =>
  ({ bagNumber: "1", companyName: "Co", item, price: "10", qty: "1", dateClaimed: date });

describe("Apps Script claim edits", () => {
  test("edits only the referenced duplicate-description row and keeps date + total formula", () => {
    const s = loadScript([claim("Ring", "5/1/2026"), claim("Ring", "5/2/2026")]);
    expect(s.post({ action: "updateItem", sheetRow: 3, expected: exp("Ring", "5/2/2026"), companyName: "Co", item: "Gold ring", price: "12", qty: "1" }).ok).toBe(true);
    expect(s.rows[0]![2]!.v).toBe("Ring");
    expect(s.rows[1]![2]!.v).toBe("Gold ring");
    expect(s.rows[1]![5]).toEqual({ v: "10", f: "=D*E" });
    expect(s.rows[1]![6]!.v).toBe("5/2/2026");
    expect(s.rows.length).toBe(2);
  });
  test("rejects identical duplicates as ambiguous", () => {
    const s = loadScript([claim("Ring"), claim("Ring")]);
    const r = s.post({ action: "deleteClaim", sheetRow: 2, expected: exp("Ring") });
    expect(r.ok).toBe(false);
    expect(s.rows.length).toBe(2);
  });
  test("rejects stale data after the row shifted", () => {
    const s = loadScript([claim("Necklace"), claim("Ring")]);
    s.rows.splice(0, 1); // someone deleted row 2 meanwhile
    const r = s.post({ action: "updateItem", sheetRow: 3, expected: exp("Ring"), item: "X" });
    expect(r.ok).toBe(false);
    expect(s.rows[0]![2]!.v).toBe("Ring");
  });
  test("rejects while another edit holds the lock", () => {
    const s = loadScript([claim("Ring")]);
    s.setLocked(true);
    expect(s.post({ action: "deleteClaim", sheetRow: 2, expected: exp("Ring") }).ok).toBe(false);
    expect(s.rows.length).toBe(1);
  });
});

// ---- Server client against a fake deployment ----
describe("server claim writes", () => {
  const calls: Record<string, unknown>[] = [];
  const realFetch = globalThis.fetch;
  let reply: object = { ok: true };
  beforeEach(() => {
    process.env["BAG_API_URL"] = "https://example.test/exec";
    process.env["BAG_API_TOKEN"] = "tok";
    calls.length = 0;
    globalThis.fetch = (async (_u: unknown, init?: RequestInit) => {
      calls.push(JSON.parse(String(init?.body ?? "{}")));
      return new Response(JSON.stringify(reply), { status: 200 });
    }) as typeof fetch;
  });
  afterEach(() => (globalThis.fetch = realFetch));

  test("old deployment without updateItem fails closed with one call and no delete/add", async () => {
    reply = { ok: false, error: "Unknown action: updateItem" };
    await expect(writeBagItem(3, exp("Ring"), { companyName: "Co", item: "X", price: "1", qty: "1" })).rejects.toThrow(CLAIM_EDIT_UNSUPPORTED);
    expect(calls.map((c) => c["action"])).toEqual(["updateItem"]);
  });
  test("missing stable row id never calls the script", async () => {
    await expect(deleteBagItemRow(null, exp("Ring"))).rejects.toThrow(CLAIM_EDIT_UNSUPPORTED);
    expect(calls.length).toBe(0);
  });
  test("stale rejection surfaces and is not retried", async () => {
    reply = { ok: false, error: "Claim changed since it was loaded. Refresh and try again." };
    await expect(writeBagItem(2, exp("Ring"), { companyName: "Co", item: "X", price: "1", qty: "1" })).rejects.toThrow("changed since");
    expect(calls.length).toBe(1);
    expect(calls[0]).toMatchObject({ sheetRow: 2, expected: exp("Ring") });
  });
});
