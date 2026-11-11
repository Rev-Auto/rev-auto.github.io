/**
 * RevAuto: Google Sheet backend for the website.
 *  - saves every booking request to the "Bookings" tab, with up to 5 photos (kept privately in Google Drive)
 *  - emails the shop instantly, with a one-click "Approve" button; approving emails the customer a confirmation
 *  - records anonymous site activity to the "Events" tab (visits, email/call taps, chatbot questions)
 *  - stores the website's editable content (Website tab of the dashboard) in the "Content" tab, with history
 *  - serves the private dashboard (website /pit/), only with the admin passcode
 *
 * Script properties (Project Settings > Script properties):
 *   ADMIN_KEY      dashboard passcode (required)
 *   SHOP_EMAIL     where booking emails go (default revautosrq@gmail.com)
 *   SITE_URL       the website (default https://ftalla18.github.io/revauto/)
 * Setup steps: see SETUP.md next to this file.
 */

const TABS = {
  Bookings: ["Reference", "Received", "Name", "Phone", "Email", "Vehicle", "Service", "Insurance claim", "Preferred date", "Preferred time", "Details", "Status", "Notes", "Source", "Photos", "Confirmed"],
  Events: ["Time", "Type", "Detail", "Visitor", "Session", "Source", "Referrer", "Device", "Page"],
  Content: ["Website content (managed by the dashboard: please don't edit by hand)"],
  ContentHistory: ["Saved", "Content"],
};
const STATUSES = ["New", "Confirmed", "Done", "Cancelled", "No-show"];
const EVENT_TYPES = ["visit", "wa", "call", "email", "book", "chat_open", "chat_q", "chat_miss", "ig", "fb", "directions"];
const COL = { ref: 1, received: 2, name: 3, email: 5, status: 12, notes: 13, photos: 15, confirmed: 16 };
const MAX_PHOTOS = 5, MAX_PHOTO_CHARS = 2200000;               // ~1.6 MB per photo after compression (the site sends ~300 KB)
const ICONS = ["car", "hammer", "spray", "dent", "bumper", "radio", "search", "star", "spark", "handshake", "shield", "clock", "wrench", "paint", "camera"];

function prop(k, d) { return PropertiesService.getScriptProperties().getProperty(k) || d || ""; }
const SHOP_EMAIL = () => prop("SHOP_EMAIL", "revautosrq@gmail.com");
const SITE_URL = () => prop("SITE_URL", "https://ftalla18.github.io/revauto/");

// ---------- one-time setup (run from the editor; safe to run again after updates)
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
  [130, 150, 150, 120, 180, 170, 170, 110, 110, 150, 320, 100, 220, 90, 220, 170].forEach((w, i) => b.setColumnWidth(i + 1, w));
  ["Content", "ContentHistory"].forEach((n) => ss.getSheetByName(n).hideSheet());
  const first = ss.getSheetByName("Sheet1"); if (first && first.getLastRow() === 0 && ss.getSheets().length > 2) ss.deleteSheet(first);
  photoFolder(); mediaFolder();                                   // creates the Drive folders (and asks for Drive permission)
  if (!prop("APPROVE_SECRET")) PropertiesService.getScriptProperties().setProperty("APPROVE_SECRET", Utilities.getUuid() + Utilities.getUuid());
  if (!prop("ADMIN_KEY")) Logger.log("Now add ADMIN_KEY in Project Settings > Script properties.");
  Logger.log("Setup done. Booking emails go to " + SHOP_EMAIL() + ". Email quota left today: " + MailApp.getRemainingDailyQuota());
}

