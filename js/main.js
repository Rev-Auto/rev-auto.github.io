// Rev Auto site: themes, page content (content.js: defaults + the owner's published edits), booking requests
// with photos, and email / call buttons whose details never appear on the page as text.
(function () {
  const R = window.REV, C = window.RevContent, $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m, ms = 3500) => { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), ms); };
  window.revToast = toast;

  // ---------- themes: Auto follows the time of day (re-checked every 10 minutes)
  const byTime = () => { const h = new Date().getHours(); return h >= 7 && h < 17 ? "showroom" : (h >= 17 && h < 20) || (h >= 5 && h < 7) ? "garage" : "midnight"; };
  function setTheme(choice) {
    try { localStorage.setItem("rev.theme", choice); } catch {}
    document.documentElement.dataset.choice = choice;
    document.documentElement.dataset.theme = choice === "auto" ? byTime() : choice;
    document.querySelectorAll(".theme button").forEach((b) => b.classList.toggle("on", b.dataset.set === choice));
  }
  document.querySelectorAll(".theme button").forEach((b) => (b.onclick = () => setTheme(b.dataset.set)));
  setTheme(document.documentElement.dataset.choice || "auto");
  const panel = $("#themePanel"), toggle = $("#themeToggle");
  const showPanel = (on) => { panel.hidden = !on; toggle.setAttribute("aria-expanded", on); };
  toggle.onclick = (e) => { e.stopPropagation(); showPanel(panel.hidden); };
  panel.addEventListener("click", (e) => { if (e.target.closest("button")) setTimeout(() => showPanel(false), 250); });
  document.addEventListener("click", (e) => { if (!panel.hidden && !e.target.closest("#themeDock")) showPanel(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") showPanel(false); });
  setInterval(() => { if (document.documentElement.dataset.choice === "auto") setTheme("auto"); }, 600000);

  // ---------- contact without showing the number or the email address
  const num = () => R.phone.join("");
  const mail = () => (R.email || []).join("@");
  window.RevContact = {
    lastQuestion: "",
    ready: () => R.phone.length > 0,
    whatsapp(body) {   // kept for the chatbot
      if (!this.ready()) return toast("WhatsApp is coming soon. Use email or the booking form for now.");
      const text = body || (this.lastQuestion ? `Hi Rev Auto, I'm reaching out from your website.\n\n${this.lastQuestion}` : "Hi Rev Auto, I'm reaching out from your website.");
      RevTrack.event("wa", this.lastQuestion ? "from chat" : "");
      window.open(`https://wa.me/${num().replace("+", "")}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    },
    email(subject, body) {
      if (!mail()) return toast("Email is coming soon. Use the booking form for now.");
      const q = this.lastQuestion;
      RevTrack.event("email", q ? "from chat" : "");
      location.href = `mailto:${mail()}?subject=${encodeURIComponent(subject || "Question from your website")}&body=${encodeURIComponent(body || (q ? `Hi Rev Auto,\n\n${q}\n\n` : "Hi Rev Auto,\n\n"))}`;
    },
    call() { if (!this.ready()) return toast("Phone number coming soon. Use the booking form for now."); RevTrack.event("call"); location.href = "tel:" + num(); },
  };
  document.addEventListener("click", (e) => {
    const el = e.target.closest('[data-contact], a[href="#wa"], a[href="#call"], a[href="#email"]'); if (!el) return;
    e.preventDefault();
    const kind = el.dataset.contact || el.getAttribute("href").slice(1);
    kind === "call" ? RevContact.call() : kind === "email" ? RevContact.email(el.dataset.subject, el.dataset.body) : RevContact.whatsapp(el.dataset.body || "");
  });

  // ---------- phone menu (☰)
  const top = $(".top"), burger = $("#burger");
  const setMenu = (on) => { top.classList.toggle("is-open", on); burger.setAttribute("aria-expanded", on); };
  burger.onclick = (e) => { e.stopPropagation(); setMenu(!top.classList.contains("is-open")); };
  $("#nav").addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("click", (e) => { if (!e.target.closest(".top")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  // ---------- balanced tile rows: as many columns as fit (min width from data-balance), every row full
  // e.g. 7 services on 3 columns -> 3·2·2 (not 3·3·1); 9 -> 3·3·3. Phones get one per row.
  function balance(grid) {
    const cards = [...grid.children]; if (!cards.length) return;
    const gap = parseFloat(getComputedStyle(grid).columnGap) || 16;
    let cols = Math.max(1, Math.floor((grid.clientWidth + gap) / (+grid.dataset.balance + gap)));
    cols = Math.min(cols, cards.length);
    if (cards.length % cols && cols > 2 && cards.length % (cols - 1) === 0) cols -= 1;
    const n = cards.length, rows = Math.max(1, Math.floor(n / cols)), left = n - rows * cols;
    const sizes = Array.from({ length: rows }, (_, r) => cols + Math.floor(left / rows) + (r < left % rows ? 1 : 0));
    let i = 0;
    for (const k of sizes) for (let j = 0; j < k; j++, i++) cards[i].style.flex = `0 0 calc((100% - ${(k - 1) * gap}px) / ${k})`;
  }
  const balanceAll = () => document.querySelectorAll("[data-balance]").forEach(balance);
  addEventListener("resize", balanceAll);

  // ---------- page content
  window.revIcon = C.icon;
  const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
  let current = null;

  function renderText(c) {
    document.querySelectorAll("[data-c]").forEach((el) => {
      const v = get(c, el.dataset.c);
      if (typeof v === "string") { el.textContent = v; el.hidden = !v; }
    });
    setAvatar(c.owner.avatar);
    $("#heroFacts").innerHTML = c.hero.facts.map((f) => `<li><b>${esc(f.big)}</b><span>${esc(f.small)}</span></li>`).join("");
    $("#diffGrid").innerHTML = c.sections.difference.items.map((t) => `<div class="card"><span class="ic">${C.icon(t.icon)}</span><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p></div>`).join("");
    $("#svcGrid").innerHTML = c.sections.services.items.map((s) => `<div class="card"><span class="ic">${C.icon(s.icon)}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p><button class="ask" type="button" data-ask="Tell me about ${esc(s.title.toLowerCase())}">Ask about this →</button></div>`).join("");
    $("#howSteps").innerHTML = c.sections.how.items.map((s) => `<li><b>${esc(s.title)}</b><span>${esc(s.text)}</span></li>`).join("");
    const keep = $("#svcSelect").value;
    $("#svcSelect").innerHTML = `<option value="">Choose…</option>` + c.sections.services.items.map((s) => `<option>${esc(s.title)}</option>`).join("") + "<option>Something else</option>";
    $("#svcSelect").value = keep;
    balanceAll();
    $("#faqList").innerHTML = c.sections.faq.items.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("");
    C.teachBot(c);
  }

  // the owner's cartoon: owner card (large) and the chatbot's button + header (small)
  function setAvatar(src) {
    const swap = (img, size) => {
      const url = C.avatarUrl(src, "", size); if (img.getAttribute("src") === url) return;
      img.onerror = () => { img.onerror = null; img.src = C.avatarUrl("", "", size); };
      img.src = url;
    };
    const card = $("#ownerImg"); if (card) swap(card, 360);
    document.querySelectorAll(".chat-ava").forEach((img) => swap(img, 96));
    window.revAvatar = src;
  }

  function renderGallery(items) {
    const g = $("#gallery");
    if (!items.length) {
      g.innerHTML = ["Before & after photos", "Paint & refinishing", "Collision repair", "Detail work", "Shop & team", "Radio installs", "Finished cars"].map((t, i) => `<div class="ph${i === 0 ? " big" : ""}"><span><b>${t}</b>Photos from @revautosrq coming soon</span></div>`).join("");
      return;
    }
    g.innerHTML = items.map((m, i) => `<figure class="${i === 0 ? "big" : ""}">${/\.(mp4|webm|mov)$/i.test(m.src)
      ? `<video src="${C.mediaUrl(m.src, "")}"${m.poster ? ` poster="${C.mediaUrl(m.poster, "")}"` : ""} muted loop playsinline autoplay preload="metadata" aria-label="${esc(m.alt || m.caption || "")}"></video>`
      : `<img src="${C.mediaUrl(m.src, "", i === 0 ? 1600 : 900)}" alt="${esc(m.alt || m.caption || "Rev Auto repair")}" loading="lazy" referrerpolicy="no-referrer" />`}${m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : ""}</figure>`).join("");
    fill();
  }
  // no holes: stretch the last tile across whatever the final row leaves empty (any column count)
  function fill() {
    const g = $("#gallery"), last = g.lastElementChild; if (!last || last.classList.contains("ph")) return;
    const n = g.children.length, cols = getComputedStyle(g).gridTemplateColumns.split(" ").length;
    last.classList.remove("span2", "span3");
    const used = n - 1 + 4, left = (cols - (used % cols)) % cols; // big tile = 2x2 = 4 cells
    if (left) last.classList.add(`span${Math.min(3, left + 1)}`);
  }
  addEventListener("resize", fill);

  // reels: clips load and play only while on screen; the strip drifts along by itself until someone touches it
  let reelTimer = null;
  function renderReels(reels) {
    const wrap = $(".reels"), track = $("#reels");
    if (!reels.length) { wrap.hidden = true; return; }
    wrap.hidden = false;
    track.innerHTML = reels.map((m) => `<figure class="reel"><div class="reel__bg" style="background-image:url('assets/media/reels/${encodeURIComponent(m.src)}.jpg')"></div><video muted loop playsinline preload="none" poster="assets/media/reels/${encodeURIComponent(m.src)}.jpg" data-src="assets/media/reels/${encodeURIComponent(m.src)}.mp4" aria-label="${esc(m.caption)}"></video><figcaption>${esc(m.caption)}</figcaption></figure>`).join("");
    const io = new IntersectionObserver((es) => es.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause();
    }), { threshold: 0.6 });
    track.querySelectorAll("video").forEach((v) => io.observe(v));
    if (reelTimer) return;                                             // controls are wired once
    const step = () => (track.querySelector(".reel") || { offsetWidth: 240 }).offsetWidth + 14;
    const bar = () => ($("#reelsBar").style.width = Math.min(100, ((track.scrollLeft + track.clientWidth) / track.scrollWidth) * 100) + "%");
    track.addEventListener("scroll", bar, { passive: true }); bar();
    let idle = true, visible = false, resume;
    const touch = () => { idle = false; clearTimeout(resume); resume = setTimeout(() => (idle = true), 9000); };
    ["pointerdown", "wheel", "touchstart", "keydown", "mouseenter"].forEach((ev) => track.addEventListener(ev, touch, { passive: true }));
    new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.3 }).observe(track);
    document.querySelectorAll(".reels__nav button").forEach((b) => (b.onclick = () => { touch(); track.scrollBy({ left: step() * 2 * b.dataset.dir }); }));
    reelTimer = matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : setInterval(() => {
      if (!idle || !visible || document.hidden) return;
      const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      track.scrollTo({ left: end ? 0 : track.scrollLeft + step() });
    }, 3500);
  }

  function render(c) {
    const sig = JSON.stringify(c);
    if (current === sig) return;
    current = sig;
    renderText(c);
    renderGallery(c.sections.work.items);
    renderReels(c.sections.reels.items);
  }

  // 1) defaults + whatever this device saw last time, right away; 2) the latest published version from the Sheet
  (async () => {
    const preview = C.draft();
    if (preview) {
      document.body.insertAdjacentHTML("afterbegin", `<div class="preview-bar">Preview of unpublished changes · <a href="./">see the live site</a></div>`);
      return render(C.merge(await C.withMedia(C.base(), ""), preview));
    }
    renderText(C.merge(C.base(), C.cached()));
    const def = await C.withMedia(C.base(), "");
    render(C.merge(def, C.cached()));
    const live = await C.fetchLive();
    if (live) render(C.merge(def, live));
  })();

  $("#addr").textContent = R.address; $("#footAddr").textContent = R.address;
  $("#hours").innerHTML = R.hours.map(([d, h]) => `<tr><td>${esc(d)}</td><td><b>${esc(h)}</b></td></tr>`).join("");
  $("#map").src = R.mapEmbed; $("#mapsLink").href = R.mapsUrl;
  document.querySelectorAll("[data-social]").forEach((a) => (a.href = a.dataset.social === "fb" ? R.facebook : R.instagram));
  $("#year").textContent = new Date().getFullYear();
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-social], #mapsLink"); if (!a) return;
    RevTrack.event(a.id === "mapsLink" ? "directions" : a.dataset.social);
  });
  // the shop's private dashboard: five quick taps on the footer's © line (nothing on the page points to it)
  let taps = [];
  $("#copyLine").addEventListener("click", () => {
    const now = Date.now(); taps = taps.filter((t) => now - t < 2500).concat(now);
    if (taps.length >= 5) location.href = "pit/";
  });

  // ---------- booking photos: up to 5, shrunk on this device before sending (about 200–400 KB each)
  const MAX_PHOTOS = 5, photos = [];
  async function shrink(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
      const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const cv = document.createElement("canvas"); cv.width = Math.round(img.naturalWidth * scale); cv.height = Math.round(img.naturalHeight * scale);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      let q = 0.78, data = cv.toDataURL("image/jpeg", q);
      while (data.length > 560000 && q > 0.45) { q -= 0.1; data = cv.toDataURL("image/jpeg", q); }   // keep each photo under ~400 KB
      return data;
    } finally { URL.revokeObjectURL(url); }
  }
  function drawPhotos() {
    $("#photoList").innerHTML = photos.map((p, i) => `<figure><img src="${p}" alt="Photo ${i + 1}" /><button type="button" data-rm="${i}" aria-label="Remove photo ${i + 1}">×</button></figure>`).join("");
    $("#photoCount").textContent = photos.length ? `${photos.length} of ${MAX_PHOTOS} photos` : `Up to ${MAX_PHOTOS} photos`;
    $("#photoAdd").hidden = photos.length >= MAX_PHOTOS;
  }
  $("#photoInput").addEventListener("change", async (e) => {
    const files = [...e.target.files].filter((f) => /^image\//.test(f.type) || /\.(heic|heif)$/i.test(f.name));
    e.target.value = "";
    if (photos.length + files.length > MAX_PHOTOS) toast(`Up to ${MAX_PHOTOS} photos: the first ${MAX_PHOTOS - photos.length} were added.`);
    $("#photoCount").textContent = "Preparing photos…";
    for (const f of files.slice(0, MAX_PHOTOS - photos.length)) {
      try { photos.push(await shrink(f)); } catch { toast(`Couldn't read ${f.name}. Try a JPG or PNG.`); }
      drawPhotos();
    }
    drawPhotos();
  });
  $("#photoList").addEventListener("click", (e) => { const b = e.target.closest("[data-rm]"); if (b) { photos.splice(+b.dataset.rm, 1); drawPhotos(); } });
  drawPhotos();

  // ---------- booking request -> Google Sheet + instant email to the shop (by the Sheet's script); email app if that fails
  const form = $("#bookForm"), msg = $("#bookMsg"), done = $("#bookDone");
  form.date.min = new Date().toISOString().slice(0, 10);
  const SLOT_START = { Morning: "0830", Midday: "1100", Afternoon: "1400" };

  // a calendar file for the requested time (marked "requested" until the shop confirms)
  function icsFor(d) {
    const day = d.date.replace(/-/g, ""), sat = new Date(d.date + "T12:00").getDay() === 6;
    let hm = SLOT_START[(d.time.match(/^\w+/) || ["Morning"])[0]] || "0900"; if (sat && hm === "0830") hm = "1000";
    const end = String(Number(hm.slice(0, 2)) + 1).padStart(2, "0") + hm.slice(2);
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Rev Auto//Booking//EN", "BEGIN:VEVENT",
      `UID:${Date.now()}@revauto`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
      `DTSTART:${day}T${hm}00`, `DTEND:${day}T${end}00`, `SUMMARY:Rev Auto: ${d.service} (requested)`,
      `LOCATION:${R.address.replace(/,/g, "\\,")}`, `DESCRIPTION:Requested ${d.time}. Rev Auto will email you to confirm.`, "END:VEVENT", "END:VCALENDAR"];
    return URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
  }

  function showDone(d, when, ref, sent) {
    const first = d.name.trim().split(/\s+/)[0];
    done.innerHTML = `<div class="done__check" aria-hidden="true">✓</div>
      <h3>Request sent!</h3>
      <p>Thanks, ${esc(first)}. ${esc(R.owner || "We")} will confirm your time by email at <b>${esc(d.email)}</b>.</p>
      <dl class="done__list">
        <div><dt>When</dt><dd>${esc(when)} · ${esc(d.time)}</dd></div>
        <div><dt>Vehicle</dt><dd>${esc(d.vehicle)}</dd></div>
        <div><dt>Service</dt><dd>${esc(d.service)}${d.insurance ? " · insurance claim" : ""}</dd></div>
        ${sent ? `<div><dt>Photos</dt><dd>${sent} sent</dd></div>` : ""}
        ${ref ? `<div><dt>Reference</dt><dd><b>${esc(ref)}</b></dd></div>` : ""}
      </dl>
      <div class="done__btns">
        <a class="btn btn--accent" download="rev-auto-appointment.ics" href="${icsFor(d)}">📅 Add to my calendar</a>
        <button class="btn btn--ghost" type="button" id="bookAgain">Book another car</button>
      </div>
      <p class="muted small">This is a request: your time is confirmed once you get our email.</p>`;
    form.hidden = true; done.hidden = false; done.focus();
    done.scrollIntoView({ behavior: "smooth", block: "center" });
    $("#bookAgain").onclick = () => { done.hidden = true; form.hidden = false; form.reset(); photos.length = 0; drawPhotos(); msg.textContent = ""; form.name.focus(); };
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    if (d.botcheck) return;
    delete d.photo;
    const missing = ["name", "phone", "email", "vehicle", "service", "date", "time"].filter((k) => !String(d[k] || "").trim());
    const bad = (m, field) => { msg.className = "form__msg bad"; msg.textContent = m; if (field) form.querySelector(`[name=${field}]`).focus(); };
    if (missing.length) return bad("Please fill in your name, phone, email, vehicle, service, date and time.", missing[0]);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) return bad("Please check your email address: we send your confirmation there.", "email");
    if (new Date(d.date + "T12:00").getDay() === 0) return bad("We're closed on Sundays. Please pick another day.", "date");
    if (new Date(d.date + "T12:00").getDay() === 6 && /Afternoon/.test(d.time)) return bad("On Saturdays we're open 10 AM to 3 PM. Please pick morning or midday.", "time");
    const when = new Date(d.date + "T12:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    const btn = form.querySelector("button[type=submit]"); btn.disabled = true; msg.className = "form__msg";
    msg.textContent = photos.length ? `Sending your request and ${photos.length} photo${photos.length > 1 ? "s" : ""}…` : "Sending…";
    try {
      const r = await RevTrack.booking({ name: d.name, phone: d.phone, email: d.email.trim(), vehicle: d.vehicle, service: d.service, insurance: !!d.insurance,
        date: d.date, time: d.time, details: d.details, photos: photos.map((data) => ({ data })) });
      msg.textContent = ""; RevTrack.event("book", d.service);
      showDone(d, when, r.ref, r.photos || 0);
    } catch (err) {
      // the Sheet couldn't be reached: open the customer's email app with the request filled in
      msg.className = "form__msg bad";
      msg.textContent = err.message === "slow down" ? "Too many requests from this device. Please wait a bit, or email us." : "We couldn't send it online. Opening your email app with your request filled in: just tap send (and attach your photos).";
      if (err.message !== "slow down") RevContact.email(`Appointment request: ${d.name} · ${d.vehicle} · ${when}`,
        `Hi Rev Auto, I'd like to book an appointment:\n\nName: ${d.name}\nPhone: ${d.phone}\nVehicle: ${d.vehicle}\nService: ${d.service}${d.insurance ? " (insurance claim)" : ""}\nPreferred: ${when}, ${d.time}\n\nDetails:\n${d.details || "-"}`);
    } finally { btn.disabled = false; }
  });
})();
