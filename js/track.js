// Anonymous, cookie-free activity for the private dashboard: one "visit" per browsing session, plus taps
// (WhatsApp, Call, booking, chatbot). Sends nothing until config.js has a sheetsUrl.
// Devices that signed in to the dashboard are skipped, so the owner's own visits don't count.
(function () {
  const url = (window.REV || {}).sheetsUrl;
  const store = (s, k) => { try { let v = s.getItem(k); if (!v) { v = Math.random().toString(36).slice(2, 10); s.setItem(k, v); } return v; } catch { return "anon"; } };
  const skip = (() => { try { return localStorage.getItem("rev.noTrack") === "1"; } catch { return false; } })();
  const visitor = store(window.localStorage, "rev.v"), session = store(window.sessionStorage, "rev.s");

  const qs = new URLSearchParams(location.search);
  let ref = ""; try { ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : ""; } catch {}
  if (ref === location.hostname) ref = "";
  const from = (h) => /google\./.test(h) ? "google" : /instagram\./.test(h) ? "instagram" : /facebook\.|fb\./.test(h) ? "facebook"
    : /bing\./.test(h) ? "bing" : /yahoo\./.test(h) ? "yahoo" : /whatsapp|wa\.me/.test(h) ? "whatsapp" : h ? h : "direct";
  const source = (qs.get("src") || qs.get("utm_source") || "").toLowerCase().slice(0, 30) || from(ref);
  const device = matchMedia("(pointer: coarse)").matches ? (Math.min(screen.width, screen.height) < 600 ? "phone" : "tablet") : "desktop";
  const base = { visitor, session, source, ref, device, page: location.pathname };

  function post(body) {
    const data = JSON.stringify(body);
    try { if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([data], { type: "text/plain" }))) return; } catch {}
    fetch(url, { method: "POST", mode: "no-cors", body: data, headers: { "Content-Type": "text/plain" }, keepalive: true }).catch(() => {});
  }

  window.RevTrack = {
    source,
    event(type, detail) { if (url && !skip) post({ kind: "event", type, detail: String(detail || "").slice(0, 300), ...base }); },
    // bookings always go to the sheet (even from the owner's devices) and return the reference number
    async booking(d) {
      if (!url) throw new Error("no sheet");
      const r = await fetch(url, { method: "POST", body: JSON.stringify({ kind: "booking", ...d, visitor, source }), headers: { "Content-Type": "text/plain" } });
      const j = await r.json(); if (!j.ok) throw new Error(j.error || "failed"); return j.ref;
    },
  };

  // only mark the visit as counted once it was really sent (not while unconnected or on a signed-in device)
  if (url && !skip) { try { if (!sessionStorage.getItem("rev.seen")) { sessionStorage.setItem("rev.seen", "1"); RevTrack.event("visit"); } } catch { RevTrack.event("visit"); } }
})();