// ---------- web endpoints
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.a === "content") return json(publicContent());
  if (p.a === "approve") return approvePage(p.ref, p.t);
  return json({ ok: true, service: "revauto" });
}

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
  const name = clean(d.name, 80), phone = clean(d.phone, 30), vehicle = clean(d.vehicle, 80), email = clean(d.email, 120);
  if (!name || !phone || !vehicle) return { ok: false, error: "missing" };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "email" };
  if (!allow("book:" + (clean(d.visitor, 20) || phone), 5, 3600)) return { ok: false, error: "slow down" };
  if (!allow("book:all", 60, 3600)) return { ok: false, error: "slow down" };   // site-wide cap: a spammer can fake visitor IDs
  const tz = Session.getScriptTimeZone(), now = new Date();
  const ref = "RA-" + Utilities.formatDate(now, tz, "MMdd") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();

  // photos -> private Drive folder (never public); the Sheet keeps their links
  const blobs = [], links = [];
  (Array.isArray(d.photos) ? d.photos : []).slice(0, MAX_PHOTOS).forEach((p, i) => {
    const m = /^data:(image\/(jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(p && p.data || ""));
    if (!m || m[3].length > MAX_PHOTO_CHARS) return;
    const blob = Utilities.newBlob(Utilities.base64Decode(m[3]), m[1], `${ref}-${i + 1}.${m[2] === "jpeg" ? "jpg" : m[2]}`);
    const file = photoFolder().createFile(blob);
    blobs.push(blob); links.push(file.getUrl());
  });

  const row = [ref, now, name, phone, email, vehicle, clean(d.service, 60), d.insurance ? "Yes" : "No",
    clean(d.date, 10), clean(d.time, 40), clean(d.details, 1500), "New", "", clean(d.source, 30), links.join("\n"), ""];
  withLock(() => { const sh = sheet("Bookings"); ensureHead(sh, "Bookings"); sh.appendRow(row.map(safeCell)); });
  try { emailShop({ ref, name, phone, email, vehicle, service: clean(d.service, 60), insurance: !!d.insurance, date: clean(d.date, 10),
    time: clean(d.time, 40), details: clean(d.details, 1500) }, blobs); } catch (err) { console.error("shop email failed", err); }
  return { ok: true, ref, photos: links.length };
}

