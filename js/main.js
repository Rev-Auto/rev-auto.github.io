// Rev Auto site: themes, page content from kb.js, booking requests, hidden-number WhatsApp / Call buttons.
(function () {
  const R = window.REV, K = window.REV_KB, $ = (s) => document.querySelector(s);
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

  // ---------- contact without showing the number
  const num = () => R.phone.join("");
  window.RevContact = {
    lastQuestion: "",
    ready: () => R.phone.length > 0,
    whatsapp(body) {
      if (!this.ready()) return toast("WhatsApp is coming soon. Use the booking form for now.");
      const text = body || (this.lastQuestion ? `Hi Rev Auto, I'm reaching out from your website.\n\n${this.lastQuestion}` : "Hi Rev Auto, I'm reaching out from your website.");
      window.open(`https://wa.me/${num().replace("+", "")}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    },
    call() { if (!this.ready()) return toast("Phone number coming soon. Use the booking form for now."); location.href = "tel:" + num(); },
  };
  document.addEventListener("click", (e) => {
    const el = e.target.closest('[data-contact], a[href="#wa"], a[href="#call"]'); if (!el) return;
    e.preventDefault();
    const kind = el.dataset.contact || el.getAttribute("href").slice(1);
    kind === "call" ? RevContact.call() : RevContact.whatsapp(el.dataset.body || "");
  });

  // ---------- content
  const ICONS = {
    car: '<path d="M5 17h14M3 13l2-6a2 2 0 0 1 2-1.4h10A2 2 0 0 1 19 7l2 6v4a1 1 0 0 1-1 1h-1M4 18H3a1 1 0 0 1-1-1v-4h20"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    hammer: '<path d="M14 6l4 4M3 21l9-9M12.5 4.5l7 7-2 2-7-7z"/>',
    spray: '<rect x="6" y="9" width="8" height="12" rx="2"/><path d="M8 9V6h4v3M15 4h1M18 3h1M18 6h2M15 7h1"/>',
    dent: '<path d="M3 15c3 0 4-4 9-4s6 4 9 4"/><path d="M3 19h18M8 7l1 2M16 7l-1 2M12 5v3"/>',
    bumper: '<path d="M2 12h20v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/><path d="M6 12V9h12v3M7 15h2M15 15h2"/>',
    radio: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="16" cy="12" r="3"/><path d="M6 10h5M6 13h5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
    handshake: '<path d="M2 12l5-5 4 2 3-2 3 1 5 4-5 5-3-3-4 4-3-3-2 2z"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  };
  const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ICONS.star}</svg>`;
  window.revIcon = icon;
  const diffIcons = ["spark", "search", "handshake", "shield"];
  $("#diffGrid").innerHTML = K.difference.map(([t, d], i) => `<div class="card"><span class="ic">${icon(diffIcons[i])}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("");
  $("#svcGrid").innerHTML = K.services.map((s) => `<div class="card"><span class="ic">${icon(s.icon)}</span><h3>${esc(s.name)}</h3><p>${esc(s.short)}</p><button class="ask" type="button" data-ask="Tell me about ${esc(s.name.toLowerCase())}">Ask about this →</button></div>`).join("");
  $("#svcSelect").innerHTML = `<option value="">Choose…</option>` + K.services.map((s) => `<option>${esc(s.name)}</option>`).join("") + "<option>Something else</option>";
  $("#faqList").innerHTML = K.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("");
  $("#addr").textContent = R.address; $("#footAddr").textContent = R.address;
  $("#hours").innerHTML = R.hours.map(([d, h]) => `<tr><td>${esc(d)}</td><td><b>${esc(h)}</b></td></tr>`).join("");
  $("#map").src = R.mapEmbed; $("#mapsLink").href = R.mapsUrl;
  document.querySelectorAll("[data-social]").forEach((a) => (a.href = a.dataset.social === "fb" ? R.facebook : R.instagram));
  $("#year").textContent = new Date().getFullYear();

  // gallery: drop photos/videos in assets/media and list them in assets/media/gallery.json
  fetch("assets/media/gallery.json").then((r) => (r.ok ? r.json() : [])).catch(() => []).then((items) => {
    const g = $("#gallery");
    if (!items.length) {
      g.innerHTML = ["Before & after photos", "Paint & refinishing", "Collision repair", "Detail work", "Shop & team", "Radio installs", "Finished cars"].map((t, i) => `<div class="ph${i === 0 ? " big" : ""}"><span><b>${t}</b>Photos from @revautosrq coming soon</span></div>`).join("");
      return;
    }
    g.innerHTML = items.map((m, i) => `<figure class="${i === 0 ? "big" : ""}">${/\.(mp4|webm|mov)$/i.test(m.src)
      ? `<video src="assets/media/${m.src}"${m.poster ? ` poster="assets/media/${esc(m.poster)}"` : ""} muted loop playsinline autoplay preload="metadata" aria-label="${esc(m.alt || "")}"></video>`
      : `<img src="assets/media/${m.src}" alt="${esc(m.alt || "Rev Auto repair")}" loading="lazy" />`}${m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : ""}</figure>`).join("");
    // no holes: stretch the last tile across whatever the final row leaves empty (any column count)
    const fill = () => {
      const last = g.lastElementChild, cols = getComputedStyle(g).gridTemplateColumns.split(" ").length;
      last.classList.remove("span2", "span3");
      const used = items.length - 1 + 4, left = (cols - (used % cols)) % cols; // big tile = 2x2 = 4 cells
      if (left) last.classList.add(`span${Math.min(3, left + 1)}`);
    };
    fill(); addEventListener("resize", fill);
  });

  // reels: clips load and play only while on screen; the strip drifts along by itself until someone touches it
  fetch("assets/media/reels.json").then((r) => (r.ok ? r.json() : [])).catch(() => []).then((reels) => {
    const track = $("#reels"); if (!reels.length) return track.closest(".reels").remove();
    track.innerHTML = reels.map((m) => `<figure class="reel"><div class="reel__bg" style="background-image:url('assets/media/reels/${m.src}.jpg')"></div><video muted loop playsinline preload="none" poster="assets/media/reels/${m.src}.jpg" data-src="assets/media/reels/${m.src}.mp4" aria-label="${esc(m.caption)}"></video><figcaption>${esc(m.caption)}</figcaption></figure>`).join("");
    const io = new IntersectionObserver((es) => es.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause();
    }), { threshold: 0.6 });
    track.querySelectorAll("video").forEach((v) => io.observe(v));
    const step = () => track.querySelector(".reel").offsetWidth + 14;
    let idle = true, visible = false, resume;
    const touch = () => { idle = false; clearTimeout(resume); resume = setTimeout(() => (idle = true), 9000); };
    ["pointerdown", "wheel", "touchstart", "keydown", "mouseenter"].forEach((ev) => track.addEventListener(ev, touch, { passive: true }));
    new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.3 }).observe(track);
    document.querySelectorAll(".reels__nav button").forEach((b) => (b.onclick = () => { touch(); track.scrollBy({ left: step() * 2 * b.dataset.dir }); }));
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) setInterval(() => {
      if (!idle || !visible || document.hidden) return;
      const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      track.scrollTo({ left: end ? 0 : track.scrollLeft + step() });
    }, 3500);
  });

  // ---------- booking request -> email (Web3Forms), with WhatsApp as a backup
  const form = $("#bookForm"), msg = $("#bookMsg");
  form.date.min = new Date().toISOString().slice(0, 10);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    if (d.botcheck) return;
    const missing = ["name", "phone", "vehicle", "service", "date", "time"].filter((k) => !String(d[k] || "").trim());
    if (missing.length) { msg.className = "form__msg bad"; msg.textContent = "Please fill in your name, phone, vehicle, service, date and time."; form.querySelector(`[name=${missing[0]}]`).focus(); return; }
    if (new Date(d.date + "T12:00").getDay() === 0) { msg.className = "form__msg bad"; msg.textContent = "We're closed on Sundays. Please pick another day."; return; }
    if (new Date(d.date + "T12:00").getDay() === 6 && /Afternoon/.test(d.time)) { msg.className = "form__msg bad"; msg.textContent = "On Saturdays we're open 10 AM to 3 PM. Please pick morning or midday."; return; }
    const when = new Date(d.date + "T12:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    const summary = `New appointment request\n\nName: ${d.name}\nPhone: ${d.phone}\nEmail: ${d.email || "-"}\nVehicle: ${d.vehicle}\nService: ${d.service}${d.insurance ? " (insurance claim)" : ""}\nPreferred: ${when}, ${d.time}\n\nDetails:\n${d.details || "-"}`;
    const btn = form.querySelector("button[type=submit]"); btn.disabled = true; msg.className = "form__msg"; msg.textContent = "Sending…";
    try {
      if (!R.web3formsKey) throw new Error("not set up");
      const f = new FormData();
      Object.entries({ access_key: R.web3formsKey, subject: `Appointment request: ${d.name} · ${d.vehicle} · ${when}`, from_name: "Rev Auto website", replyto: d.email || "", message: summary, botcheck: "" }).forEach(([k, v]) => f.append(k, v));
      const r = await fetch("https://api.web3forms.com/submit", { method: "POST", body: f, headers: { Accept: "application/json" } });
      const j = await r.json(); if (!j.success) throw new Error(j.message || "failed");
      msg.className = "form__msg ok"; msg.innerHTML = `Request sent! ✅ We'll confirm your appointment for <b>${esc(when)}</b> by text or call.${RevContact.ready() ? ' Want to send photos of the damage? <a href="#wa" data-body="">Send them on WhatsApp</a>.' : ""}`;
      form.reset();
    } catch {
      if (RevContact.ready()) { msg.className = "form__msg ok"; msg.textContent = "Opening WhatsApp with your request. Just tap send."; RevContact.whatsapp(summary.replace("New appointment request", "Hi Rev Auto, I'd like to book an appointment:")); }
      else { msg.className = "form__msg bad"; msg.textContent = "Online booking is being set up. Please check back soon."; }
    } finally { btn.disabled = false; }
  });
})();
