"""Extract the product areas of the approved 1536 × 1024 deals board."""
from pathlib import Path
import sys

from PIL import Image

source = Image.open(sys.argv[1])
if source.size != (1536, 1024):
    raise ValueError("Expected the approved board at 1536 x 1024")
output = Path(__file__).resolve().parent.parent / "assets/images/deals"
output.mkdir(parents=True, exist_ok=True)
regions = {
    "hero": (697, 113, 1076, 419),
    "office": (88, 694, 304, 808),
    "energy": (564, 690, 795, 807),
    "noodles": (1055, 680, 1255, 806),
    "drink": (186, 904, 303, 1012),
    "snack": (449, 898, 591, 1012),
    "instant": (768, 905, 875, 1013),
    "candy": (1077, 892, 1176, 1013),
    "bundle": (1335, 898, 1492, 1013),
}
for name, bounds in regions.items():
    source.crop(bounds).convert("RGB").save(output / f"{name}.webp", quality=94)
