/**
 * RevAuto: Google Sheet backend for the website.
 *  - saves every booking request to the "Bookings" tab (status, notes, reference number)
 *  - records anonymous site activity to the "Events" tab (visits, WhatsApp/Call taps, chatbot questions)
 *  - serves the private dashboard (website /pit/), only with the admin passcode
 *
 * The passcode lives in Project Settings > Script properties as ADMIN_KEY. It is never in the website's code.
 * Setup steps: see SETUP.md next to this file.
 */

const TABS = {
  Bookings: ["Reference", "Received", "Name", "Phone", "Email", "Vehicle", "Service", "Insurance claim", "Preferred date", "Preferred time", "Details", "Status", "Notes", "Source"],
  Events: ["Time", "Type", "Detail", "Visitor", "Session", "Source", "Referrer", "Device", "Page"],
};
const STATUSES = ["New", "Confirmed", "Done", "Cancelled", "No-show"];
const EVENT_TYPES = ["visit", "wa", "call", "book", "chat_open", "chat_q", "chat_miss", "ig", "fb", "directions"];
const COL = { ref: 1, received: 2, status: 12, notes: 13 };

// ---------- one-time setup (run from the editor)
function setup() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(TABS).forEach((name) => {
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    const head = TABS[name];
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight("bold").setBackground("#1a1a19").setFontColor("#f5d27a");
    sh.setFrozenRows(1);
  });
  const b = ss.getSheetByName("Bookings");
  b.getRange(2, COL.status, 1000, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build());
  const rules = [["New", "#fff4d6"], ["Confirmed", "#dff3df"], ["Cancelled", "#f8dddd"], ["No-show", "#f8dddd"]].map(([v, c]) =>
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(v).setBackground(c).setRanges([b.getRange(2, COL.status, 1000, 1)]).build());
  b.setConditionalFormatRules(rules);
  [130, 150, 150, 120, 180, 170, 170, 110, 110, 150, 320, 100, 220, 90].forEach((w, i) => b.setColumnWidth(i + 1, w));
  const first = ss.getSheetByName("Sheet1"); if (first && first.getLastRow() === 0 && ss.getSheets().length > 2) ss.deleteSheet(first);
  if (!PropertiesService.getScriptProperties().getProperty("ADMIN_KEY")) Logger.log("Now add ADMIN_KEY in Project Settings > Script properties.");
  Logger.log("Setup done.");
}

// ---------- web endpoints
function doGet() { return json({ ok: true, service: "revauto" }); }

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: "bad request" }); }
  try {
    if (body.kind === "booking") return json(saveBooking(body));
    if (body.kind === "event") return json(saveEvent(body));
    if (body.kind === "admin") return json(admin(body));
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: "server" });
  }
  return json({ ok: false, error: "unknown" });
}

// ---------- bookings
function saveBooking(d) {
  if (d.botcheck) return { ok: true };                                  // honeypot: pretend it worked
  const name = clean(d.name, 80), phone = clean(d.phone, 30), vehicle = clean(d.vehicle, 80);
  if (!name || !phone || !vehicle) return { ok: false, error: "missing" };
  if (!allow("book:" + (clean(d.visitor, 20) || phone), 5, 3600)) return { ok: false, error: "slow down" };
  if (!allow("book:all", 60, 3600)) return { ok: false, error: "slow down" };   // site-wide cap: a spammer can fake visitor IDs
  const tz = Session.getScriptTimeZone(), now = new Date();
  const ref = "RA-" + Utilities.formatDate(now, tz, "MMdd") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  const row = [ref, now, name, phone, clean(d.email, 120), vehicle, clean(d.service, 60), d.insurance ? "Yes" : "No",
    clean(d.date, 10), clean(d.time, 40), clean(d.details, 1500), "New", "", clean(d.source, 30)];
  withLock(() => sheet("Bookings").appendRow(row.map(safeCell)));
  return { ok: true, ref };
}

// ---------- analytics events
function saveEvent(d) {
  const type = String(d.type || "");
  if (EVENT_TYPES.indexOf(type) < 0) return { ok: false };
  if (!allow("ev:" + (clean(d.visitor, 20) || "anon"), 80, 600)) return { ok: false, error: "slow down" };
  if (!allow("ev:all", 2000, 3600)) return { ok: false, error: "slow down" };   // site-wide cap keeps the Sheet from being flooded
  const row = [new Date(), type, clean(d.detail, 300), clean(d.visitor, 20), clean(d.session, 20), clean(d.source, 30) || "direct",
    clean(d.ref, 80), clean(d.device, 10), clean(d.page, 60)];
  withLock(() => sheet("Events").appendRow(row.map(safeCell)));
  return { ok: true };
}

// ---------- private dashboard
function admin(d) {
  const gate = checkKey(d.key);
  if (gate !== true) return { ok: false, error: gate };
  if (d.action === "status") return setStatus(d.ref, d.status, d.notes);
  const days = [7, 30, 90, 365].indexOf(Number(d.days)) >= 0 ? Number(d.days) : 30;
  return { ok: true, sheetUrl: SpreadsheetApp.getActive().getUrl(), tz: Session.getScriptTimeZone(), days, bookings: listBookings(), stats: stats(days) };
}

function checkKey(key) {
  const cache = CacheService.getScriptCache(), fails = Number(cache.get("fails") || 0);
  if (fails >= 8) return "locked";                                      // 8 wrong tries -> 15 minute lockout
  const real = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY");
  if (!real || real.length < 8) return "not set up";
  if (String(key || "") === real) return true;
  cache.put("fails", String(fails + 1), 900);
  return "wrong";
}

