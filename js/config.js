// RevAuto settings: everything a non-developer may need to change lives here.
window.REV = {
  name: "Rev Auto",
  tagline: "Collision & body repair, done right.",
  legalName: "Q Concept Group Ventures DBA RevAuto",
  address: "2133 19th St, Sarasota, FL 34234",
  flRepairReg: "MV150669", // Florida motor vehicle repair registration (shown in the footer, as FL law asks for ads)
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=2133+19th+St+Sarasota+FL",
  mapEmbed: "https://www.google.com/maps?q=2133+19th+St,+Sarasota,+FL&output=embed",
  instagram: "https://www.instagram.com/revautosrq/",
  owner: "Mr. Uriel", // first name used by the assistant ("Who's the owner?"); set to "" to hide
  years: "10+",
  facebook: "https://www.facebook.com/revautosrq/",

  // Phone used for the Call button (and WhatsApp in the chatbot), split into pieces so it never appears on the page as text.
  // Example for (941) 555-0123: ["+1", "941", "555", "01", "23"]. Leave empty until we have it.
  phone: ["+1", "941", "548", "77", "32"], // shop line from the estimate; WhatsApp only works if this number has WhatsApp

  // Shop email for the "Email us" buttons, split so it never appears on the page as text (spam bots read pages).
  // Booking emails are sent by the Google Sheet's script (apps-script/Code.gs, SHOP_EMAIL property).
  email: ["revautosrq", "gmail.com"],

  // From the shop's Google listing.
  hours: [["Monday – Friday", "8:30 AM – 5:30 PM"], ["Saturday", "10:00 AM – 3:00 PM"], ["Sunday", "Closed"]],
  // Same hours by weekday (0 = Sunday), used by the assistant for "can I come tomorrow?"
  openByDay: ["", "8:30 AM – 5:30 PM", "8:30 AM – 5:30 PM", "8:30 AM – 5:30 PM", "8:30 AM – 5:30 PM", "8:30 AM – 5:30 PM", "10:00 AM – 3:00 PM"],

  // Google Sheet backend (apps-script/Code.gs, deployed as a web app): bookings + anonymous visit stats for the
  // private dashboard. Leave "" to switch both off. Setup: apps-script/SETUP.md
  sheetsUrl: "https://script.google.com/macros/s/AKfycbzA6go1beM5iiAo4QVOFUL4R1s5B6GXNGEI-3wlg-XAgNc-KrYPjmwZiET32PAb3jbp/exec",

  // Optional: paste a Botpress webchat script URL pair here to replace the built-in assistant.
  botpress: { inject: "", config: "" },
};
