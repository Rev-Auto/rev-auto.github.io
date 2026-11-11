# Rev Auto website

Family-owned collision & body repair, 2133 19th St, Sarasota, FL. Static site (GitHub Pages).

## Edit
- **Most content is edited in the dashboard** (`pit/` → **🌐 Website**): every section's headings, tiles (add, delete, reorder, pick an icon), FAQ, gallery photos (upload, caption, reorder), shop-floor videos (reorder, caption, hide), and the owner's cartoon picture. **Publish** and visitors see it within about 5 minutes; **History** restores any of the last 30 versions.
- `js/config.js`: shop email and phone (split so they never appear on the page as text), hours, Google Sheet URL.
- `js/kb.js` + `js/content.js`: the starting content. The dashboard's published version replaces it; the assistant answers from the same content.
- Gallery: 16 hand-picked photos/clips from @revautosrq (with the owner's permission), captions in `assets/media/gallery.json`. To bulk-import more: `python3 tools/import_media.py <download folder>` compresses photos/videos, makes video posters and writes `gallery.json`.
- Photos/videos by hand: put files in `assets/media/` and list them in `assets/media/gallery.json`, e.g. `[{"src": "bumper-before-after.jpg", "alt": "Bumper repair"}]` (the first item shows large).
- Logo: "Rev Auto · Luxe Paint & Repair" in `assets/img/logo-luxe-*.png`: full logo in the hero and footer, the `-word` version in the header; `-light` for the Showroom theme, `-dark` for Garage/Midnight. To replace it: `python3 tools/make_logos.py "<logo on black>.png"` makes all four plus the phone icon.
- Mr. Uriel's cartoon persona: `assets/img/mr-uriel.png` (owner card) and `mr-uriel-96.png` (chat button).
- Reels strip ("From the shop floor"): clips in `assets/media/reels/` listed in `assets/media/reels.json`.
- QR codes (all open https://ftalla18.github.io/revauto/): `qr/revauto-qr-gold-on-black.png`, `qr/revauto-qr-print.png` (for printing), `qr/revauto-qr-plain.svg` (any size).

## Themes
Auto (default) follows the time of day: Showroom (white/blue/orange) 7am–5pm, Garage (blue/orange/gold) 5–8pm and 5–7am, Midnight (black/gold) at night. Visitors can pick one from the palette button (bottom-left); it's remembered.

## Assistant
Built-in (`js/bot.js`), answers from the published content; unknown questions go to the owner by email (or WhatsApp) with the question pre-filled. To use Botpress instead, upload `botpress/revauto-knowledge.md` as a knowledge source and paste the two webchat script URLs into `config.js`.

## Bookings database + private dashboard
- Booking requests (with up to 5 photos, shrunk on the customer's phone) go to the Google Sheet, which emails the shop at revautosrq@gmail.com right away with the photos and an **Approve** button. Approving (from the email or the dashboard) marks it Confirmed and emails the customer a confirmation with a calendar invite. Photos are kept privately in the shop's Google Drive and show on each request in the dashboard.
- `apps-script/Code.gs` runs inside that Google Sheet (setup: `apps-script/SETUP.md`). Its URL goes in `js/config.js` as `sheetsUrl`; leave it empty to switch the Sheet and stats off.
- `js/track.js`: anonymous, cookie-free stats (visits, source incl. `?src=qr`, device, email/call taps, chatbot questions).
- Dashboard: `pit/` (not linked; noindex). Five quick taps on the footer's © line open it. Passcode = `ADMIN_KEY` in the script's properties. `pit/?demo` previews it with sample data.