// The shop's instant notification: details, photos inline, one-click Approve.
function emailShop(b, blobs) {
  const when = niceDate(b.date) + " · " + b.time;
  const approve = approveUrl(b.ref);
  const inline = {}; blobs.forEach((bl, i) => (inline["p" + i] = bl));
  const rows = [["Name", b.name], ["Phone", b.phone], ["Email", b.email || "(none)"], ["Vehicle", b.vehicle],
    ["Service", b.service + (b.insurance ? " · insurance claim" : "")], ["Preferred", when], ["Reference", b.ref]];
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;color:#111">
    <h2 style="margin:0 0 4px">New appointment request</h2><p style="margin:0 0 16px;color:#555">${esc(when)}</p>
    <table style="border-collapse:collapse;width:100%">${rows.map(([k, v]) => `<tr><td style="padding:6px 10px;color:#666;width:110px">${k}</td><td style="padding:6px 10px"><b>${esc(v)}</b></td></tr>`).join("")}</table>
    ${b.details ? `<p style="background:#f6f4ee;padding:12px;border-radius:8px;white-space:pre-wrap">${esc(b.details)}</p>` : ""}
    ${blobs.length ? `<p><b>${blobs.length} photo${blobs.length > 1 ? "s" : ""}:</b></p>${blobs.map((_, i) => `<img src="cid:p${i}" style="width:100%;max-width:600px;border-radius:8px;margin:0 0 8px" />`).join("")}` : ""}
    <p style="margin:24px 0">${b.email ? `<a href="${approve}" style="background:#d4a537;color:#111;padding:14px 22px;border-radius:999px;text-decoration:none;font-weight:bold">✓ Approve &amp; email ${esc(b.name.split(" ")[0])}</a>`
      : `<a href="${approve}" style="background:#d4a537;color:#111;padding:14px 22px;border-radius:999px;text-decoration:none;font-weight:bold">✓ Mark confirmed</a> <span style="color:#666">(no email given: call ${esc(b.phone)})</span>`}</p>
    <p style="color:#666;font-size:13px">Approving marks it Confirmed in your dashboard${b.email ? " and emails the customer a confirmation with a calendar invite" : ""}. Want a different time? Reply to this email to write to the customer directly.</p></div>`;
  MailApp.sendEmail({ to: SHOP_EMAIL(), subject: `New appointment: ${b.name} · ${b.vehicle} · ${niceDate(b.date)}`, htmlBody: html,
    inlineImages: inline, replyTo: b.email || SHOP_EMAIL(), name: "Rev Auto website" });
}

// ---------- approving (one click from the email, or from the dashboard)
function approveToken(ref) {
  const sig = Utilities.computeHmacSha256Signature(String(ref), prop("APPROVE_SECRET", prop("ADMIN_KEY")));
  return Utilities.base64EncodeWebSafe(sig).replace(/=+$/, "").slice(0, 24);
}
function approveUrl(ref) { return ScriptApp.getService().getUrl() + "?a=approve&ref=" + encodeURIComponent(ref) + "&t=" + approveToken(ref); }

// The email's Approve link opens this page; the booking is only confirmed when the button is tapped
// (some mail apps open links by themselves to scan them, and that must never confirm anything).
function approvePage(ref, t) {
  const shell = (inner) => HtmlService.createHtmlOutput(`<meta name="viewport" content="width=device-width,initial-scale=1">
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:10vh auto;padding:28px;text-align:center;border-radius:18px;background:#111;color:#f5f1e6">${inner}
      <p style="margin-top:22px"><a style="color:#d4a537" href="${SITE_URL()}pit/" target="_top">Open the shop dashboard</a></p></div>`).setTitle("Rev Auto");
  const msg = (title, body, ok) => shell(`<div style="font-size:48px;line-height:1;margin-bottom:10px;color:${ok ? "#d4a537" : "#e66"}">${ok ? "✓" : "!"}</div><h2 style="margin:0 0 10px">${title}</h2><p style="color:#cfc8b6">${body}</p>`);
  if (!ref || !t || t !== approveToken(ref)) return msg("Link not valid", "This approval link is incomplete or was changed. Approve it from the dashboard instead.", false);
  const f = findBooking(ref);
  if (!f) return msg("Not found", "That request isn't in the Bookings sheet anymore.", false);
  const b = f.b;
  if (b.confirmed) return msg("Already confirmed", `${esc(b.name)} was confirmed ${esc(b.confirmed)}.`, true);
  return shell(`<h2 style="margin:0 0 6px">Confirm this appointment?</h2>
    <p style="color:#cfc8b6;margin:0 0 16px">${esc(b.name)} · ${esc(b.vehicle)}<br><b style="color:#f5f1e6">${esc(niceDate(b.date))} · ${esc(b.time)}</b><br>${esc(b.service)}</p>
    <textarea id="m" rows="3" placeholder="Optional note for ${esc(b.name.split(" ")[0])} (included in the email)" style="width:100%;box-sizing:border-box;border-radius:10px;padding:10px;border:0;font:inherit"></textarea>
    <p><button id="go" style="background:#d4a537;color:#111;border:0;padding:14px 26px;border-radius:999px;font-weight:bold;font-size:16px;cursor:pointer">✓ Confirm${b.email ? " &amp; email " + esc(b.name.split(" ")[0]) : ""}</button></p>
    <p id="out" style="color:#cfc8b6"></p>
    <script>
      document.getElementById("go").onclick = function () {
        this.disabled = true; this.textContent = "Confirming…";
        google.script.run.withSuccessHandler(function (r) {
          document.getElementById("go").style.display = "none"; document.getElementById("m").style.display = "none";
          document.getElementById("out").innerHTML = r.ok ? "<b style='color:#d4a537;font-size:20px'>✓ Confirmed</b><br>" + (r.emailed ? "We emailed the customer." : "No email on the request: give them a call.") : "Couldn't confirm: " + r.error;
        }).withFailureHandler(function () { document.getElementById("out").textContent = "Something went wrong. Try the dashboard."; })
          .approveFromLink(${JSON.stringify(String(ref))}, ${JSON.stringify(String(t))}, document.getElementById("m").value);
      };
    </script>`);
}
function approveFromLink(ref, t, message) {
  if (!ref || t !== approveToken(ref)) return { ok: false, error: "link not valid" };
  return approve(ref, clean(message, 600), "email link");
}

