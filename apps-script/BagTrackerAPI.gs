/**
 * Kim Kat Collection — Bag Tracker API
 * ------------------------------------
 * Paste this into the Apps Script project bound to the Bag Tracker sheet,
 * then Deploy → Manage deployments → Edit → New version.
 *
 * Token lives in Project Settings → Script Properties as SECRET_TOKEN.
 *
 * GET  ?action=getBag&bagNumber=1   → { ok, bag, items }   (fast single call)
 * GET  ?action=getAllItems          → { ok, items }        (whole Claims tab)
 * GET  ?action=getBags              → { ok, bags }
 * GET  ?action=getBagItems&bagNumber=1 → { ok, items }
 * POST { action: 'updateBag' | 'addItem' | 'deleteItem', ... }
 */

const SHEET_NAMES = { BAGS: 'Bags', CLAIMS: 'Claims' };

const BAGS_COLS = {
  BAG_NUM: 1, TIKTOK: 2, NAME: 3, TOTAL: 4,
  PAYMENTS: 5, BALANCE_DUE: 6, DUE_DATE: 7, STATUS: 8,
};

const CLAIMS_COLS = {
  BAG_NUM: 1, COMPANY_NAME: 2, ITEM: 3, PRICE: 4, QTY: 5, TOTAL: 6, DATE_CLAIMED: 7,
};

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function checkToken_(token) {
  const expected = PropertiesService.getScriptProperties().getProperty('SECRET_TOKEN');
  return Boolean(expected) && token === expected;
}

function sheet_(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function text_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'M/d/yyyy');
  return v === null || v === undefined ? '' : String(v).trim();
}

function readBags_() {
  const sh = sheet_(SHEET_NAMES.BAGS);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const rows = sh.getRange(2, 1, last - 1, 8).getDisplayValues();
  return rows
    .filter(function (r) { return text_(r[BAGS_COLS.BAG_NUM - 1]) !== ''; })
    .map(function (r) {
      return {
        bagNumber: text_(r[BAGS_COLS.BAG_NUM - 1]),
        tiktokHandle: text_(r[BAGS_COLS.TIKTOK - 1]),
        customerName: text_(r[BAGS_COLS.NAME - 1]),
        bagTotal: text_(r[BAGS_COLS.TOTAL - 1]),
        paymentsReceived: text_(r[BAGS_COLS.PAYMENTS - 1]),
        balanceDue: text_(r[BAGS_COLS.BALANCE_DUE - 1]),
        dueDate: text_(r[BAGS_COLS.DUE_DATE - 1]),
        status: text_(r[BAGS_COLS.STATUS - 1]),
      };
    });
}

function readClaims_(bagNumber) {
  const sh = sheet_(SHEET_NAMES.CLAIMS);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const rows = sh.getRange(2, 1, last - 1, 7).getDisplayValues();
  const wanted = bagNumber === undefined || bagNumber === null ? null : String(bagNumber).trim().toLowerCase();
  const out = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var num = text_(r[CLAIMS_COLS.BAG_NUM - 1]);
    if (text_(r[CLAIMS_COLS.ITEM - 1]) === '') continue;
    if (wanted !== null && num.toLowerCase() !== wanted) continue;
    out.push({
      bagNumber: num,
      companyName: text_(r[CLAIMS_COLS.COMPANY_NAME - 1]),
      item: text_(r[CLAIMS_COLS.ITEM - 1]),
      price: text_(r[CLAIMS_COLS.PRICE - 1]),
      qty: text_(r[CLAIMS_COLS.QTY - 1]),
      total: text_(r[CLAIMS_COLS.TOTAL - 1]),
      dateClaimed: text_(r[CLAIMS_COLS.DATE_CLAIMED - 1]),
    });
  }
  return out;
}

function findBag_(bagNumber) {
  const wanted = String(bagNumber).trim().toLowerCase();
  const bags = readBags_();
  for (var i = 0; i < bags.length; i++) {
    if (bags[i].bagNumber.toLowerCase() === wanted) return bags[i];
  }
  return null;
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (!checkToken_(p.token)) return json_({ ok: false, error: 'Unauthorized' });

  switch (p.action) {
    case 'getBag': {
      const bag = findBag_(p.bagNumber || '');
      return json_({ ok: true, bag: bag, items: bag ? readClaims_(bag.bagNumber) : [] });
    }
    case 'getAllItems':
      return json_({ ok: true, items: readClaims_(null) });
    case 'getBags':
      return json_({ ok: true, bags: readBags_() });
    case 'getBagItems':
      return json_({ ok: true, items: readClaims_(p.bagNumber || '') });
    default:
      return json_({ ok: false, error: 'Unknown action: ' + String(p.action) });
  }
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) {}
  if (!checkToken_(body.token)) return json_({ ok: false, error: 'Unauthorized' });

  switch (body.action) {
    case 'updateBag': {
      const sh = sheet_(SHEET_NAMES.BAGS);
      const last = sh.getLastRow();
      const nums = last < 2 ? [] : sh.getRange(2, BAGS_COLS.BAG_NUM, last - 1, 1).getDisplayValues();
      const wanted = String(body.bagNumber).trim().toLowerCase();
      for (var i = 0; i < nums.length; i++) {
        if (text_(nums[i][0]).toLowerCase() === wanted) {
          var row = i + 2;
          if (body.paymentsReceived !== undefined) sh.getRange(row, BAGS_COLS.PAYMENTS).setValue(body.paymentsReceived);
          if (body.dueDate !== undefined) sh.getRange(row, BAGS_COLS.DUE_DATE).setValue(body.dueDate);
          if (body.status !== undefined) sh.getRange(row, BAGS_COLS.STATUS).setValue(body.status);
          return json_({ ok: true });
        }
      }
      return json_({ ok: false, error: 'Bag not found: ' + String(body.bagNumber) });
    }
    case 'addItem': {
      const sh = sheet_(SHEET_NAMES.CLAIMS);
      sh.appendRow([
        body.bagNumber, body.companyName || '', body.item || '',
        body.price || '', body.qty || 1, '',
        Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'M/d/yyyy'),
      ]);
      return json_({ ok: true });
    }
    case 'deleteItem': {
      const sh = sheet_(SHEET_NAMES.CLAIMS);
      const last = sh.getLastRow();
      if (last < 2) return json_({ ok: false, error: 'No claims' });
      const rows = sh.getRange(2, 1, last - 1, 7).getDisplayValues();
      for (var j = 0; j < rows.length; j++) {
        var r = rows[j];
        if (
          text_(r[CLAIMS_COLS.BAG_NUM - 1]).toLowerCase() === String(body.bagNumber).trim().toLowerCase() &&
          text_(r[CLAIMS_COLS.ITEM - 1]) === text_(body.item)
        ) {
          sh.deleteRow(j + 2);
          return json_({ ok: true });
        }
      }
      return json_({ ok: false, error: 'Item not found' });
    }
    default:
      return json_({ ok: false, error: 'Unknown action: ' + String(body.action) });
  }
}
