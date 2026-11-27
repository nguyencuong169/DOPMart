"""Extract the product areas of the approved 1536 × 1024 deals board."""
from pathlib import Path
import sys

from PIL import Image, ImageDraw

source = Image.open(sys.argv[1])
if source.size != (1536, 1024):
    raise ValueError("Expected the approved board at 1536 x 1024")
output = Path(__file__).resolve().parent.parent / "assets/images/deals"
output.mkdir(parents=True, exist_ok=True)
regions = {
    "hero": (697, 113, 1076, 419),
    "office": (88, 663, 304, 808),
    "energy": (564, 662, 795, 807),
    "noodles": (1055, 668, 1255, 806),
    "drink": (186, 904, 303, 1012),
    "snack": (449, 898, 591, 1012),
    "instant": (775, 905, 875, 1013),
    "candy": (1077, 892, 1176, 1013),
    "bundle": (1335, 898, 1492, 1013),
}
# Omit the discount labels and neighboring artwork from each product cutout.
outlines = {
    "office": [(90,696),(159,697),(166,665),(245,665),(245,718),(296,730),(298,805),(89,805)],
    "energy": [(566,702),(611,698),(623,678),(689,678),(691,665),(787,665),(793,804),(567,804)],
    "noodles": [(1056,748),(1118,745),(1118,669),(1209,669),(1207,746),(1254,746),(1254,805),(1056,805)],
    "hero": [(699,250),(722,245),(714,190),(763,164),(790,163),(791,118),(972,118),(965,173),(999,161),(1006,117),(1051,123),(1059,136),(1047,159),(1063,198),(1054,241),(1072,245),(1069,283),(1043,309),(1030,382),(1001,419),(763,392),(742,380),(731,305),(704,290)],
}
for name, bounds in regions.items():
    artwork = source.convert("RGBA")
    if name in outlines:
        alpha = Image.new("L", source.size)
        ImageDraw.Draw(alpha).polygon(outlines[name], fill=255)
        artwork.putalpha(alpha)
    artwork.crop(bounds).save(output / f"{name}.webp", quality=94)
