// RevAuto knowledge base: what the website and the assistant know. Edit here; both update together.
// Facts marked "confirm" came from a single visit or are typical for a body shop: have the owner confirm them.
window.REV_KB = {
  about: "Rev Auto is a family-owned body shop at 2133 19th St in Sarasota, with over 12 years of experience repairing cars, including high-end vehicles. Insurance jobs, walk-ins and custom work are all welcome, from everyday cars to Aston Martins and classic restorations. The owner treats every car like it's his own: you'll never feel like money comes before your satisfaction.",

  difference: [
    ["Your car comes back clean", "We don't just fix the damage and hand back a dirty car. Cars leave our shop washed, at no extra charge."],
    ["We notice the little things", "Point out that extra scratch or scuff. We'll take a look, and we're honest about what's worth fixing."],
    ["Straight talk, lifetime labor warranty", "Clear written estimates, no upselling, and our labor is guaranteed for as long as you own the car."],
    ["High-end care for every car", "12+ years of experience with luxury and everyday cars alike."],
  ],

  services: [
    { id: "collision", icon: "car", name: "Collision repair", short: "Accident damage repaired to factory look and fit.", kw: /collision|accident|crash|wreck|hit|fender ?bender|rear[- ]?end/ },
    { id: "body", icon: "hammer", name: "Bodywork & panels", short: "Fenders, doors, quarter panels, hoods and bumpers repaired or replaced.", kw: /body ?work|panel|fender|door|quarter|hood|trunk|bumper/ },
    { id: "paint", icon: "spray", name: "Paint & refinishing", short: "Color-matched paint, blending and clear coat.", kw: /paint|respray|clear ?coat|color match|fade|peeling/ },
    { id: "dent", icon: "dent", name: "Dent & scratch repair", short: "Dings, dents, scuffs and key scratches.", kw: /dent|ding|scratch|scuff|key(ed)?|hail/ },
    { id: "bumper", icon: "bumper", name: "Bumper repair", short: "Cracked, scraped or pushed-in bumpers fixed or replaced.", kw: /bumper|crack/ },
    { id: "audio", icon: "radio", name: "Radio & electronics install", short: "Car radios, screens and accessories installed cleanly.", kw: /radio|stereo|head ?unit|carplay|android auto|speaker|screen|camera|electronic|install/ },
    { id: "custom", icon: "star", name: "Custom work & restoration", short: "Custom paint, widebody kits, wheels and trim, and classic car restorations.", kw: /custom|restor|classic|vintage|widebody|body ?kit|wheel|rim|wrap|two[- ]?tone|color change/ },
    { id: "upgrades", icon: "spark", name: "Brakes, suspension & upgrades", short: "Brakes, coilovers, lighting, wings and other upgrades.", kw: /brake|coilover|suspension|lower(ing)?|wing|spoiler|\blights?\b|headlight|taillight|upgrade|exhaust/ },
    { id: "inspection", icon: "search", name: "Damage check & advice", short: "Not sure what's wrong? We'll look and tell you straight.", kw: /check|inspect|diagnos|look at|noise|advice/ },
  ],

  faq: [
    ["How do I get an estimate?", "Book an appointment online or send us photos of the damage on WhatsApp. We'll look at the car and give you a clear written estimate before any work starts."],
    ["Do you work with insurance?", "Yes. We write a detailed estimate your insurer can pay directly. Bring your claim number and insurance details, and we'll help with the process."],
    ["Do you offer a warranty?", "Yes. Our labor is warrantied for life for the current owner of the car, and parts carry the manufacturer's warranty (usually 6 to 12 months)."],
    ["Will I get a written estimate?", "Always. You get a clear written estimate before any work starts, and we won't go over it without your approval."],
    ["When should I pick up my car?", "We'll let you know as soon as it's ready. Please pick it up within 3 days of that notice: after that, a storage fee applies."],
    ["Do I need an appointment?", "Walk-ins are welcome. Booking online gets you a set time, so we can look at your car right away."],
    ["How long will my repair take?", "It depends on the damage and parts. Small repairs can take a day or two; bigger collision work takes longer. We'll give you a time estimate with your quote."],
    ["Do you work on luxury cars?", "Yes. We've repaired high-end cars for over 12 years, and we treat every car with the same care."],
    ["Do you only do bodywork?", "Bodywork is our specialty, but we understand all things auto, including installing radios and electronics. Ask us about your car."],
    ["Will my car come back clean?", "Yes. We return cars clean, at no extra charge."],
    ["How do I pay?", "Payment is due when you pick up your car. Ask us which payment methods we accept."],
  ],
};
