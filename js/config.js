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
  owner: "Uriel", // first name used by the assistant ("Who's the owner?"); set to "" to hide
  years: "10+",
  facebook: "https://www.facebook.com/revautosrq/",

  // Phone used for WhatsApp and Call buttons, split into pieces so it never appears on the page as text.
  // Example for (941) 555-0123: ["+1", "941", "555", "01", "23"]. Leave empty until we have it.
  phone: ["+1", "941", "548", "77", "32"], // shop line from the estimate; WhatsApp only works if this number has WhatsApp

  // Free email copy of every booking request: create a key at https://web3forms.com with the shop's email.
  web3formsKey: "66067dfe-54fb-48a6-8984-a74f0a823a90", // sends to the shop's email (never shown on the site)

  // From the shop's Google listing.
  hours: [["Monday – Friday", "8:30 AM – 5:30 PM"], ["Saturday", "10:00 AM – 3:00 PM"], ["Sunday", "Closed"]],
  // Same hours by weekday (0 = Sunday), used by the assistant for "can I come tomorrow?"
  openByDay: ["", "8:30 AM – 5:30 PM", "8:30 AM – 5:30 PM", "8:30 AM – 5:30 PM", "8:30 AM – 5:30 PM", "8:30 AM – 5:30 PM", "10:00 AM – 3:00 PM"],

  // Optional: paste a Botpress webchat script URL pair here to replace the built-in assistant.
  botpress: { inject: "", config: "" },
};