function listBookings() {
  const sh = sheet("Bookings"), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const tz = Session.getScriptTimeZone(), take = Math.min(n, 500);
  return sh.getRange(sh.getLastRow() - take + 1, 1, take, TABS.Bookings.length).getValues().reverse().map((r) => ({
    ref: String(r[0]), received: iso(r[1]), name: String(r[2]), phone: String(r[3]), email: String(r[4]), vehicle: String(r[5]),
    service: String(r[6]), insurance: r[7] === "Yes", date: r[8] instanceof Date ? Utilities.formatDate(r[8], tz, "yyyy-MM-dd") : String(r[8]),
    time: String(r[9]), details: String(r[10]), status: String(r[11] || "New"), notes: String(r[12]), source: String(r[13]),
  }));
}

function setStatus(ref, status, notes) {
  if (STATUSES.indexOf(status) < 0) return { ok: false, error: "bad status" };
  const sh = sheet("Bookings"), n = sh.getLastRow() - 1;
  if (n < 1) return { ok: false, error: "not found" };
  const refs = sh.getRange(2, COL.ref, n, 1).getValues();
  for (let i = refs.length - 1; i >= 0; i--) {
    if (String(refs[i][0]) === String(ref)) {
      withLock(() => {
        sh.getRange(i + 2, COL.status).setValue(status);
        if (typeof notes === "string") sh.getRange(i + 2, COL.notes).setValue(safeCell(clean(notes, 500)));
      });
      return { ok: true };
    }
  }
  return { ok: false, error: "not found" };
}

// Aggregates the Events + Bookings tabs for the current period and the one before it (for "vs last period").
function stats(days) {
  const tz = Session.getScriptTimeZone(), DAY = 86400000;
  const todayKey = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  const keys = [];                                                       // calendar days in the period, oldest first
  for (let i = days - 1; i >= 0; i--) keys.push(Utilities.formatDate(new Date(Date.now() - i * DAY), tz, "yyyy-MM-dd"));
  const startKey = keys[0], prevStartKey = Utilities.formatDate(new Date(Date.now() - (2 * days - 1) * DAY), tz, "yyyy-MM-dd");
  const period = (k) => (k >= startKey && k <= todayKey ? "cur" : k >= prevStartKey && k < startKey ? "prev" : null);
  const blank = () => ({ visits: 0, visitors: {}, taps: {} });
  const S = { cur: blank(), prev: blank() }, perDay = {}, perDayVisitors = {}, sources = {}, devices = {}, chat = [];
  keys.forEach((k) => { perDay[k] = 0; perDayVisitors[k] = {}; });

  const ev = sheet("Events"), n = ev.getLastRow() - 1;
  if (n > 0) {
    const take = Math.min(n, 60000);
    ev.getRange(ev.getLastRow() - take + 1, 1, take, TABS.Events.length).getValues().forEach((r) => {
      if (!(r[0] instanceof Date)) return;
      const k = Utilities.formatDate(r[0], tz, "yyyy-MM-dd"), p = period(k);
      if (!p) return;
      const type = String(r[1]), b = S[p];
      b.taps[type] = (b.taps[type] || 0) + 1;
      if (type === "visit") {
        b.visits++; b.visitors[r[3]] = 1;
        if (p === "cur") {
          perDay[k]++; perDayVisitors[k][r[3]] = 1;
          const src = String(r[5] || "direct"); sources[src] = (sources[src] || 0) + 1;
          const dev = String(r[7] || "unknown"); devices[dev] = (devices[dev] || 0) + 1;
        }
      }
      if (p === "cur" && (type === "chat_q" || type === "chat_miss")) chat.push({ at: iso(r[0]), q: String(r[2]), answered: type === "chat_q" });
    });
  }

  const bookings = { cur: 0, prev: 0, byService: {}, insurance: 0 };
  listBookings().forEach((x) => {
    const k = x.received.slice(0, 10), p = period(k);
    if (!p) return;
    bookings[p]++;
    if (p === "cur") { bookings.byService[x.service || "Other"] = (bookings.byService[x.service || "Other"] || 0) + 1; if (x.insurance) bookings.insurance++; }
  });

  const pack = (b) => ({ visits: b.visits, visitors: Object.keys(b.visitors).length, taps: b.taps });
  return {
    cur: pack(S.cur), prev: pack(S.prev),
    daily: keys.map((k) => ({ day: k, visits: perDay[k], visitors: Object.keys(perDayVisitors[k]).length })),
    sources, devices, bookings, chat: chat.reverse().slice(0, 60),
  };
}

// ---------- helpers
function sheet(name) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.getRange(1, 1, 1, TABS[name].length).setValues([TABS[name]]).setFontWeight("bold"); sh.setFrozenRows(1); }
  return sh;
}
function clean(v, max) { return String(v == null ? "" : v).replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, max); }
function safeCell(v) { return typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v; }   // no formula injection
function iso(v) { return v instanceof Date ? Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm") : String(v || ""); }
function withLock(fn) { const l = LockService.getScriptLock(); l.waitLock(10000); try { fn(); } finally { l.releaseLock(); } }
function allow(key, max, seconds) {
  const c = CacheService.getScriptCache(), n = Number(c.get(key) || 0);
  if (n >= max) return false;
  c.put(key, String(n + 1), seconds);
  return true;
}
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
