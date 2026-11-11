"""Make the website's logo files from the owner's logo (gold on a black background).

Usage:  python3 tools/make_logos.py "/path/to/RevAuto logo (black).png"     (needs: pip install pillow)

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


def deepen(im, f=0.72):
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
    """The lettering only: the ring is thin, the letters are dense. Keep the columns from the first dense one."""
    a = im.getchannel("A").point(lambda v: 255 if v > 60 else 0)
    w, h = a.size
    cols = [sum(1 for y in range(h) if a.getpixel((x, y))) for x in range(w)]
    dense = [x for x, n in enumerate(cols) if n > h * 0.02]
    # the ring's left side is also dense: skip it by starting after the first gap following it
    start = dense[0]
    for x in range(dense[0], w - 1):
        if cols[x] <= h * 0.004 and x - dense[0] > w * 0.04:
            start = x
            break
    word = im.crop((start, 0, w, h))
    # drop the ring's thin right/bottom arc: keep rows that have real letter density
    a2 = word.getchannel("A").point(lambda v: 255 if v > 60 else 0)
    rows = [sum(1 for x in range(word.width) if a2.getpixel((x, y))) for y in range(word.height)]
    keep = [y for y, n in enumerate(rows) if n > word.width * 0.012]
    return crop(word.crop((0, keep[0], word.width, keep[-1] + 1)) if keep else word, 6)


def fit(im, width):
    h = round(im.height * width / im.width)
    return im.resize((width, h), Image.LANCZOS)


def main(path):
    src = Image.open(path)
    full = crop(transparent(src))
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
