// Rev Auto shop dashboard: reads the Google Sheet through the Apps Script web app (passcode required).
// Open with ?demo to preview it with sample data.
(function () {
  if (window.top !== window.self) { document.documentElement.innerHTML = ""; return; }   // never run inside someone else's frame
  const R = window.REV, $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m) => { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2600); };
  const demo = new URLSearchParams(location.search).has("demo");
  const S = { key: "", days: 30, data: null, filter: "new", q: "" };
  const store = { get() { try { return localStorage.getItem("rev.pit") || sessionStorage.getItem("rev.pit") || ""; } catch { return ""; } },
    set(k, keep) { try { (keep ? localStorage : sessionStorage).setItem("rev.pit", k); localStorage.setItem("rev.noTrack", "1"); } catch {} },
    clear() { try { localStorage.removeItem("rev.pit"); sessionStorage.removeItem("rev.pit"); } catch {} } };

  // ---------- data
  async function api(body) {
    if (demo) return demoApi(body);
    if (!R.sheetsUrl) throw new Error("not connected");
    const r = await fetch(R.sheetsUrl, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ kind: "admin", key: S.key, ...body }) });
    return r.json();
  }
  const ERR = { wrong: "That passcode isn't right.", locked: "Too many tries. Wait 15 minutes, then try again.", "not set up": "The passcode hasn't been set in the Google Sheet yet (see SETUP.md).", "not connected": "The website isn't connected to the Google Sheet yet (see SETUP.md)." };

  async function load(fromLock) {
    $("#refresh").disabled = true;
    try {
      const j = await api({ action: "data", days: S.days });
      if (!j.ok) throw new Error(j.error || "failed");
      S.data = j; showApp(); render();
    } catch (e) {
      const m = ERR[e.message] || "Couldn't reach the Google Sheet. Check your connection and try again.";
      if (fromLock || !S.data) { showLock(m); if (e.message === "wrong") store.clear(); } else toast(m);
    } finally { $("#refresh").disabled = false; }
  }
  function showLock(m) {
    const lock = $("#lock"); lock.classList.remove("ok", "leaving");
    $("#app").hidden = true; lock.hidden = false; lock.style.display = ""; $("#lockMsg").textContent = m || ""; $("#key").focus();
  }
  // after a correct passcode: gold check + "Unlocked", the lock fades away, the dashboard slides in at the top
  function showApp() {
    const lock = $("#lock"), app = $("#app");
    $("#demoNote").hidden = !demo;
    if (lock.hidden) { app.hidden = false; lock.style.display = "none"; return; }
    const quick = demo || matchMedia("(prefers-reduced-motion: reduce)").matches;
    lock.classList.add("ok");
    setTimeout(() => {
      lock.classList.add("leaving");
      setTimeout(() => {
        lock.hidden = true; lock.style.display = "none"; lock.classList.remove("ok", "leaving");
        app.hidden = false; app.classList.add("entering"); scrollTo(0, 0);
        setTimeout(() => app.classList.remove("entering"), 600);
        if (lastDaily) renderLine(lastDaily);                            // the chart could not measure its width while hidden
      }, quick ? 0 : 420);
    }, quick ? 0 : 650);
  }

  $("#lockForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    S.key = $("#key").value.trim(); $("#unlock").disabled = true; $("#unlock").innerHTML = '<span class="lock__spin" aria-hidden="true"></span>Unlocking…'; $("#lockMsg").textContent = "";
    await load(true);
    if (S.data) store.set(S.key, $("#remember").checked);
    $("#unlock").disabled = false; $("#unlock").textContent = "Unlock";
  });
  $("#signOut").onclick = () => { store.clear(); S.key = ""; S.data = null; $("#key").value = ""; showLock("Signed out."); };
  $("#refresh").onclick = () => load();
  document.querySelectorAll("#range button").forEach((b) => (b.onclick = () => { S.days = Number(b.dataset.days); load(); }));
  document.querySelectorAll("#apptFilter button").forEach((b) => (b.onclick = () => { S.filter = b.dataset.f; renderAppts(); }));
  $("#apptSearch").oninput = (e) => { S.q = e.target.value.toLowerCase(); renderAppts(); };
  $("#onlyMissed").onchange = renderChat;
  window.RevPit = { api, toast };

  // ---------- Bookings & stats | Website
  document.querySelectorAll("#views button").forEach((b) => (b.onclick = () => {
    const site = b.dataset.view === "site";
    document.querySelectorAll("#views button").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-selected", x === b); });
    $("#viewShop").hidden = site; $("#viewSite").hidden = !site; $("#shopTools").hidden = site;
    if (site) window.RevEditor.open(); else if (lastDaily) renderLine(lastDaily);
    scrollTo(0, 0);
  }));

  // ---------- helpers
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const day = (k, o) => new Date(k + "T12:00").toLocaleDateString("en-US", o);
  const n = (v) => Number(v || 0).toLocaleString("en-US");
  function delta(cur, prev) {
    if (!prev) return cur ? `<span class="up">New</span> vs. previous ${S.days} days` : `No change vs. previous ${S.days} days`;
    const p = Math.round(((cur - prev) / prev) * 100);
    return p === 0 ? `Same as previous ${S.days} days` : `<span class="${p > 0 ? "up" : "down"}">${p > 0 ? "▲" : "▼"} ${Math.abs(p)}%</span> vs. previous ${S.days} days`;
  }
  const ICON = { New: "!", Confirmed: "✓", Done: "✓", Cancelled: "✕", "No-show": "?" };
  const chip = (s) => `<span class="chip" data-s="${esc(s)}"><i aria-hidden="true">${ICON[s] || "•"}</i>${esc(s)}</span>`;
  const SRC = { google: "Google search", instagram: "Instagram", facebook: "Facebook", qr: "QR code", direct: "Direct / typed in", whatsapp: "WhatsApp link", bing: "Bing", yahoo: "Yahoo" };
  const DEV = { phone: "Phone", desktop: "Computer", tablet: "Tablet", unknown: "Unknown" };

  // ---------- render
  function render() {
    document.querySelectorAll("#range button").forEach((b) => b.classList.toggle("on", Number(b.dataset.days) === S.days));
    const { stats: st, bookings: list } = S.data;
    if (S.data.sheetUrl) $("#sheetLink").href = S.data.sheetUrl; else $("#sheetLink").hidden = true;
    renderTiles(st, list); renderAppts(); renderLine(st.daily); renderBars(); renderChat();
  }

  function renderTiles(st, list) {
    const waiting = list.filter((b) => b.status === "New");
    const oldest = waiting.map((b) => b.date).sort()[0];
    const rate = st.cur.visitors ? ((st.bookings.cur / st.cur.visitors) * 100).toFixed(1) : "0";
    const chats = (st.cur.taps.chat_q || 0) + (st.cur.taps.chat_miss || 0);
    const tiles = [
      { cls: waiting.length ? "tile--alert" : "", id: "tileNew", label: "Waiting for confirmation", value: n(waiting.length), note: waiting.length ? `${chip("New")} earliest: ${esc(day(oldest, { weekday: "short", month: "short", day: "numeric" }))}` : "All caught up ✓" },
      { label: "Booking requests", value: n(st.bookings.cur), note: delta(st.bookings.cur, st.bookings.prev) },
      { label: "Visitors", value: n(st.cur.visitors), note: delta(st.cur.visitors, st.prev.visitors) },
      { label: "Booking rate", value: rate + "%", note: "of visitors sent a request" },
      { label: "Confirmed", value: n(st.bookings.confirmed || 0), note: `${n(st.bookings.photos || 0)} requests came with photos` },
      { label: "Email & call taps", value: n((st.cur.taps.email || 0) + (st.cur.taps.call || 0)), note: `${n(st.cur.taps.email)} email · ${n(st.cur.taps.call)} call` },
      { label: "Chatbot questions", value: n(chats), note: `${n(st.cur.taps.chat_miss)} handed to the owner` },
    ];
    $("#tiles").innerHTML = tiles.map((t) => `<div class="tile ${t.cls || ""}" ${t.id ? `id="${t.id}" role="button" tabindex="0"` : ""}><div class="tile__label">${t.label}</div><div class="tile__value">${t.value}</div><div class="tile__note">${t.note}</div></div>`).join("");
    const go = () => { S.filter = "new"; renderAppts(); $("#appointments").scrollIntoView({ behavior: "smooth" }); };
    const tn = $("#tileNew"); tn.onclick = go; tn.onkeydown = (e) => { if (e.key === "Enter") go(); };
  }

  function renderAppts() {
    document.querySelectorAll("#apptFilter button").forEach((b) => b.classList.toggle("on", b.dataset.f === S.filter));
    const t = today();
    let list = S.data.bookings.slice();
    if (S.filter === "new") list = list.filter((b) => b.status === "New").sort((a, b) => a.date.localeCompare(b.date));
    if (S.filter === "upcoming") list = list.filter((b) => (b.status === "New" || b.status === "Confirmed") && b.date >= t).sort((a, b) => a.date.localeCompare(b.date));
    if (S.q) list = list.filter((b) => [b.name, b.vehicle, b.phone, b.service, b.ref].join(" ").toLowerCase().includes(S.q));
    if (!list.length) { $("#appts").innerHTML = `<p class="empty">${S.filter === "new" ? "No requests waiting. ✓" : "Nothing to show."}</p>`; return; }
    $("#appts").innerHTML = list.slice(0, 150).map((b) => {
      const past = b.date < t, slot = (b.time.match(/^\w+/) || [""])[0];
      return `<article class="appt" data-ref="${esc(b.ref)}">
        <div class="appt__when"><span>${esc(day(b.date, { weekday: "short" }))}</span><b>${esc(day(b.date, { day: "numeric" }))}</b><span>${esc(day(b.date, { month: "short" }))} · ${esc(slot)}</span></div>
        <div class="appt__who">
          <h3>${esc(b.name)} ${chip(b.status)} ${b.insurance ? '<span class="badge">Insurance</span>' : ""} ${past && b.status === "New" ? '<span class="badge">Date passed</span>' : ""}</h3>
          <div class="appt__meta"><b>${esc(b.vehicle)}</b> · ${esc(b.service)} · ${esc(b.time)}</div>
          <div class="appt__meta">${esc(b.phone)}${b.email ? " · " + esc(b.email) : ""}</div>
          ${b.details ? `<p class="appt__details">${esc(b.details)}</p>` : ""}
          ${b.confirmed ? `<div class="appt__ok">✓ Confirmed ${esc(b.confirmed)}</div>` : ""}
          ${b.photos ? `<button type="button" class="btn btn--ghost appt__photosbtn" data-photos="${esc(b.ref)}">📷 ${b.photos} photo${b.photos > 1 ? "s" : ""}</button><div class="appt__photos" id="ph-${esc(b.ref)}" hidden></div>` : ""}
          <div class="appt__ref">${esc(b.ref)} · received ${esc(b.received.replace("T", " "))}${b.source ? " · via " + esc(SRC[b.source] || b.source) : ""}</div>
        </div>
        <div class="appt__actions">
          ${b.status === "New" ? `<button type="button" class="btn btn--gold" data-approve="${esc(b.ref)}">✓ Approve${b.email ? " &amp; email" : ""}</button>` : ""}
          <select aria-label="Status for ${esc(b.name)}">${["New", "Confirmed", "Done", "Cancelled", "No-show"].map((s) => `<option${s === b.status ? " selected" : ""}>${s}</option>`).join("")}</select>
          ${b.email ? `<a class="btn btn--ghost" href="${mailLink(b)}">✉️ Email</a>` : ""}
          <a class="btn btn--ghost" href="tel:${esc(b.phone.replace(/[^\d+]/g, ""))}">📞 Call</a>
        </div></article>`;
    }).join("");
    document.querySelectorAll("[data-approve]").forEach((btn) => (btn.onclick = async () => {
      const ref = btn.dataset.approve, b = S.data.bookings.find((x) => x.ref === ref);
      const note = b.email ? prompt(`Confirm ${b.name} for ${day(b.date, { weekday: "long", month: "long", day: "numeric" })} (${b.time})?\n\nOptional note for the email (or leave empty):`, "") : (confirm(`Mark ${b.name} confirmed? (No email on the request: call them.)`) ? "" : null);
      if (note === null) return;
      btn.disabled = true; btn.textContent = "Confirming…";
      try {
        const j = await api({ action: "approve", ref, message: note });
        if (!j.ok) throw 0;
        b.status = "Confirmed"; b.confirmed = "just now" + (j.emailed ? " · emailed" : "");
        toast(j.emailed ? `Confirmed ✓ ${b.name} got the confirmation email.` : `Confirmed ✓ ${b.name} has no email: give them a call.`);
      } catch { toast("Couldn't confirm. Try again."); }
      renderTiles(S.data.stats, S.data.bookings); renderAppts();
    }));
    document.querySelectorAll("[data-photos]").forEach((btn) => (btn.onclick = async () => {
      const box = document.getElementById("ph-" + btn.dataset.photos);
      if (!box.hidden) { box.hidden = true; return; }
      box.hidden = false;
      if (box.dataset.loaded) return;
      box.innerHTML = `<p class="empty">Loading photos…</p>`;
      try {
        const j = await api({ action: "photos", ref: btn.dataset.photos });
        if (!j.ok) throw 0;
        box.dataset.loaded = "1";
        box.innerHTML = j.photos.map((p) => `<a href="${p.data}" target="_blank" rel="noopener" title="Open full size"><img src="${p.data}" alt="${esc(p.name)}" /></a>`).join("") || `<p class="empty">No photos found.</p>`;
      } catch { box.innerHTML = `<p class="empty">Couldn't load the photos.</p>`; }
    }));
    document.querySelectorAll(".appt select").forEach((sel) => (sel.onchange = async () => {
      const ref = sel.closest(".appt").dataset.ref, status = sel.value, b = S.data.bookings.find((x) => x.ref === ref), was = b.status;
      b.status = status; sel.disabled = true;
      try { const j = await api({ action: "status", ref, status }); if (!j.ok) throw 0; toast(`Saved: ${b.name} is ${status}`); }
      catch { b.status = was; toast("Couldn't save. Try again."); }
      renderTiles(S.data.stats, S.data.bookings); renderAppts();
    }));
  }
  function mailLink(b) {
    const when = `${day(b.date, { weekday: "long", month: "long", day: "numeric" })} (${b.time})`, first = b.name.trim().split(/\s+/)[0];
    return `mailto:${encodeURIComponent(b.email)}?subject=${encodeURIComponent(`Your Rev Auto appointment · ${b.vehicle}`)}&body=${encodeURIComponent(`Hi ${first},\n\nAbout your ${b.vehicle} appointment on ${when} (ref ${b.ref}):\n\n\n— Rev Auto`)}`;
  }

  // line chart: one series (visitors), crosshair + tooltip, hairline grid
  let lastDaily = null;
  function renderLine(daily) {
    lastDaily = daily; const box = $("#lineChart"), W = box.clientWidth || 600, H = 230, L = 36, Rr = 12, T = 12, B = 26;
    const vals = daily.map((d) => d.visitors), max = Math.max(4, ...vals), stepY = niceStep(max / 4), top = Math.ceil(max / stepY) * stepY;
    const x = (i) => L + (daily.length < 2 ? 0 : (i * (W - L - Rr)) / (daily.length - 1)), y = (v) => T + (H - T - B) * (1 - v / top);
    const ticks = []; for (let v = 0; v <= top; v += stepY) ticks.push(v);
    const pts = daily.map((d, i) => `${x(i).toFixed(1)},${y(d.visitors).toFixed(1)}`);
    const xl = [0, Math.floor((daily.length - 1) / 2), daily.length - 1].filter((v, i, a) => a.indexOf(v) === i);
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Visitors per day, last ${S.days} days">
      ${ticks.map((v) => `<line class="${v ? "grid" : "base"}" x1="${L}" x2="${W - Rr}" y1="${y(v)}" y2="${y(v)}"/><text class="tick" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("")}
      ${xl.map((i) => `<text class="tick" x="${x(i)}" y="${H - 6}" text-anchor="${i === 0 ? "start" : i === daily.length - 1 ? "end" : "middle"}">${esc(day(daily[i].day, { month: "short", day: "numeric" }))}</text>`).join("")}
      <path class="area" d="M${x(0)},${y(0)} L${pts.join(" L")} L${x(daily.length - 1)},${y(0)} Z"/>
      <path class="path" d="M${pts.join(" L")}"/>
      <line class="cross" id="cross" y1="${T}" y2="${H - B}" visibility="hidden"/><circle class="dot" id="dot" r="4.5" visibility="hidden"/>
      <rect id="hit" x="${L}" y="0" width="${W - L - Rr}" height="${H}" fill="transparent"/></svg>`;
    const hit = $("#hit"), cross = $("#cross"), dot = $("#dot"), tip = $("#tip");
    const show = (ev) => {
      const rc = box.getBoundingClientRect(), px = ev.clientX - rc.left;
      const i = Math.max(0, Math.min(daily.length - 1, Math.round(((px - L) / (W - L - Rr)) * (daily.length - 1))));
      const d = daily[i]; cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility", "visible");
      dot.setAttribute("cx", x(i)); dot.setAttribute("cy", y(d.visitors)); dot.setAttribute("visibility", "visible");
      tipShow(ev, `${d.visitors} visitors`, `${day(d.day, { weekday: "short", month: "short", day: "numeric" })} · ${d.visits} visits`);
    };
    hit.onpointermove = show; hit.onpointerdown = show;
    hit.onpointerleave = () => { cross.setAttribute("visibility", "hidden"); dot.setAttribute("visibility", "hidden"); tip.hidden = true; };
    const total = vals.reduce((a, b) => a + b, 0), best = daily.reduce((a, b) => (b.visitors > a.visitors ? b : a), daily[0]);
    $("#visitorsSub").textContent = `${n(total)} visitor-days · busiest: ${day(best.day, { weekday: "short", month: "short", day: "numeric" })} (${best.visitors})`;
    $("#lineTable").innerHTML = `<table><tr><th>Day</th><th>Visitors</th><th>Visits</th></tr>${daily.slice().reverse().map((d) => `<tr><td>${esc(day(d.day, { weekday: "short", month: "short", day: "numeric" }))}</td><td>${d.visitors}</td><td>${d.visits}</td></tr>`).join("")}</table>`;
  }
  function niceStep(raw) { const p = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1)))); const f = raw / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; }
  new ResizeObserver(() => lastDaily && renderLine(lastDaily)).observe($("#lineChart"));

  // ranked bars: one color; value at the end; tooltip with the share
  function bars(el, entries, { pct, label = (k) => k } = {}) {
    let rows = Object.entries(entries).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    if (rows.length > 7) { const rest = rows.slice(6).reduce((a, [, v]) => a + v, 0); rows = rows.slice(0, 6).concat([["Other", rest]]); }
    const total = rows.reduce((a, [, v]) => a + v, 0), max = Math.max(1, ...rows.map(([, v]) => v));
    if (!rows.length) { el.innerHTML = `<p class="empty">No data yet for this period.</p>`; return; }
    el.innerHTML = `<div class="rows">${rows.map(([k, v]) => `<div class="row" tabindex="0" data-k="${esc(label(k))}" data-v="${v}" data-p="${((v / total) * 100).toFixed(0)}">
      <span class="row__label">${esc(label(k))}</span><span class="row__track"><span class="row__bar" style="display:block;width:${((v / max) * 100).toFixed(1)}%"></span></span>
      <span class="row__val">${pct ? ((v / total) * 100).toFixed(0) + "%" : n(v)}</span></div>`).join("")}</div>`;
    el.querySelectorAll(".row").forEach((r) => {
      const on = (ev) => tipShow(ev, `${n(r.dataset.v)} · ${r.dataset.p}%`, r.dataset.k);
      r.onpointermove = on; r.onfocus = () => { const b = r.getBoundingClientRect(); on({ clientX: b.right - 60, clientY: b.top }); };
      r.onpointerleave = r.onblur = () => ($("#tip").hidden = true);
    });
  }
  function renderBars() {
    const st = S.data.stats;
    bars($("#sources"), st.sources, { pct: true, label: (k) => SRC[k] || k });
    bars($("#devices"), st.devices, { pct: true, label: (k) => DEV[k] || k });
    bars($("#services"), st.bookings.byService);
    $("#svcSub").textContent = `${n(st.bookings.cur)} requests · ${n(st.bookings.insurance)} insurance claims`;
    const tp = st.cur.taps;
    bars($("#taps"), { "Email": tp.email, "Call": tp.call, "Booking form": tp.book, "Chatbot opened": tp.chat_open, "Directions": tp.directions, "Instagram": tp.ig, "Facebook": tp.fb, "WhatsApp (chatbot)": tp.wa });
  }

  function renderChat() {
    const only = $("#onlyMissed").checked, list = S.data.stats.chat.filter((c) => !only || !c.answered);
    $("#qs").innerHTML = list.length ? list.map((c) => `<li><q>${esc(c.q)}</q>${c.answered ? `<span class="chip" data-s="Confirmed"><i aria-hidden="true">✓</i>Answered</span>` :`<span class="chip" data-s="No-show"><i aria-hidden="true">↗</i>Sent to the owner</span>`}<time>${esc(c.at.replace("T", " "))}</time></li>`).join("")
      : `<p class="empty">${only ? "The chatbot answered everything. ✓" : "No chatbot questions in this period."}</p>`;
  }

  function tipShow(ev, strong, text) {
    const t = $("#tip"); t.replaceChildren(); const s = document.createElement("strong"); s.textContent = strong; t.append(s, document.createTextNode(text));
    t.hidden = false; const w = t.offsetWidth, h = t.offsetHeight;
    let left = ev.clientX + 14, top = ev.clientY - h - 12; if (left + w > innerWidth - 8) left = ev.clientX - w - 14; if (top < 8) top = ev.clientY + 16;
    t.style.left = left + "px"; t.style.top = top + "px";
  }

  // ---------- demo data (?demo)
  let demoStore = null;
  function demoApi(body) {
    if (!demoStore) demoStore = makeDemo();
    if (body.action === "status") { return { ok: true }; }
    if (body.action === "approve") return { ok: true, emailed: true };
    if (body.action === "photos") return { ok: true, photos: [] };
    if (body.action === "content_get") return { ok: true, content: null, history: [] };
    if (body.action === "content_save") return { ok: true, history: [new Date().toISOString().slice(0, 16)] };
    return { ok: true, sheetUrl: "", days: S.days, bookings: demoStore.bookings, stats: demoStats(S.days) };
  }
  function rnd(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }
  function makeDemo() {
    const r = rnd(42), names = ["Sample: Jordan P.", "Sample: Maria L.", "Sample: Andre W.", "Sample: Kelly S.", "Sample: Tom B.", "Sample: Priya K.", "Sample: Luis G.", "Sample: Dana R."];
    const cars = ["2019 Honda Accord", "2021 BMW X5", "2016 Kia Sorento", "2022 Tesla Model Y", "2018 Ford F-150", "2020 Mercedes C300", "2017 Toyota Camry", "2023 Jeep Wrangler"];
    const svcs = ["Collision repair", "Dent & scratch repair", "Paint & refinishing", "Bumper repair", "Bodywork & panels", "Custom work & restoration"];
    const slots = ["Morning (8:30–11 AM)", "Midday (11 AM–2 PM)", "Afternoon (2–5:30 PM)"], st = ["Done", "Done", "Done", "Done", "Done", "Confirmed", "Cancelled", "No-show"];
    const bookings = [];
    for (let i = 0; i < 26; i++) {
      const rec = new Date(Date.now() - (i < 5 ? i * 0.6 : 3 + Math.floor(r() * 80)) * 864e5), dt = new Date(rec.getTime() + (1 + Math.floor(r() * 10)) * 864e5);
      if (dt.getDay() === 0) dt.setDate(dt.getDate() + 1);
      const k = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const status = dt > new Date() ? (r() < .55 ? "New" : "Confirmed") : st[Math.floor(r() * st.length)];
      bookings.push({ ref: "RA-" + k(rec).slice(5).replace("-", "") + "-" + Math.floor(r() * 9000 + 1000), received: k(rec) + "T" + String(8 + Math.floor(r() * 9)).padStart(2, "0") + ":" + String(Math.floor(r() * 60)).padStart(2, "0"),
        name: names[i % names.length], phone: "(941) 555-01" + String(10 + i), email: i % 3 ? "sample" + i + "@example.com" : "", photos: i % 4 === 0 ? 2 : 0, confirmed: "", vehicle: cars[Math.floor(r() * cars.length)], service: svcs[Math.floor(r() * svcs.length)],
        insurance: r() < .4, date: k(dt), time: slots[Math.floor(r() * 3)], details: r() < .5 ? "Rear bumper scraped in a parking lot, small dent above the wheel." : "", status, notes: "", source: ["google", "instagram", "direct", "qr", "facebook"][Math.floor(r() * 5)] });
    }
    bookings.sort((a, b) => b.received.localeCompare(a.received));
    return { bookings };
  }
  function demoStats(days) {
    const r = rnd(days * 7 + 3), daily = [], k = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    for (let i = days - 1; i >= 0; i--) { const d = new Date(Date.now() - i * 864e5), base = d.getDay() === 0 ? 8 : d.getDay() === 6 ? 16 : 24, v = Math.round(base + r() * 18 + (days - i) * 0.08); daily.push({ day: k(d), visitors: v, visits: Math.round(v * 1.25) }); }
    const visitors = daily.reduce((a, d) => a + d.visitors, 0), f = days / 30;
    const inRange = demoStore.bookings.filter((b) => b.received.slice(0, 10) >= daily[0].day);
    const byService = {}; inRange.forEach((b) => (byService[b.service] = (byService[b.service] || 0) + 1));
    return { cur: { visits: Math.round(visitors * 1.25), visitors, taps: { email: Math.round(36 * f), wa: Math.round(6 * f), call: Math.round(17 * f), book: inRange.length, chat_open: Math.round(52 * f), chat_q: Math.round(88 * f), chat_miss: Math.round(9 * f), directions: Math.round(23 * f), ig: Math.round(31 * f), fb: Math.round(8 * f) } },
      prev: { visits: Math.round(visitors * 1.05), visitors: Math.round(visitors * .84), taps: {} }, daily,
      sources: { google: Math.round(visitors * .41), instagram: Math.round(visitors * .24), direct: Math.round(visitors * .17), qr: Math.round(visitors * .09), facebook: Math.round(visitors * .06), whatsapp: Math.round(visitors * .03) },
      devices: { phone: Math.round(visitors * .71), desktop: Math.round(visitors * .24), tablet: Math.round(visitors * .05) },
      bookings: { cur: inRange.length, prev: Math.round(inRange.length * .8), byService, insurance: inRange.filter((b) => b.insurance).length,
        confirmed: inRange.filter((b) => b.status === "Confirmed" || b.status === "Done").length, photos: inRange.filter((b) => b.photos).length },
      chat: [["do you work with geico", 1], ["how much to fix a bumper", 1], ["do you do window tint", 0], ["are you open saturday", 1], ["can you fix a cracked windshield", 0], ["who's the owner? can I meet him tomorrow", 1], ["do you have loaner cars", 0], ["do you work on teslas", 1]].map(([q, a], i) => ({ at: k(new Date(Date.now() - i * 1.7 * 864e5)) + "T1" + i + ":2" + i, q, answered: !!a })) };
  }

  // ---------- start
  if (demo) { load(true); return; }
  if (!R.sheetsUrl) { showLock(ERR["not connected"]); return; }
  S.key = store.get();
  if (S.key) { $("#lock").classList.add("ok"); $("#okText").textContent = "Welcome back"; load(true); } else showLock("");
})();
