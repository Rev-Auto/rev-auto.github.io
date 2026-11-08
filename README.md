# Rev Auto website

Family-owned collision & body repair, 2133 19th St, Sarasota, FL. Static site (GitHub Pages).

## Edit
- `js/config.js`: phone (for hidden WhatsApp/Call buttons), Web3Forms key (booking emails), hours, Botpress.
- `js/kb.js`: the knowledge base: about, "difference", services, FAQ. The page and the assistant both read it.
- Gallery: 16 hand-picked photos/clips from @revautosrq (with the owner's permission), captions in `assets/media/gallery.json`. To bulk-import more: `python3 tools/import_media.py <download folder>` compresses photos/videos, makes video posters and writes `gallery.json`.
- Photos/videos by hand: put files in `assets/media/` and list them in `assets/media/gallery.json`, e.g. `[{"src": "bumper-before-after.jpg", "alt": "Bumper repair"}]` (the first item shows large).
- Logo: "Rev Auto · Lux Paint & Repair" (from the shop sign) in `assets/img/logo-lux-*.png`: full logo in the hero and footer, the `-word` version in the header; `-light` for the Showroom theme, `-dark` for Garage/Midnight.
- Mr. Uriel's cartoon persona: `assets/img/mr-uriel.png` (owner card) and `mr-uriel-96.png` (chat button).
- Reels strip ("From the shop floor"): clips in `assets/media/reels/` listed in `assets/media/reels.json`.
- QR codes (all open https://ftalla18.github.io/revauto/): `qr/revauto-qr-gold-on-black.png`, `qr/revauto-qr-print.png` (for printing), `qr/revauto-qr-plain.svg` (any size).

## Themes
Auto (default) follows the time of day: Showroom (white/blue/orange) 7am–5pm, Garage (blue/orange/gold) 5–8pm and 5–7am, Midnight (black/gold) at night. Visitors can pick one from the palette button (bottom-left); it's remembered.

## Assistant
Built-in (`js/bot.js`), answers from `kb.js`; unknown questions go to WhatsApp with the question pre-filled. To use Botpress instead, upload `botpress/revauto-knowledge.md` as a knowledge source and paste the two webchat script URLs into `config.js`.

## Bookings database + private dashboard
- Booking requests go to Mr. Uriel's email (Web3Forms) **and** a Google Sheet at the same time; the customer sees a confirmation card with a reference number and an "Add to my calendar" file.
- `apps-script/Code.gs` runs inside that Google Sheet (setup: `apps-script/SETUP.md`). Its URL goes in `js/config.js` as `sheetsUrl`; leave it empty to switch the Sheet and stats off.
- `js/track.js`: anonymous, cookie-free stats (visits, source incl. `?src=qr`, device, WhatsApp/Call taps, chatbot questions).
- Dashboard: `pit/` (not linked; noindex). Five quick taps on the footer's © line open it. Passcode = `ADMIN_KEY` in the script's properties. `pit/?demo` previews it with sample data.