function approve(ref, message, via) {
  const found = findBooking(ref);
  if (!found) return { ok: false, error: "not found" };
  const { sh, row, b } = found, tz = Session.getScriptTimeZone();
  if (b.confirmed) return { ok: true, already: true, name: b.name, when: b.confirmed };
  const stamp = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm") + " · " + (via || "dashboard");
  let emailed = false;
  if (b.email) {
    try { emailCustomer(b, message); emailed = true; } catch (err) { console.error("customer email failed", err); }
  }
  withLock(() => {
    sh.getRange(row, COL.status).setValue("Confirmed");
    sh.getRange(row, COL.confirmed).setValue(stamp + (emailed ? " · emailed" : ""));
  });
  return { ok: true, emailed, name: b.name };
}

function emailCustomer(b, message) {
  const first = b.name.trim().split(/\s+/)[0], when = niceDate(b.date) + " · " + b.time;
  const maps = "https://www.google.com/maps/search/?api=1&query=2133+19th+St+Sarasota+FL";
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#111">
    <h2 style="margin:0 0 6px">You're booked, ${esc(first)} ✓</h2>
    <p>Your appointment at <b>Rev Auto</b> is confirmed.</p>
    <table style="border-collapse:collapse;width:100%;background:#f6f4ee;border-radius:10px">
      <tr><td style="padding:10px 14px;color:#666;width:100px">When</td><td style="padding:10px 14px"><b>${esc(when)}</b></td></tr>
      <tr><td style="padding:10px 14px;color:#666">Vehicle</td><td style="padding:10px 14px"><b>${esc(b.vehicle)}</b></td></tr>
      <tr><td style="padding:10px 14px;color:#666">Service</td><td style="padding:10px 14px"><b>${esc(b.service)}</b></td></tr>
      <tr><td style="padding:10px 14px;color:#666">Where</td><td style="padding:10px 14px"><b>2133 19th St, Sarasota, FL 34234</b><br><a href="${maps}">Directions</a></td></tr>
      <tr><td style="padding:10px 14px;color:#666">Reference</td><td style="padding:10px 14px">${esc(b.ref)}</td></tr></table>
    ${message ? `<p style="border-left:3px solid #d4a537;padding-left:12px">${esc(message)}</p>` : ""}
    <p>Need to change anything? Just reply to this email.</p>
    <p style="color:#666;font-size:13px">Rev Auto · Luxe Paint &amp; Repair · 2133 19th St, Sarasota, FL · <a href="${SITE_URL()}">website</a></p></div>`;
  MailApp.sendEmail({ to: b.email, subject: `Confirmed: your Rev Auto appointment · ${niceDate(b.date)}`, htmlBody: html,
    replyTo: SHOP_EMAIL(), name: "Rev Auto", attachments: [ics(b)] });
}

// Calendar invite for the confirmed time (Florida time).
function ics(b) {
  const start = { Morning: "0830", Midday: "1100", Afternoon: "1400" }[(b.time.match(/^\w+/) || ["Morning"])[0]] || "0900";
  const day = String(b.date).replace(/-/g, ""), sat = new Date(b.date + "T12:00:00").getDay() === 6;
  const hm = sat && start === "0830" ? "1000" : start, end = String(Number(hm.slice(0, 2)) + 1).padStart(2, "0") + hm.slice(2);
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Rev Auto//Booking//EN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${b.ref}@revauto`, `DTSTAMP:${Utilities.formatDate(new Date(), "UTC", "yyyyMMdd'T'HHmmss'Z'")}`,
    `DTSTART;TZID=America/New_York:${day}T${hm}00`, `DTEND;TZID=America/New_York:${day}T${end}00`,
    `SUMMARY:Rev Auto: ${b.service}`, "LOCATION:2133 19th St\\, Sarasota\\, FL 34234", `DESCRIPTION:Confirmed. Reference ${b.ref}.`, "END:VEVENT", "END:VCALENDAR"];
  return Utilities.newBlob(lines.join("\r\n"), "text/calendar", "rev-auto-appointment.ics");
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
  if (d.action === "approve") return approve(d.ref, clean(d.message, 600), "dashboard");
  if (d.action === "photos") return bookingPhotos(d.ref);
  if (d.action === "content_get") return { ok: true, content: readContent(), history: history() };
  if (d.action === "content_save") return saveContent(d.content);
  if (d.action === "content_restore") return restoreContent(d.at);
  if (d.action === "media_upload") return uploadMedia(d.data, d.name);
  const days = [7, 30, 90, 365].indexOf(Number(d.days)) >= 0 ? Number(d.days) : 30;
  return { ok: true, sheetUrl: SpreadsheetApp.getActive().getUrl(), tz: Session.getScriptTimeZone(), days, bookings: listBookings(), stats: stats(days),
    shopEmail: SHOP_EMAIL(), emailQuota: MailApp.getRemainingDailyQuota() };
}

