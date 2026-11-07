# Rev Auto website

Family-owned collision & body repair, 2133 19th St, Sarasota, FL. Static site (GitHub Pages).

## Edit
- `js/config.js`: phone (for hidden WhatsApp/Call buttons), Web3Forms key (booking emails), hours, Botpress.
- `js/kb.js`: the knowledge base: about, "difference", services, FAQ. The page and the assistant both read it.
- Gallery: 16 hand-picked photos/clips from @revautosrq (with the owner's permission), captions in `assets/media/gallery.json`. To bulk-import more: `python3 tools/import_media.py <download folder>` compresses photos/videos, makes video posters and writes `gallery.json`.
- Photos/videos by hand: put files in `assets/media/` and list them in `assets/media/gallery.json`, e.g. `[{"src": "bumper-before-after.jpg", "alt": "Bumper repair"}]` (the first item shows large).
- Logo: replace the "R" mark (`.brand__mark` in `index.html`) and `assets/img/favicon.svg`.

## Themes
Auto (default) follows the time of day: Showroom (white/blue/orange) 7am–5pm, Garage (blue/orange/gold) 5–8pm and 5–7am, Midnight (black/gold) at night. Visitors can pick one; it's remembered.

## Assistant
Built-in (`js/bot.js`), answers from `kb.js`; unknown questions go to WhatsApp with the question pre-filled. To use Botpress instead, upload `botpress/revauto-knowledge.md` as a knowledge source and paste the two webchat script URLs into `config.js`.
