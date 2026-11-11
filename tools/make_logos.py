"""Make the website's logo files from the owner's logo (gold on a black background).

Usage:  python3 tools/make_logos.py assets/brand/revauto-logo-750.png      (needs: pip install pillow)
        Works with a transparent PNG (used as is) or a logo on a black background (the black is removed).

Writes to assets/img/:
  logo-luxe-dark.png        full logo, transparent background, bright gold   (Garage / Midnight themes, dashboard lock)
  logo-luxe-light.png       full logo, transparent background, deeper gold   (Showroom theme: reads on white)
  logo-luxe-dark-word.png   "Rev Auto / Luxe Paint & Repair" without the ring (header)
  logo-luxe-light-word.png
  apple-touch-icon.png      180x180, gold on black (phones' home screen)
"""
import os
import sys

from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "img")


def transparent(src):
    """Black background -> transparent. Brightness becomes opacity, the gold stays gold (no dark fringes)."""
    im = src.convert("RGB")
    px = im.load()
    out = Image.new("RGBA", im.size)
    op = out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = px[x, y]
            a = max(r, g, b)
            if a < 18:
                op[x, y] = (0, 0, 0, 0)
                continue
            k = 255 / a                                    # un-premultiply against black
            op[x, y] = (min(255, round(r * k)), min(255, round(g * k)), min(255, round(b * k)), min(255, round(a * 1.08)))
    return out


def deepen(im, f=0.6):
    """Deeper gold for white backgrounds."""
    r, g, b, a = im.split()
    return Image.merge("RGBA", [c.point(lambda v: round(v * f)) for c in (r, g, b)] + [a])


def crop(im, pad=10):
    box = im.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
    if not box:
        return im
    l, t, r, b = box
    return im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))


def wordmark(im):
    """The lettering only, for the header: crop the text area (the ring is thin and stays outside it on the left
    and bottom), then fade out what's left of the ring's thin right edge."""
    w, h = im.size
    word = im.crop((int(w * 0.135), int(h * 0.30), w, int(h * 0.86)))
    px = word.load()
    cx, cy, r = w * 0.415 - w * 0.135, h * 0.495 - h * 0.30, w * 0.40    # ring centre and radius (in crop coordinates)
    for y in range(word.height):
        for x in range(word.width):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if abs(d - r) < w * 0.018 and x < w * 0.18:             # ring pieces at the crop's left edge
                p = px[x, y]; px[x, y] = (p[0], p[1], p[2], 0)
    return crop(word, 6)


def fit(im, width):
    h = round(im.height * width / im.width)
    return im.resize((width, h), Image.LANCZOS)


def main(path):
    src = Image.open(path)
    has_alpha = src.mode in ("RGBA", "LA") and src.getchannel("A").getextrema()[0] < 250
    full = crop(src.convert("RGBA") if has_alpha else transparent(src))
    word = wordmark(full)
    jobs = {
        "logo-luxe-dark.png": fit(full, 600), "logo-luxe-light.png": fit(deepen(full), 600),
        "logo-luxe-dark-word.png": fit(word, 520), "logo-luxe-light-word.png": fit(deepen(word), 520),
    }
    for name, img in jobs.items():
        img.save(os.path.join(OUT, name), optimize=True)
        print(name, img.size)
    icon = Image.new("RGB", (180, 180), (10, 10, 12))
    mark = fit(full, 168)
    icon.paste(mark, ((180 - mark.width) // 2, (180 - mark.height) // 2), mark)
    icon.save(os.path.join(OUT, "apple-touch-icon.png"), optimize=True)
    print("apple-touch-icon.png (180, 180)")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
