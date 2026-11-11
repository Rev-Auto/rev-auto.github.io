// Rev Auto website content.
// Defaults = what the site ships with (built from kb.js + the texts below). The owner edits everything in the
// dashboard (pit/ → Website); published edits are fetched from the Google Sheet and replace the defaults.
// Used by the website (main.js) and by the dashboard's editor (pit.js).
(function () {
  const R = window.REV || {}, K = window.REV_KB || {};

  // ---------- icons (one stroke style everywhere)
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
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.6-.4-.4-2.6z"/>',
    paint: '<path d="M4 4h12v5H4z"/><path d="M16 6h3v5h-8v3"/><rect x="9" y="14" width="4" height="7" rx="1"/>',
    camera: '<path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/>',
  };
  const ICON_LABELS = { car: "Car", hammer: "Hammer", spray: "Spray can", dent: "Dent", bumper: "Bumper", radio: "Radio", search: "Magnifier",
    star: "Star", spark: "Sparkle", handshake: "Handshake", shield: "Shield", clock: "Clock", wrench: "Wrench", paint: "Paint roller", camera: "Camera" };
  const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ICONS.star}</svg>`;

  // ---------- defaults
  function base() {
    return {
      v: 1,
      hero: {
        eyebrow: "Family‑owned · Sarasota, FL · Insurance · Walk‑ins · Custom work",
        title: "Value first.", accent: "Your satisfaction, always.",
        lead: "We take pride in every repair and meet you where you are: walk in or book online, insurance or out of pocket, everyday car or exotic. Honest estimates, honest work, and a little extra value on every job.",
        facts: [{ big: "10+", small: "years of experience" }, { big: "Free", small: "estimates" }, { big: "Honest", small: "advice, no upselling" }, { big: "Lifetime", small: "labor warranty" }],
      },
      owner: { kicker: "Meet the owner", name: R.owner || "Mr. Uriel", avatar: "",
        text: "10+ years repairing everything from a '69 Porsche 912 to a Ram TRX. Known for honest advice, fair estimates, and treating every car like his own. That's his cartoon twin in our videos." },
      about: K.about || "",
      sections: {
        difference: { nav: "Why us", kicker: "The Rev Auto difference", title: "Most shops fix the damage. We take care of the car.", text: "",
          items: (K.difference || []).map(([title, text], i) => ({ icon: ["spark", "search", "handshake", "shield"][i] || "star", title, text, id: "" })) },
        services: { nav: "Services", kicker: "Services", title: "Bodywork is our specialty. Cars are our whole world.", text: "",
          items: (K.services || []).map((s) => ({ icon: s.icon, title: s.name, text: s.short, id: s.id })) },
        work: { nav: "Our work", kicker: "Our work", title: "Before, after, and everything in between.", text: "", items: [] },
        reels: { nav: "", kicker: "From the shop floor", title: "Watch the work happen", text: "", items: [] },
        how: { nav: "", kicker: "How it works", title: "Three steps back to the road.", text: "", items: [
          { icon: "camera", title: "Book or send photos", text: "Pick a time online and add photos of the damage to your request.", id: "" },
          { icon: "search", title: "Get an honest estimate", text: "Free. We inspect the car and tell you honestly what it needs, and what it doesn't.", id: "" },
          { icon: "shield", title: "Pick it up, done right", text: "Your car comes back fixed right, and our labor is warrantied for as long as you own it.", id: "" }] },
        book: { nav: "", kicker: "Book online", title: "Request an appointment.",
          text: "Tell us about your car, add a few photos of the damage, and pick a time that works. We'll confirm by email." },
        faq: { nav: "FAQ", kicker: "FAQ", title: "Good questions.", text: "Ask our assistant anything about the shop, or email us directly.",
          items: (K.faq || []).map(([q, a]) => ({ q, a })) },
        visit: { nav: "Visit", kicker: "Visit", title: "Come see the shop.", text: "" },
      },
    };
  }

  // gallery.json + reels.json are the default "Our work" photos and shop-floor videos
  async function withMedia(c, root) {
    const get = (f) => fetch(root + "assets/media/" + f).then((r) => (r.ok ? r.json() : [])).catch(() => []);
    const [gallery, reels] = await Promise.all([get("gallery.json"), get("reels.json")]);
    c.sections.work.items = gallery.map((m) => ({ src: m.src, poster: m.poster || "", caption: m.caption || "", alt: m.alt || "" }));
    c.sections.reels.items = reels.map((m) => ({ src: m.src, caption: m.caption || "" }));
    return c;
  }

  // the owner's version wins; an empty heading falls back to the default so the page never shows a hole
  function merge(def, live) {
    if (!live || typeof live !== "object") return def;
    const out = JSON.parse(JSON.stringify(def));
    const pick = (a, b) => (typeof b === "string" && b.trim() ? b : a);
    ["eyebrow", "title", "accent", "lead"].forEach((k) => (out.hero[k] = pick(def.hero[k], live.hero && live.hero[k])));
    if (live.hero && Array.isArray(live.hero.facts)) out.hero.facts = live.hero.facts;
    ["kicker", "name", "text"].forEach((k) => (out.owner[k] = pick(def.owner[k], live.owner && live.owner[k])));
    out.owner.avatar = (live.owner && typeof live.owner.avatar === "string") ? live.owner.avatar : "";
    out.about = pick(def.about, live.about);
    Object.keys(def.sections).forEach((k) => {
      const L = (live.sections || {})[k]; if (!L) return;
      ["nav", "kicker", "title"].forEach((f) => (out.sections[k][f] = pick(def.sections[k][f], L[f])));
      if (typeof L.text === "string") out.sections[k].text = L.text;
      if (Array.isArray(L.items) && def.sections[k].items) out.sections[k].items = L.items;
    });
    return out;
  }

  // media path for the website (root "") or the dashboard (root "../")
  function mediaUrl(src, root, size) {
    if (/^drive:/.test(src)) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(src.slice(6))}&sz=w${size || 1600}`;
    return root + "assets/media/" + src;
  }

  // the owner's cartoon picture: an uploaded one (Drive, served resized with its transparent background) or the original
  function avatarUrl(src, root, size) {
    if (/^drive:/.test(src || "")) return `https://lh3.googleusercontent.com/d/${encodeURIComponent(src.slice(6))}=s${size}`;
    return root + (size <= 120 ? "assets/img/mr-uriel-96.png" : "assets/img/mr-uriel.png");
  }

  // published content, cached on this device so repeat visits show it immediately
  const CACHE = "rev.content";
  function cached() { try { return JSON.parse(localStorage.getItem(CACHE) || "null"); } catch { return null; } }
  // Each device asks the Sheet for changes at most every 5 minutes (keeps the free Google quota for busy days).
  const FRESH = 5 * 60 * 1000;
  async function fetchLive() {
    if (!R.sheetsUrl) return null;
    try { if (Date.now() - Number(localStorage.getItem(CACHE + ".at") || 0) < FRESH) return null; } catch {}
    const ctrl = "AbortController" in window ? new AbortController() : null, t = setTimeout(() => ctrl && ctrl.abort(), 9000);
    try {
      const r = await fetch(R.sheetsUrl + "?a=content", { signal: ctrl && ctrl.signal });
      const j = await r.json();
      try { localStorage.setItem(CACHE + ".at", String(Date.now())); } catch {}
      if (j && j.ok && j.content) { try { localStorage.setItem(CACHE, JSON.stringify(j.content)); } catch {} return j.content; }
      if (j && j.ok && !j.content) { try { localStorage.removeItem(CACHE); } catch {} }
      return null;
    } catch { return null; } finally { clearTimeout(t); }
  }
  // dashboard preview: ?preview shows the unpublished draft saved on this device by the editor
  function draft() { try { return new URLSearchParams(location.search).has("preview") ? JSON.parse(localStorage.getItem("rev.draft") || "null") : null; } catch { return null; } }

  // the chatbot answers from the same content
  function teachBot(c) {
    if (!window.REV_KB) return;
    const KB = window.REV_KB, kwById = {}; (KB._services || KB.services || []).forEach((s) => (kwById[s.id] = s.kw));
    if (!KB._services) KB._services = KB.services;
    const words = (t) => t.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !/^(and|with|your|repair|work)$/.test(w));
    KB.about = c.about || KB.about;
    KB.difference = c.sections.difference.items.map((t) => [t.title, t.text]);
    KB.services = c.sections.services.items.map((t, i) => ({ id: t.id || "svc" + i, icon: t.icon, name: t.title, short: t.text,
      kw: kwById[t.id] || new RegExp(words(t.title).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") || "^$") }));
    KB.faq = c.sections.faq.items.map((f) => [f.q, f.a]);
  }

  window.RevContent = { ICONS, ICON_LABELS, icon, base, withMedia, merge, mediaUrl, avatarUrl, cached, fetchLive, draft, teachBot };
})();
