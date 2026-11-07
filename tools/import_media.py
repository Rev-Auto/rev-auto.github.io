"""Turn a folder of Instagram downloads (Instaloader or an Instagram "Download your information" export)
into web-ready gallery media.

    python3 tools/import_media.py ~/Downloads/revautosrq [--max 24]

Photos -> assets/media/*.jpg (max 1600px). Videos -> muted H.264 MP4 (max 720px wide) plus a poster frame.
Newest first, and the first video becomes the large tile. Writes assets/media/gallery.json.
Needs ffmpeg (videos) and macOS sips (photos).
"""
import json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "media"
PHOTO = {".jpg", ".jpeg", ".png", ".heic", ".webp"}
VIDEO = {".mp4", ".mov", ".m4v", ".webm"}


def run(*cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    src = Path(args[0]).expanduser()
    limit = int(args[args.index("--max") + 1]) if "--max" in args else 24
    files = sorted((p for p in src.rglob("*") if p.suffix.lower() in PHOTO | VIDEO), key=lambda p: p.name, reverse=True)
    # Instaloader saves a .jpg thumbnail next to each video; skip it
    stems = {p.stem for p in files if p.suffix.lower() in VIDEO}
    files = [p for p in files if not (p.suffix.lower() in PHOTO and p.stem in stems)][:limit]
    OUT.mkdir(parents=True, exist_ok=True)
    items = []
    for i, p in enumerate(files, 1):
        name = f"rev-{i:02d}"
        if p.suffix.lower() in VIDEO:
            run("ffmpeg", "-y", "-i", str(p), "-an", "-vf", "scale='min(720,iw)':-2", "-c:v", "libx264", "-crf", "28",
                "-preset", "slow", "-movflags", "+faststart", "-pix_fmt", "yuv420p", str(OUT / f"{name}.mp4"))
            run("ffmpeg", "-y", "-ss", "1", "-i", str(p), "-frames:v", "1", "-vf", "scale='min(720,iw)':-2", "-q:v", "4", str(OUT / f"{name}-poster.jpg"))
            items.append({"src": f"{name}.mp4", "poster": f"{name}-poster.jpg", "alt": "Rev Auto repair video"})
        else:
            run("sips", "-s", "format", "jpeg", "-s", "formatOptions", "80", "-Z", "1600", str(p), "--out", str(OUT / f"{name}.jpg"))
            items.append({"src": f"{name}.jpg", "alt": "Rev Auto repair"})
        print(f"{i}/{len(files)} {p.name} -> {items[-1]['src']}")
    items.sort(key=lambda m: not m["src"].endswith(".mp4"))  # a video leads the gallery
    items = items[:1] + sorted(items[1:], key=lambda m: m["src"])
    (OUT / "gallery.json").write_text(json.dumps(items, indent=2))
    print(f"Wrote {len(items)} items to assets/media/gallery.json")


if __name__ == "__main__":
    main()