function checkKey(key) {
  const cache = CacheService.getScriptCache(), fails = Number(cache.get("fails") || 0);
  if (fails >= 8) return "locked";                                      // 8 wrong tries -> 15 minute lockout
  const real = prop("ADMIN_KEY");
  if (!real || real.length < 8) return "not set up";
  if (String(key || "") === real) return true;
  cache.put("fails", String(fails + 1), 900);
  return "wrong";
}

function rowToBooking(r, tz) {
  return {
    ref: String(r[0]), received: iso(r[1]), name: String(r[2]), phone: String(r[3]), email: String(r[4]), vehicle: String(r[5]),
    service: String(r[6]), insurance: r[7] === "Yes", date: r[8] instanceof Date ? Utilities.formatDate(r[8], tz, "yyyy-MM-dd") : String(r[8]),
    time: String(r[9]), details: String(r[10]), status: String(r[11] || "New"), notes: String(r[12]), source: String(r[13]),
    photos: String(r[14] || "").split(/\s+/).filter(Boolean).length, confirmed: String(r[15] || ""),
  };
}

function listBookings() {
  const sh = sheet("Bookings"), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const tz = Session.getScriptTimeZone(), take = Math.min(n, 500);
  return sh.getRange(sh.getLastRow() - take + 1, 1, take, TABS.Bookings.length).getValues().reverse().map((r) => rowToBooking(r, tz));
}

function findBooking(ref) {
  const sh = sheet("Bookings"), n = sh.getLastRow() - 1;
  if (n < 1 || !ref) return null;
  const refs = sh.getRange(2, COL.ref, n, 1).getValues();
  for (let i = refs.length - 1; i >= 0; i--) {
    if (String(refs[i][0]) === String(ref)) {
      const r = sh.getRange(i + 2, 1, 1, TABS.Bookings.length).getValues()[0];
      return { sh, row: i + 2, b: rowToBooking(r, Session.getScriptTimeZone()), raw: r };
    }
  }
  return null;
}

function setStatus(ref, status, notes) {
  if (STATUSES.indexOf(status) < 0) return { ok: false, error: "bad status" };
  const f = findBooking(ref);
  if (!f) return { ok: false, error: "not found" };
  withLock(() => {
    f.sh.getRange(f.row, COL.status).setValue(status);
    if (typeof notes === "string") f.sh.getRange(f.row, COL.notes).setValue(safeCell(clean(notes, 500)));
  });
  return { ok: true };
}

// Photos for one request, as small previews (the dashboard can't open private Drive files directly).
function bookingPhotos(ref) {
  const f = findBooking(ref);
  if (!f) return { ok: false, error: "not found" };
  const urls = String(f.raw[COL.photos - 1] || "").split(/\s+/).filter(Boolean);
  const photos = urls.map((u) => {
    try {
      const id = (u.match(/[-\w]{25,}/) || [""])[0], file = DriveApp.getFileById(id), blob = file.getBlob();
      return { name: file.getName(), url: file.getUrl(), data: "data:" + blob.getContentType() + ";base64," + Utilities.base64Encode(blob.getBytes()) };
    } catch (err) { return null; }
  }).filter(Boolean);
  return { ok: true, photos };
}

