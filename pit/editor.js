// Rev Auto dashboard · Website tab: edit every section of the website without touching code.
// Changes are kept as a draft on this device (for Preview) until "Publish" saves them to the Google Sheet;
// the website loads the published version on its next page view. The last 30 versions can be restored.
(function () {
  const C = window.RevContent, $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DRAFT = "rev.draft";
  let def = null, doc = null, saved = "", history = [], busy = false;

  // what the owner can edit, top of the page to the bottom
  const PARTS = [
    { key: "hero", label: "Top of the page", hint: "The big headline, intro and the four quick facts.", kind: "hero" },
    { key: "difference", label: "The Rev Auto difference", hint: "Section heading, the owner card and the tiles.", kind: "tiles", icons: true, max: 12, owner: true },
    { key: "services", label: "Services", hint: "Every service tile. These also fill the booking form's Service list and teach the chatbot.", kind: "tiles", icons: true, max: 18 },
    { key: "work", label: "Our work", hint: "The photo gallery. The first photo shows large.", kind: "media" },
    { key: "reels", label: "From the shop floor", hint: "The short video strip.", kind: "reels" },
    { key: "how", label: "How it works", hint: "The numbered steps.", kind: "tiles", icons: false, max: 6 },
    { key: "book", label: "Booking", hint: "The text next to the booking form.", kind: "head" },
    { key: "faq", label: "FAQ", hint: "Questions and answers. The chatbot answers from these too.", kind: "faq" },
    { key: "visit", label: "Visit", hint: "Heading above the address, hours and map (those come from the shop settings).", kind: "head" },
    { key: "about", label: "Chatbot: about the shop", hint: "What the assistant says when someone asks about Rev Auto.", kind: "about" },
  ];
  const NAV = { difference: 1, services: 1, work: 1, faq: 1, visit: 1 };

  const getAt = (o, path) => path.split(".").reduce((x, k) => (x == null ? x : x[k]), o);
  const setAt = (o, path, v) => { const ks = path.split("."), last = ks.pop(); ks.reduce((x, k) => x[k], o)[last] = v; };
  const isDirty = () => JSON.stringify(doc) !== saved;
  const field = (path, label, { max = 140, area = false, rows = 2, ph = "" } = {}) => {
    const v = esc(getAt(doc, path) || "");
    return `<label class="ed__f"><span>${label}</span>${area ? `<textarea data-p="${path}" maxlength="${max}" rows="${rows}" placeholder="${esc(ph)}">${v}</textarea>` : `<input data-p="${path}" maxlength="${max}" value="${v}" placeholder="${esc(ph)}" />`}</label>`;
  };
  const tools = (list, i, n) => `<span class="ed__tools"><button type="button" data-act="up" data-l="${list}" data-i="${i}" ${i === 0 ? "disabled" : ""} aria-label="Move up">↑</button><button type="button" data-act="down" data-l="${list}" data-i="${i}" ${i === n - 1 ? "disabled" : ""} aria-label="Move down">↓</button><button type="button" class="ed__del" data-act="del" data-l="${list}" data-i="${i}" aria-label="Delete">✕</button></span>`;
  const iconPick = (path, cur) => `<label class="ed__icon"><span class="ed__iconprev" aria-hidden="true">${C.icon(cur)}</span><select data-p="${path}" aria-label="Icon">${Object.keys(C.ICONS).map((k) => `<option value="${k}"${k === cur ? " selected" : ""}>${C.ICON_LABELS[k]}</option>`).join("")}</select></label>`;
  const head = (key, withText = true) => `<div class="ed__head">${NAV[key] ? field(`sections.${key}.nav`, "Menu label", { max: 24 }) : ""}
      ${field(`sections.${key}.kicker`, "Small heading", { max: 60 })}${field(`sections.${key}.title`, "Big heading", { max: 140 })}
      ${withText ? field(`sections.${key}.text`, "Intro line <small>(optional)</small>", { max: 500, area: true }) : ""}</div>`;

  function body(p) {
    if (p.kind === "hero") {
      const facts = doc.hero.facts;
      return `<div class="ed__head">${field("hero.eyebrow", "Small line above the headline", { max: 180 })}${field("hero.title", "Headline, first line", { max: 90 })}
        ${field("hero.accent", "Headline, colored second line", { max: 90 })}${field("hero.lead", "Intro paragraph", { max: 600, area: true, rows: 3 })}</div>
        <h4>Quick facts <small>(${facts.length} of 6)</small></h4>
        <div class="ed__list">${facts.map((f, i) => `<div class="ed__row ed__row--fact">${field(`hero.facts.${i}.big`, "Big", { max: 14 })}${field(`hero.facts.${i}.small`, "Small", { max: 40 })}${tools("hero.facts", i, facts.length)}</div>`).join("")}</div>
        ${facts.length < 6 ? `<button type="button" class="btn btn--ghost ed__add" data-act="add" data-l="hero.facts">＋ Add a fact</button>` : ""}`;
    }
    if (p.kind === "about") return field("about", "About Rev Auto", { max: 1000, area: true, rows: 5 });
    const sec = doc.sections[p.key];
    if (p.kind === "head") return head(p.key);
    let out = head(p.key, p.key !== "reels");
    if (p.owner) out += `<h4>Owner card</h4><div class="ed__ownerwrap">
        <div class="ed__avatar"><img id="edAvatar" src="${esc(C.avatarUrl(doc.owner.avatar, "../", 360))}" alt="Owner picture" referrerpolicy="no-referrer" />
          <label class="btn btn--gold ed__upload"><input type="file" accept="image/*" data-avatar="1" />＋ New picture</label>
          ${doc.owner.avatar ? `<button type="button" class="btn btn--ghost" data-act-avatar="reset">Use original</button>` : ""}
          <small>Also shows on the chatbot button. A square picture with a transparent or plain background works best.</small></div>
        <div class="ed__head ed__owner">${field("owner.kicker", "Small heading", { max: 60 })}${field("owner.name", "Name", { max: 60 })}${field("owner.text", "About the owner", { max: 700, area: true, rows: 3 })}</div></div>`;
    const list = `sections.${p.key}.items`, items = sec.items, n = items.length;
    if (p.kind === "tiles") {
      out += `<h4>Tiles <small>(${n}${p.max ? " of " + p.max : ""})</small></h4><div class="ed__list">${items.map((t, i) => `<div class="ed__row">
          ${p.icons ? iconPick(`${list}.${i}.icon`, t.icon) : `<span class="ed__num">${i + 1}</span>`}
          <div class="ed__grow">${field(`${list}.${i}.title`, "Title", { max: 70 })}${field(`${list}.${i}.text`, "Text", { max: 400, area: true })}</div>${tools(list, i, n)}</div>`).join("")}</div>
        ${!p.max || n < p.max ? `<button type="button" class="btn btn--ghost ed__add" data-act="add" data-l="${list}">＋ Add a tile</button>` : ""}`;
    }
    if (p.kind === "faq") {
      out += `<h4>Questions <small>(${n})</small></h4><div class="ed__list">${items.map((f, i) => `<div class="ed__row"><span class="ed__num">${i + 1}</span>
          <div class="ed__grow">${field(`${list}.${i}.q`, "Question", { max: 160 })}${field(`${list}.${i}.a`, "Answer", { max: 800, area: true, rows: 3 })}</div>${tools(list, i, n)}</div>`).join("")}</div>
        <button type="button" class="btn btn--ghost ed__add" data-act="add" data-l="${list}">＋ Add a question</button>`;
    }
    if (p.kind === "media" || p.kind === "reels") {
      const thumb = (m) => p.kind === "reels" ? `../assets/media/reels/${encodeURIComponent(m.src)}.jpg`
        : /\.(mp4|webm|mov)$/i.test(m.src) ? (m.poster ? C.mediaUrl(m.poster, "../") : "") : C.mediaUrl(m.src, "../", 400);
      out += `<h4>${p.kind === "reels" ? "Videos" : "Photos"} <small>(${n})</small></h4><div class="ed__media">${items.map((m, i) => `<div class="ed__tile">
          <div class="ed__thumb">${thumb(m) ? `<img src="${esc(thumb(m))}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : ""}${/\.(mp4|webm|mov)$/i.test(m.src) || p.kind === "reels" ? `<span class="ed__badge">▶ video</span>` : ""}${i === 0 && p.kind === "media" ? `<span class="ed__badge ed__badge--big">shows large</span>` : ""}</div>
          ${field(`${list}.${i}.caption`, "Caption", { max: p.kind === "reels" ? 140 : 120 })}${tools(list, i, n)}</div>`).join("")}</div>`;
      const removed = def.sections[p.key].items.filter((d) => !items.some((m) => m.src === d.src));
      out += `<div class="ed__mediaadd">${p.kind === "media" ? `<label class="btn btn--gold ed__upload"><input type="file" accept="image/*" multiple data-upload="${list}" />＋ Upload photos</label>` : ""}
        ${removed.length ? `<label class="ed__f ed__restore"><span>Add back ${p.kind === "reels" ? "a video" : "a photo"} you removed</span><select data-restore="${p.key}"><option value="">Choose…</option>${removed.map((d) => `<option value="${esc(d.src)}">${esc(d.caption || d.src)}</option>`).join("")}</select></label>` : ""}</div>
        ${p.kind === "reels" ? `<p class="ed__note">New videos need to be added to the site's files (ask Freeman); here you can reorder, re-caption or hide them.</p>` : `<p class="ed__note">Photos are resized before uploading. They're stored in the shop's Google Drive and shown on the website.</p>`}`;
    }
    return out;
  }

  function count(p) {
    if (p.kind === "hero") return "";
    if (p.kind === "about" || p.kind === "head") return "";
    const n = doc.sections[p.key].items.length;
    return `${n} ${p.kind === "faq" ? "question" : p.kind === "media" ? "photo" : p.kind === "reels" ? "video" : "tile"}${n === 1 ? "" : "s"}`;
  }

  function render(openKeys) {
    const root = $("#editor");
    const open = openKeys || [...root.querySelectorAll("details[open]")].map((d) => d.dataset.k);
    root.innerHTML = `<div class="ed__intro"><div><h2>Website content</h2><p class="sub">Edit any section, then <b>Publish</b>. Visitors see the new version within about 5 minutes.</p></div>
      <a class="btn btn--ghost" href="../" target="_blank" rel="noopener">Open website ↗</a></div>
      ${PARTS.map((p) => `<details class="panel ed" data-k="${p.key}"${open.includes(p.key) ? " open" : ""}><summary><span><b>${esc(p.label)}</b><small>${esc(p.hint)}</small></span><em>${count(p)}</em></summary><div class="ed__body">${body(p)}</div></details>`).join("")}
      <div class="ed__bar" id="edBar"><span id="edState"></span><div class="ed__btns">
        <details class="ed__hist"><summary class="btn btn--ghost">History</summary><div class="ed__histlist">${history.length ? history.map((h) => `<button type="button" data-restore-at="${esc(h)}">${esc(h.replace("T", " "))}</button>`).join("") : "<p>No published versions yet.</p>"}</div></details>
        <button type="button" class="btn btn--ghost" id="edDiscard">Discard</button>
        <button type="button" class="btn btn--ghost" id="edPreview">Preview</button>
        <button type="button" class="btn btn--gold" id="edPublish">Publish</button></div></div>`;
    const av = $("#edAvatar"); if (av) av.onerror = () => { av.onerror = null; av.src = C.avatarUrl("", "../", 360); };
    state();
  }

  function state() {
    const d = isDirty();
    $("#edState").innerHTML = busy ? "Saving…" : d ? "<b>Unpublished changes</b>" : "All changes published ✓";
    $("#edPublish").disabled = !d || busy; $("#edDiscard").disabled = !d || busy;
    $("#edBar").classList.toggle("is-dirty", d);
    try { d ? localStorage.setItem(DRAFT, JSON.stringify(doc)) : localStorage.removeItem(DRAFT); } catch {}
  }

  function blank(list) {
    if (list === "hero.facts") return { big: "", small: "" };
    if (/faq/.test(list)) return { q: "", a: "" };
    if (/how/.test(list)) return { icon: "star", title: "", text: "", id: "" };
    return { icon: "star", title: "", text: "", id: "" };
  }

  // owner picture: square-ish, up to 720 px, PNG so a transparent background stays transparent
  async function shrinkAvatar(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
      const s = Math.min(1, 720 / Math.max(img.naturalWidth, img.naturalHeight)), cv = document.createElement("canvas");
      cv.width = Math.round(img.naturalWidth * s); cv.height = Math.round(img.naturalHeight * s);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      return cv.toDataURL("image/png");
    } finally { URL.revokeObjectURL(url); }
  }

  async function shrink(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
      const s = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight)), cv = document.createElement("canvas");
      cv.width = Math.round(img.naturalWidth * s); cv.height = Math.round(img.naturalHeight * s);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      return cv.toDataURL("image/jpeg", 0.82);
    } finally { URL.revokeObjectURL(url); }
  }

  function wire() {
    const root = $("#editor");
    root.addEventListener("input", (e) => {
      const p = e.target.dataset.p; if (!p) return;
      setAt(doc, p, e.target.value);
      if (e.target.tagName === "SELECT") { const prev = e.target.closest(".ed__icon"); if (prev) prev.querySelector(".ed__iconprev").innerHTML = C.icon(e.target.value); }
      state();
    });
    root.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-act]");
      if (b) {
        const list = getAt(doc, b.dataset.l), i = Number(b.dataset.i);
        if (b.dataset.act === "up") [list[i - 1], list[i]] = [list[i], list[i - 1]];
        if (b.dataset.act === "down") [list[i + 1], list[i]] = [list[i], list[i + 1]];
        if (b.dataset.act === "del") { const name = list[i].title || list[i].q || list[i].caption || list[i].big || "this item"; if (!confirm(`Delete “${name}”? You can undo with Discard (before publishing) or History.`)) return; list.splice(i, 1); }
        if (b.dataset.act === "add") { list.push(blank(b.dataset.l)); render(); const rows = $(`details[open] .ed__list`, root) && [...root.querySelectorAll("details[open] .ed__row")]; const last = rows && rows[rows.length - 1]; if (last) { last.scrollIntoView({ block: "center", behavior: "smooth" }); const inp = last.querySelector("input, textarea"); if (inp) inp.focus(); } state(); return; }
        render(); return;
      }
      if (e.target.closest("[data-act-avatar]")) { doc.owner.avatar = ""; render(); return; }
      const at = e.target.closest("[data-restore-at]");
      if (at && confirm(`Restore the version published ${at.dataset.restoreAt.replace("T", " ")}? It's published right away.`)) {
        busy = true; state();
        try { const j = await RevPit.api({ action: "content_restore", at: at.dataset.restoreAt }); if (!j.ok) throw 0; await load(true); RevPit.toast("Restored and published ✓"); }
        catch { RevPit.toast("Couldn't restore that version."); } finally { busy = false; state(); }
      }
      if (e.target.id === "edDiscard" && confirm("Throw away the unpublished changes?")) { doc = JSON.parse(saved); render(); }
      if (e.target.id === "edPreview") { try { localStorage.setItem(DRAFT, JSON.stringify(doc)); } catch {} window.open("../?preview", "_blank", "noopener"); }
      if (e.target.id === "edPublish") publish();
    });
    root.addEventListener("change", async (e) => {
      if (e.target.dataset.avatar) {
        const file = e.target.files[0]; e.target.value = "";
        if (!file || !/^image\//.test(file.type)) return;
        RevPit.toast("Uploading the picture…");
        try {
          const j = await RevPit.api({ action: "media_upload", name: "owner.png", data: await shrinkAvatar(file) });
          if (!j.ok) throw 0;
          doc.owner.avatar = "drive:" + j.id; render(); RevPit.toast("Picture uploaded. Publish to put it on the website.");
        } catch { RevPit.toast("Couldn't upload the picture. Try again."); }
        return;
      }
      const r = e.target.dataset.restore;
      if (r && e.target.value) { const item = def.sections[r].items.find((d) => d.src === e.target.value); if (item) doc.sections[r].items.push(JSON.parse(JSON.stringify(item))); render(); return; }
      const up = e.target.dataset.upload; if (!up) return;
      const files = [...e.target.files].filter((f) => /^image\//.test(f.type)); e.target.value = "";
      for (const f of files) {
        RevPit.toast(`Uploading ${f.name}…`);
        try {
          const j = await RevPit.api({ action: "media_upload", name: f.name, data: await shrink(f) });
          if (!j.ok) throw 0;
          getAt(doc, up).push({ src: "drive:" + j.id, poster: "", caption: f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), alt: "" });
          render();
        } catch { RevPit.toast(`Couldn't upload ${f.name}. Try again.`); }
      }
      if (files.length) RevPit.toast("Uploaded. Add captions, then Publish.");
    });
    addEventListener("beforeunload", (e) => { if (doc && isDirty()) { e.preventDefault(); e.returnValue = ""; } });
  }

  async function publish() {
    // empty tiles would show as blank cards: drop them before saving
    ["difference", "services", "how"].forEach((k) => (doc.sections[k].items = doc.sections[k].items.filter((t) => (t.title || "").trim())));
    doc.sections.faq.items = doc.sections.faq.items.filter((f) => (f.q || "").trim());
    doc.hero.facts = doc.hero.facts.filter((f) => (f.big || "").trim());
    busy = true; state();
    try {
      const j = await RevPit.api({ action: "content_save", content: doc });
      if (!j.ok) throw new Error(j.error);
      saved = JSON.stringify(doc); history = j.history || history; render();
      try { localStorage.removeItem("rev.content.at"); } catch {}   // this device sees the new version right away
      RevPit.toast("Published ✓ Visitors see it within about 5 minutes.");
    } catch { RevPit.toast("Couldn't publish. Check your connection and try again."); }
    finally { busy = false; state(); }
  }

  async function load(force) {
    if (doc && !force) return;
    $("#editor").innerHTML = `<p class="empty">Loading the website content…</p>`;
    def = await C.withMedia(C.base(), "../");
    const j = await RevPit.api({ action: "content_get" });
    if (!j.ok) { $("#editor").innerHTML = `<p class="empty">Couldn't load the content. Try Refresh.</p>`; return; }
    history = j.history || [];
    doc = C.merge(def, j.content);
    saved = JSON.stringify(doc);
    let draft = null; try { draft = JSON.parse(localStorage.getItem(DRAFT) || "null"); } catch {}
    if (draft && JSON.stringify(draft) !== saved && !force && confirm("You have unpublished changes from last time on this device. Keep working on them?")) doc = C.merge(def, draft);
    render(["hero"]);
  }

  let wired = false;
  window.RevEditor = { open() { if (!wired) { wire(); wired = true; } return load(false); } };
})();
