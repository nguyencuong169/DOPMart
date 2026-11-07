"""Optimise product artwork.

The source PNGs are 1254x1254 and weigh ~3 MB each (23 MB total), while the UI
never renders them wider than 680px. This script downsamples them to 900px and
re-encodes as WebP, which keeps 2x sharpness on product cards and 1x on the hero.

Usage:
    python scripts/optimize-images.py
"""

from pathlib import Path

from PIL import Image

SRC = Path(__file__).resolve().parent.parent / "src" / "assets" / "products"
MAX_SIDE = 900
QUALITY = 86


def main() -> None:
    total_before = 0
    total_after = 0
    for src in sorted(SRC.glob("*.png")):
        with Image.open(src) as img:
            frame = img.convert("RGBA")
            frame.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
            out = src.with_suffix(".webp")
            frame.save(out, "WEBP", quality=QUALITY, method=6)
        before = src.stat().st_size
        after = out.stat().st_size
        total_before += before
        total_after += after
        print(f"{src.name:>14} -> {out.name:<14}{before / 1e6:6.2f} MB -> {after / 1e3:6.1f} kB")
    print(f"{'TOTAL':>14}    {total_before / 1e6:6.2f} MB -> {total_after / 1e3:6.1f} kB")


if __name__ == "__main__":
    main()
