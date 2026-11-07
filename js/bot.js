// Rev Auto assistant. Answers from kb.js and config.js only; never quotes prices or promises it can't keep.
// Anything it can't answer goes to the owner on WhatsApp, with the customer's question pre-filled.
// If a Botpress webchat is configured in config.js, that loads instead.
(function () {
  const R = window.REV, K = window.REV_KB, $ = (s) => document.querySelector(s);
  if (R.botpress && R.botpress.inject) {
    [R.botpress.inject, R.botpress.config].filter(Boolean).forEach((src) => document.body.appendChild(Object.assign(document.createElement("script"), { src, defer: true })));
    document.addEventListener("click", (e) => { if (e.target.closest("[data-open-chat]") && window.botpress) window.botpress.open(); });
    return;
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const CONTACT = `<div class="cbtns"><a class="btn btn--wa" href="#wa">💬 WhatsApp</a><a class="btn btn--ghost" href="#call">📞 Call</a></div>`;
  const BOOK = `<div class="cbtns"><a class="btn btn--accent" href="#book" data-close>Book an appointment</a><a class="btn btn--wa" href="#wa">💬 Send photos</a></div>`;
  const hours = () => `<ul>${R.hours.map(([d, h]) => `<li>${esc(d)}: <b>${esc(h)}</b></li>`).join("")}</ul>`;

  const INTENTS = [
    { id: "urgent", re: /tow|towing|stranded|won'?t start|not driv(e|able)|undrivable|emergency|leaking|smoke/, a: () => `Sorry you're dealing with that. 🙏 The fastest way is to reach the owner directly with your location and what happened.${CONTACT}` },
    { id: "price", re: /how much|price|cost|quote|charge|expensive|cheap|afford|ballpark/, a: (t, svc) => `Every repair is different, so I won't guess a price. 🙂 Estimates are <b>free</b>: we give you an <b>honest written estimate</b> after looking at the car${svc ? ` for your ${esc(svc.name.toLowerCase())}` : ""}, and we never upsell.<p>Fastest way: <b>send photos of the damage on WhatsApp</b>, or book a time to bring the car in.</p>${BOOK}` },
    { id: "insurance", re: /insurance|claim|adjuster|geico|progressive|state farm|allstate|usaa|deductible/, a: () => `Yes, we can work with your insurance claim. We write a detailed estimate your insurer can pay directly. Bring your <b>claim number</b> and your insurer's details, and we'll help you through it.${CONTACT}` },
    { id: "visit", re: /estimate|meet|stop by|can i come|come (in|by|over|today|tomorrow)|walk[- ]?in|drop (it|my car|the car) off|bring (it|my car|the car)( in)?|look at (it|my car)|see (him|you|the owner)/, a: (t) => `Estimates are <b>free</b>, and honest: we'll tell you what your car needs, and what it doesn't.${dayLine(t) || "<p>Walk-ins are welcome during business hours.</p>"}<p>Booking a time saves you a spot, or send photos on WhatsApp for a quick first look.</p>${BOOK}` },
    { id: "warranty", re: /warrant|guarantee|lifetime|come back if/, a: () => `Warranty terms are written on your estimate, so you'll know exactly what's covered before any work starts. For specifics, ask ${R.owner || "the owner"} directly.${CONTACT}` },
    { id: "time", re: /how long|how many days|when will|ready by|turnaround|same day|today|tomorrow|quick(ly)?|fast/, a: () => `It depends on the damage and parts. Small dents and scratches can be quick; bigger collision work takes longer. We'll give you a time estimate with your quote, and keep you posted.${BOOK}` },
    { id: "clean", re: /\bwash|detailing|\bdetail\b|vacuum/, a: () => `We're a body and paint shop, so washing and detailing aren't services we sell on their own. We do take pride in handing your car back looking its best. 😉 For anything specific, ask the owner.${CONTACT}` },
    { id: "extra", re: /extra scratch|other scratch|while (it'?s|you'?re)|also (look|fix|check)|small scratch|minor/, a: () => `Absolutely, point it out when you drop the car off. We'll take a look and tell you honestly what's worth fixing.${BOOK}` },
    { id: "luxury", re: /luxury|high[- ]end|bmw|mercedes|benz|audi|porsche|lexus|tesla|range rover|maserati|bentley|exotic|expensive car/, a: () => `Yes. We've been repairing <b>high-end cars for over ${R.years.replace('+', '')} years</b>, and we give every car the same care, luxury or everyday. Send photos for a first look.${BOOK}` },
    { id: "hours", re: /hours|open|close|closing|saturday|sunday|weekend/, a: () => `Our hours:${hours()}<p>Hours may change on holidays: message us if you're unsure.</p>` },
    { id: "where", re: /where|address|location|located|directions|find you|map|parking/, a: () => `We're at <b>${esc(R.address)}</b>.<div class="cbtns"><a class="btn btn--ghost" href="${R.mapsUrl}" target="_blank" rel="noopener">Directions ↗</a></div>` },
    { id: "book", re: /book|appointment|schedule|reserve|drop (it|my car) off|bring (it|my car) in|come in/, a: () => `Walk-ins are welcome! To get a set time, book online in a minute: pick your service, day and time, and we'll confirm by text or call.${BOOK}` },
    { id: "pay", re: /pay|payment|card|cash|zelle|financ/, a: () => `Payment is due when you pick up your car. For accepted payment methods or financing, ask the owner directly.${CONTACT}` },
    { id: "email", re: /e-?mail|gmail/, a: () => `The fastest way to reach the owner is WhatsApp or a call. You can also book online and we'll get right back to you.${CONTACT}` },
    { id: "social", re: /instagram|facebook|\big\b|social|follow|pictures of your work|photos of your work/, a: () => `See our latest work and follow along: <div class="cbtns"><a class="btn btn--ghost" href="${R.instagram}" target="_blank" rel="noopener">Instagram ↗</a><a class="btn btn--ghost" href="${R.facebook}" target="_blank" rel="noopener">Facebook ↗</a></div>` },
    { id: "about", re: /who are you|about|family|experience|years|trust|reviews?|good shop|honest/, a: () => `${esc(K.about)}<p>See our work on <a href="${R.instagram}" target="_blank" rel="noopener">Instagram ↗</a>.</p>` },
    { id: "contact", re: /contact|phone|number|call|text|whatsapp|talk to|speak|human|person/, a: () => `The fastest way to reach the owner is WhatsApp. You can also call.${CONTACT}` },
    { id: "services", re: /what (do|can) you (do|offer|fix)|what services|your services|services do you|specialt/, a: () => `Bodywork is our specialty, and we understand all things auto:<ul>${K.services.map((s) => `<li><b>${esc(s.name)}</b>: ${esc(s.short)}</li>`).join("")}</ul>Which one do you need?` },
    { id: "thanks", re: /^(thanks|thank you|thx|ty|great|perfect|awesome|ok|okay)\b/, a: () => "Anytime! 🙌 Anything else I can help with?" },
    { id: "greet", re: /^(hi|hello|hey|good (morning|afternoon|evening)|yo|hola)\b/, a: () => `Hi! 👋 I'm Rev Auto's assistant. Ask me about repairs, estimates, insurance, hours or booking.` },
  ];

  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  // "tomorrow" / "today" / a weekday in the question -> that day's hours
  function dayLine(t) {
    const now = new Date(), named = DAYS.findIndex((d) => t.includes(d.toLowerCase()));
    const i = /tomorrow/.test(t) ? (now.getDay() + 1) % 7 : /today|this morning|this afternoon/.test(t) ? now.getDay() : named;
    if (i < 0 || !R.openByDay) return "";
    const label = /tomorrow/.test(t) ? `Tomorrow (${DAYS[i]})` : /today|this morning|this afternoon/.test(t) ? "Today" : DAYS[i];
    return R.openByDay[i] ? `<p>${label} we're open <b>${esc(R.openByDay[i])}</b>. Walk-ins are welcome.</p>` : `<p>${label} we're closed. Pick another day below, or message us.</p>`;
  }
  const ownerLine = () => (R.owner ? `${esc(R.owner)} is the owner 👋, and he looks after his customers personally. ` : "Rev Auto is family-owned, and the owner looks after his customers personally. ");

  function reply(text) {
    const t = text.toLowerCase().replace(/[’']/g, "'").trim();
    const svc = [...K.services].sort((a, b) => (b.id === "dent") - (a.id === "dent")).find((s) => s.kw.test(t));
    const hit = INTENTS.find((i) => i.re.test(t) && !(["greet", "thanks"].includes(i.id) && (svc || t.split(/\s+/).length > 4)));
    // "who's the owner? can I meet him tomorrow?" -> introduce the owner, then answer the rest
    const asksOwner = /\bowner|who (runs|owns)|who'?s (in charge|the boss)|uriel/.test(t);
    if (asksOwner) {
      const rest = INTENTS.find((i) => i.re.test(t) && !["about", "greet", "thanks", "contact"].includes(i.id));
      return { html: ownerLine() + (rest ? rest.a(t, svc) : `You can reach him directly:${CONTACT}`), chips: ["Book an appointment", "Where are you?"] };
    }
    if (hit && !(hit.id === "services" && svc)) return { html: hit.a(t, svc), chips: hit.id === "price" ? ["Do you work with insurance?", "How long does it take?"] : ["Book an appointment", "Where are you?"] };
    if (svc) return { html: `<b>${esc(svc.name)}</b>: yes, we do that. ${esc(svc.short)}${svc.id === "audio" ? " Bodywork is our specialty, but installs like this are part of our all-around auto know-how." : ""}<p>Send photos or book a time and we'll give you a clear estimate.</p>${BOOK}`, chips: ["How much will it cost?", "How long does it take?"] };
    const faq = K.faq.find(([q]) => { const w = q.toLowerCase().split(/\W+/).filter((x) => x.length > 4); return w.filter((x) => t.includes(x)).length >= 2; });
    if (faq) return { html: esc(faq[1]) };
    return { html: `Good question. I'd rather not guess, so let's get you a real answer from the owner. Tap WhatsApp: your question is already in the message.${CONTACT}`, chips: ["What services do you offer?", "Book an appointment"] };
  }
  window.RevBot = { reply };

  // ---------- widget
  const root = $("#assistant");
  root.innerHTML = `<button class="chat-fab" id="chatFab" type="button"><span class="brand__mark">R</span>Questions? Ask us</button>
    <section class="chat" id="chat" hidden role="dialog" aria-label="Rev Auto assistant">
      <header class="chat__head"><span class="brand__mark">R</span><div><b>Rev Auto assistant</b><small>Quick answers · owner on WhatsApp</small></div><button class="chat__x" id="chatX" aria-label="Close">×</button></header>
      <div class="chat__log" id="chatLog" aria-live="polite"></div><div class="chat__chips" id="chatChips"></div>
      <form class="chat__form" id="chatForm"><input id="chatIn" autocomplete="off" placeholder="Ask about repairs, estimates, hours…" aria-label="Message" /><button class="btn btn--accent btn--sm">Send</button></form>
    </section>`;
  const log = $("#chatLog"), chips = (l) => ($("#chatChips").innerHTML = (l || []).map((x) => `<button type="button">${esc(x)}</button>`).join(""));
  const add = (who, html) => { const d = document.createElement("div"); d.className = `msg msg--${who}`; d.innerHTML = html; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; };
  let started = false;
  const open = () => { $("#chat").hidden = false; $("#chatFab").hidden = true; if (!started) { started = true; add("bot", `Hi! 👋 I'm Rev Auto's assistant. How can I help with your car today?`); chips(["Get an estimate", "Do you work with insurance?", "Hours", "Book an appointment"]); } setTimeout(() => $("#chatIn").focus(), 50); };
  const close = () => { $("#chat").hidden = true; $("#chatFab").hidden = false; };
  function ask(text) {
    if (!text.trim()) return; add("me", esc(text)); chips([]); window.RevContact.lastQuestion = text;
    const typing = add("bot", `<span class="typing"><i></i><i></i><i></i></span>`), r = reply(text);
    setTimeout(() => { typing.innerHTML = r.html; log.scrollTop = log.scrollHeight; chips(r.chips); }, 350 + Math.min(700, r.html.length));
  }
  $("#chatFab").onclick = open; $("#chatX").onclick = close;
  $("#chatForm").onsubmit = (e) => { e.preventDefault(); const v = $("#chatIn").value; $("#chatIn").value = ""; ask(v); };
  $("#chatChips").onclick = (e) => { const b = e.target.closest("button"); if (b) ask(b.textContent); };
  log.addEventListener("click", (e) => { if (e.target.closest("[data-close]") && innerWidth < 700) close(); });
  document.addEventListener("click", (e) => { const a = e.target.closest("[data-ask]"); if (a) { open(); ask(a.dataset.ask); } if (e.target.closest("[data-open-chat]")) open(); });
})();
