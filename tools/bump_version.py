"""Stamp ?v=<time> on local CSS/JS links so browsers fetch fresh copies after every publish.
Run before committing:  python3 tools/bump_version.py"""
import re, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
v = time.strftime("%Y%m%d%H%M")
for page in ("index.html", "pit/index.html"):
    p = ROOT / page
    s = re.sub(r'((?:href|src)="(?!https?:)[^"?]+\.(?:css|js))(?:\?v=\d+)?"', rf'\1?v={v}"', p.read_text())
    p.write_text(s)
    print(page, "->", v)