// ---------- website content (Website tab of the dashboard)
function readContent() {
  const sh = sheet("Content"), n = sh.getLastRow() - 1;
  if (n < 1) return null;
  const text = sh.getRange(2, 1, n, 1).getValues().map((r) => r[0]).join("");
  try { return JSON.parse(text); } catch (err) { return null; }
}

function publicContent() {
  const cache = CacheService.getScriptCache(), hit = cache.get("content");
  if (hit) return JSON.parse(hit);
  const out = { ok: true, content: readContent(), updated: prop("CONTENT_UPDATED") };
  const s = JSON.stringify(out); if (s.length < 95000) cache.put("content", s, 600);
  return out;
}

function saveContent(raw) {
  const c = sanitizeContent(raw);
  if (!c) return { ok: false, error: "bad content" };
  const text = JSON.stringify(c), chunks = text.match(/[\s\S]{1,40000}/g) || [""];
  const tz = Session.getScriptTimeZone(), stamp = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss");
  withLock(() => {
    const sh = sheet("Content");
    if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 1).clearContent();
    sh.getRange(2, 1, chunks.length, 1).setValues(chunks.map((x) => [x]));
    const h = sheet("ContentHistory");
    if (text.length < 49000) {
      h.insertRowAfter(1); h.getRange(2, 1, 1, 2).setValues([[stamp, text]]);
      if (h.getLastRow() > 31) h.deleteRows(32, h.getLastRow() - 31);   // keep the last 30 versions
    }
  });
  PropertiesService.getScriptProperties().setProperty("CONTENT_UPDATED", stamp);
  CacheService.getScriptCache().remove("content");
  return { ok: true, updated: stamp, history: history() };
}

function history() {
  const h = sheet("ContentHistory"), n = h.getLastRow() - 1;
  if (n < 1) return [];
  return h.getRange(2, 1, Math.min(n, 30), 1).getValues().map((r) => (r[0] instanceof Date ? iso(r[0]) : String(r[0])));
}

function restoreContent(at) {
  const h = sheet("ContentHistory"), n = h.getLastRow() - 1;
  if (n < 1) return { ok: false, error: "not found" };
  const rows = h.getRange(2, 1, Math.min(n, 30), 2).getValues();
  const hit = rows.find((r) => (r[0] instanceof Date ? iso(r[0]) : String(r[0])) === String(at));
  if (!hit) return { ok: false, error: "not found" };
  return saveContent(JSON.parse(hit[1]));
}

