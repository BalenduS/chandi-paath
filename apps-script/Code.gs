/**
 * Chandi Paath — Google Sheets sync
 *
 * Paste this into Extensions → Apps Script of a new Google Sheet, then
 * Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * Copy the web app URL (ends in /exec) into the app's History tab.
 *
 * Sheets it maintains:
 *   History  — one row per day of every round (read this one)
 *   _data    — the app's own copy of each round (do not edit)
 *   _deleted — ids of rounds deleted in the app (do not edit)
 */

var HISTORY = 'History';
var DATA = '_data';
var DELETED = '_deleted';

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'load';
  if (action !== 'load') return json_({ ok: false, error: 'unknown action' });
  return json_({ ok: true, rounds: readRounds_(), deleted: readDeleted_() });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var body = JSON.parse(e.postData.contents || '{}');
    if (body.action !== 'save') return json_({ ok: false, error: 'unknown action' });

    var deleted = mergeDeleted_(readDeleted_(), body.deleted || []);
    var merged = mergeRounds_(readRounds_(), body.rounds || [], deleted);

    writeDeleted_(deleted);
    writeRounds_(merged);
    if (body.rows && body.rows.length) writeHistory_(body.rows);

    return json_({ ok: true, count: merged.length });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- storage ---------- */

function sheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function readRounds_() {
  var sh = sheet_(DATA);
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 3).getValues()
    .filter(function (r) { return r[0] && r[1]; })
    .map(function (r) { try { return JSON.parse(r[1]); } catch (x) { return null; } })
    .filter(Boolean);
}

function writeRounds_(rounds) {
  var sh = sheet_(DATA);
  sh.clearContents();
  var rows = [['id', 'json', 'updatedAt']].concat(rounds.map(function (r) {
    return [r.id, JSON.stringify(r), r.updatedAt || r.createdAt || ''];
  }));
  sh.getRange(1, 1, rows.length, 3).setValues(rows);
}

function readDeleted_() {
  var sh = sheet_(DELETED);
  var last = sh.getLastRow();
  if (last < 1) return [];
  return sh.getRange(1, 1, last, 1).getValues().map(function (r) { return String(r[0]); }).filter(Boolean);
}

function writeDeleted_(ids) {
  var sh = sheet_(DELETED);
  sh.clearContents();
  if (ids.length) sh.getRange(1, 1, ids.length, 1).setValues(ids.map(function (id) { return [id]; }));
}

function writeHistory_(rows) {
  var sh = sheet_(HISTORY);
  sh.clearContents();
  var width = rows[0].length;
  var clean = rows.map(function (r) {
    var out = r.slice(0, width);
    while (out.length < width) out.push('');
    return out.map(function (v) { return v == null ? '' : v; });
  });
  sh.getRange(1, 1, clean.length, width).setValues(clean);
  sh.getRange(1, 1, 1, width).setFontWeight('bold').setBackground('#9B1C1C').setFontColor('#FFFFFF');
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, width);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheets()[0].getName() !== HISTORY) { ss.setActiveSheet(sh); ss.moveActiveSheet(1); }
}

/* ---------- merge ---------- */

function mergeDeleted_(a, b) {
  var seen = {};
  return a.concat(b).filter(function (id) { if (!id || seen[id]) return false; seen[id] = true; return true; });
}

function mergeRounds_(a, b, deleted) {
  var gone = {};
  deleted.forEach(function (id) { gone[id] = true; });
  var by = {};
  a.concat(b).forEach(function (r) {
    if (!r || !r.id || gone[r.id]) return;
    var cur = by[r.id];
    var t = r.updatedAt || r.createdAt || '';
    if (!cur || t > (cur.updatedAt || cur.createdAt || '')) by[r.id] = r;
  });
  return Object.keys(by).map(function (k) { return by[k]; });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
