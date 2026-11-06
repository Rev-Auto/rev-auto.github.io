// RevAuto settings: everything a non-developer may need to change lives here.
window.REV = {
  name: "Rev Auto",
  tagline: "Collision & body repair, done right.",
  address: "2133 19th St, Sarasota, FL",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=2133+19th+St+Sarasota+FL",
  mapEmbed: "https://www.google.com/maps?q=2133+19th+St,+Sarasota,+FL&output=embed",
  instagram: "https://www.instagram.com/revautosrq/",
  years: "12+",

  // Phone used for WhatsApp and Call buttons, split into pieces so it never appears on the page as text.
  // Example for (941) 555-0123: ["+1", "941", "555", "01", "23"]. Leave empty until we have it.
  phone: [],

  // Free email copy of every booking request: create a key at https://web3forms.com with the shop's email.
  web3formsKey: "",

  // TODO: confirm with the shop.
  hours: [["Monday – Friday", "8:00 AM – 5:00 PM"], ["Saturday", "By appointment"], ["Sunday", "Closed"]],

  // Optional: paste a Botpress webchat script URL pair here to replace the built-in assistant.
  botpress: { inject: "", config: "" },
};
