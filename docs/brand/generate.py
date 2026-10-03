"""Regenerate the Kharcha launch graphics from the app's installed font packages.

Run after `cd mobile && npm ci`: `python3 ../docs/brand/generate.py`.
Requires Pillow. The generated PNGs are committed so readers need no design tools.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "brand"
ASSETS = ROOT / "mobile" / "assets"
FONTS = ROOT / "mobile" / "node_modules" / "@expo-google-fonts"
SCALE = 2

INK = "#EFEADF"
MUTED = "#A6A499"
BG = "#121412"
SURFACE = "#1B1E1B"
LEAF = "#8FC7A8"
ON_LEAF = "#10241A"
GOLD = "#F0B453"
DEBIT = "#F38A63"


def font(family: str, name: str, size: int):
    path = FONTS / family / name.split("_", 1)[1] / f"{name}.ttf"
    return ImageFont.truetype(str(path), size * SCALE)


DISPLAY = lambda size: font("bricolage-grotesque", "BricolageGrotesque_700Bold", size)
BODY = lambda size: font("hanken-grotesk", "HankenGrotesk_400Regular", size)
MEDIUM = lambda size: font("hanken-grotesk", "HankenGrotesk_600SemiBold", size)
MONO = lambda size: font("ibm-plex-mono", "IBMPlexMono_500Medium", size)


def xy(box):
    return tuple(round(value * SCALE) for value in box)


def txt(draw, x, y, value, face, fill):
    draw.text((x * SCALE, y * SCALE), value, font=face, fill=fill, anchor="lt")


def ticket(draw, x, y, w, h, compact=False):
    s = SCALE
    draw.rounded_rectangle(xy((x, y, x + w, y + h)), radius=25 * s, fill=LEAF)
    for cx in range(x + 18, x + w, 28):
        draw.ellipse(xy((cx - 9, y + h - 9, cx + 9, y + h + 9)), fill=BG)
    pad = 34 if compact else 47
    txt(draw, x + pad, y + 33, "EXAMPLE · OCTOBER 2026", MEDIUM(18 if compact else 21), ON_LEAF)
    txt(draw, x + pad, y + (95 if compact else 112), "Spent, so far", BODY(20 if compact else 24), ON_LEAF)
    txt(draw, x + pad, y + (138 if compact else 164), "₹2,480", MONO(46 if compact else 59), ON_LEAF)
    line = y + h - (186 if compact else 219)
    draw.line(xy((x + pad, line, x + w - pad, line)), fill="#527B63", width=2 * s)
    txt(draw, x + pad, line + 26, "LATEST ENTRY", MEDIUM(16 if compact else 18), ON_LEAF)
    txt(draw, x + pad, line + 67, "Zomato", DISPLAY(27 if compact else 33), ON_LEAF)
    txt(draw, x + pad, line + 117, "−₹2,480  ·  Food & dining", MONO(15 if compact else 19), ON_LEAF)


def cover(width, height, name):
    canvas = Image.new("RGB", (width * SCALE, height * SCALE), BG)
    d = ImageDraw.Draw(canvas)
    compact = width < 1400
    tx = 735 if compact else 930
    tw = width - tx - (48 if compact else 100)
    ty = 74 if compact else 112
    th = height - ty - (56 if compact else 104)

    # A thin trail of points belongs to an SMS becoming a receipt; it is not a page grid.
    for index in range(24):
        px = (488 if compact else 630) + index * (12 if compact else 15)
        py = (height - 192) - index * (5 if compact else 6)
        if px < tx + 5:
            d.ellipse(xy((px, py, px + 3, py + 3)), fill="#536553")

    ticket(d, tx, ty, tw, th, compact)
    left = 62 if compact else 100
    txt(d, left, 70 if compact else 108, "kharcha.", DISPLAY(66 if compact else 91), INK)
    title_y = 208 if compact else 281
    for i, line in enumerate(["A little clearer", "every day."]):
        txt(d, left, title_y + i * (73 if compact else 102), line, DISPLAY(53 if compact else 75), INK)
    sub_y = title_y + (192 if compact else 260)
    txt(d, left, sub_y, "The spending ledger already in your messages.", BODY(21 if compact else 27), MUTED)
    raw_y = height - (156 if compact else 207)
    d.rounded_rectangle(xy((left, raw_y - 16, 645 if compact else 780, height - (46 if compact else 73))), radius=14*SCALE, fill=SURFACE)
    txt(d, left + 20, raw_y + 3, "EXAMPLE BANK SMS", MEDIUM(16 if compact else 18), GOLD)
    txt(d, left + 20, raw_y + 40, "A/C ··3381 debited by INR 2,480.00", MONO(15 if compact else 18), INK)
    txt(d, left + 20, raw_y + 69, "to VPA zomato@pay", MONO(15 if compact else 18), MUTED)
    canvas.resize((width, height), Image.Resampling.LANCZOS).save(OUT / name, optimize=True)


def icon(path, transparent=False, monochrome=False):
    size = 1024
    mode = "RGBA" if transparent else "RGB"
    image = Image.new(mode, (size, size), (0, 0, 0, 0) if transparent else BG)
    d = ImageDraw.Draw(image)
    paper = "#FFFFFF" if monochrome else LEAF
    ink = BG if monochrome else ON_LEAF
    d.rounded_rectangle((212, 158, 812, 828), radius=96, fill=paper)
    for x in range(248, 804, 72):
        d.ellipse((x - 24, 804, x + 24, 852), fill=(0, 0, 0, 0) if transparent else BG)
    d.text((308, 266), "k", font=DISPLAY(530 // SCALE), fill=ink, anchor="lt")
    if not monochrome:
        d.ellipse((632, 610, 710, 688), fill=GOLD)
    image.save(path, optimize=True)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    cover(1600, 900, "cover.png")
    cover(1200, 630, "social-card.png")
    icon(ASSETS / "icon.png")
    icon(ASSETS / "android-icon-foreground.png", transparent=True)
    icon(ASSETS / "android-icon-monochrome.png", transparent=True, monochrome=True)
    Image.new("RGB", (1024, 1024), BG).save(ASSETS / "android-icon-background.png")
    icon(ASSETS / "splash-icon.png", transparent=True)
    icon_image = Image.open(ASSETS / "icon.png")
    icon_image.resize((64, 64), Image.Resampling.LANCZOS).save(ASSETS / "favicon.png")