// New photos for the "Our work" gallery: public (they're shown on the website), in their own Drive folder.
function uploadMedia(data, name) {
  const m = /^data:(image\/(jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(data || ""));
  if (!m || m[3].length > MAX_PHOTO_CHARS * 2) return { ok: false, error: "bad image" };
  const file = mediaFolder().createFile(Utilities.newBlob(Utilities.base64Decode(m[3]), m[1], clean(name, 60) || "photo.jpg"));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { ok: true, id: file.getId() };
}

// Only known fields, plain text, sensible lengths. The website escapes everything it shows as well.
function sanitizeContent(c) {
  if (!c || typeof c !== "object") return null;
  const s = (v, n) => clean(v, n);
  const list = (arr, max, fn) => (Array.isArray(arr) ? arr.slice(0, max).map(fn).filter(Boolean) : []);
  const icon = (v) => (ICONS.indexOf(String(v)) >= 0 ? String(v) : "star");
  const media = (v) => { v = String(v || ""); return /^drive:[-\w]{20,80}$/.test(v) || /^[\w.-]{1,80}\.(jpg|jpeg|png|webp|mp4)$/i.test(v) ? v : ""; };
  const reel = (v) => (/^[\w-]{1,60}$/.test(String(v || "")) ? String(v) : "");
  const head = (x) => ({ nav: s(x && x.nav, 24), kicker: s(x && x.kicker, 60), title: s(x && x.title, 140), text: s(x && x.text, 500) });
  const S = c.sections || {};
  const tiles = (x, max) => list(x && x.items, max, (t) => (s(t.title, 70) ? { icon: icon(t.icon), title: s(t.title, 70), text: s(t.text, 400), id: s(t.id, 30) } : null));
  return {
    v: 1,
    hero: { eyebrow: s(c.hero && c.hero.eyebrow, 180), title: s(c.hero && c.hero.title, 90), accent: s(c.hero && c.hero.accent, 90),
      lead: s(c.hero && c.hero.lead, 600), facts: list(c.hero && c.hero.facts, 6, (f) => (s(f.big, 14) ? { big: s(f.big, 14), small: s(f.small, 40) } : null)) },
    owner: { kicker: s(c.owner && c.owner.kicker, 60), name: s(c.owner && c.owner.name, 60), text: s(c.owner && c.owner.text, 700), avatar: media(c.owner && c.owner.avatar) },
    about: s(c.about, 1000),
    sections: {
      difference: Object.assign(head(S.difference), { items: tiles(S.difference, 12) }),
      services: Object.assign(head(S.services), { items: tiles(S.services, 18) }),
      work: Object.assign(head(S.work), { items: list(S.work && S.work.items, 48, (m) => (media(m.src) ? { src: media(m.src), poster: media(m.poster), caption: s(m.caption, 120), alt: s(m.alt, 160) } : null)) }),
      reels: Object.assign(head(S.reels), { items: list(S.reels && S.reels.items, 40, (m) => (reel(m.src) ? { src: reel(m.src), caption: s(m.caption, 140) } : null)) }),
      how: Object.assign(head(S.how), { items: tiles(S.how, 6) }),
      book: head(S.book),
      faq: Object.assign(head(S.faq), { items: list(S.faq && S.faq.items, 40, (f) => (s(f.q, 160) ? { q: s(f.q, 160), a: s(f.a, 800) } : null)) }),
      visit: head(S.visit),
    },
  };
}

// ---------- stats (Events + Bookings for the current period and the one before it)
function stats(days) {
  const tz = Session.getScriptTimeZone(), DAY = 86400000;
  const todayKey = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  const keys = [];
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

  const bookings = { cur: 0, prev: 0, byService: {}, insurance: 0, confirmed: 0, photos: 0 };
  listBookings().forEach((x) => {
    const k = x.received.slice(0, 10), p = period(k);
    if (!p) return;
    bookings[p]++;
    if (p === "cur") {
      bookings.byService[x.service || "Other"] = (bookings.byService[x.service || "Other"] || 0) + 1;
      if (x.insurance) bookings.insurance++;
      if (x.status === "Confirmed" || x.status === "Done") bookings.confirmed++;
      if (x.photos) bookings.photos++;
    }
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
// older Sheets had fewer Bookings columns: add the new headings on the fly
function ensureHead(sh, name) {
  const head = TABS[name], have = sh.getRange(1, 1, 1, head.length).getValues()[0];
  if (have[head.length - 1] !== head[head.length - 1]) sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight("bold");
}
function folder(propKey, name) {
  const id = prop(propKey);
  if (id) { try { return DriveApp.getFolderById(id); } catch (err) { /* deleted: make a new one */ } }
  const f = DriveApp.createFolder(name);
  PropertiesService.getScriptProperties().setProperty(propKey, f.getId());
  return f;
}
function photoFolder() { return folder("PHOTO_FOLDER", "RevAuto · booking photos (private)"); }
function mediaFolder() { return folder("MEDIA_FOLDER", "RevAuto · website photos (public)"); }
function niceDate(k) { try { return Utilities.formatDate(new Date(k + "T12:00:00"), Session.getScriptTimeZone(), "EEEE, MMMM d"); } catch (err) { return String(k); } }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function clean(v, max) { return String(v == null ? "" : v).replace(/[\u0000-\u0009\u000b-\u001f]+/g, " ").trim().slice(0, max); }
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
