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

LAYOUTS = {
    True: {
        "ticket_pad": 34, "ticket_label_size": 18, "ticket_body_size": 20,
        "ticket_amount_size": 46, "ticket_line_offset": 186,
        "ticket_entry_size": 16, "ticket_merchant_size": 27, "ticket_detail_size": 15,
        "ticket_body_y": 95, "ticket_amount_y": 138,
        "ticket_right": 48, "ticket_top": 74, "ticket_bottom": 56,
        "trail_x": 488, "trail_x_step": 12, "trail_y_step": 5,
        "left": 62, "brand_y": 70, "brand_size": 66,
        "title_y": 208, "title_size": 53, "title_step": 73,
        "subtitle_offset": 192, "subtitle_size": 21,
        "raw_offset": 156, "raw_right": 645, "raw_bottom": 46,
        "raw_label_size": 16, "raw_text_size": 15,
    },
    False: {
        "ticket_pad": 47, "ticket_label_size": 21, "ticket_body_size": 24,
        "ticket_amount_size": 59, "ticket_line_offset": 219,
        "ticket_entry_size": 18, "ticket_merchant_size": 33, "ticket_detail_size": 19,
        "ticket_body_y": 112, "ticket_amount_y": 164,
        "ticket_right": 100, "ticket_top": 112, "ticket_bottom": 104,
        "trail_x": 630, "trail_x_step": 15, "trail_y_step": 6,
        "left": 100, "brand_y": 108, "brand_size": 91,
        "title_y": 281, "title_size": 75, "title_step": 102,
        "subtitle_offset": 260, "subtitle_size": 27,
        "raw_offset": 207, "raw_right": 780, "raw_bottom": 73,
        "raw_label_size": 18, "raw_text_size": 18,
    },
}


def xy(box):
    return tuple(round(value * SCALE) for value in box)


def txt(draw, x, y, value, face, fill):
    draw.text((x * SCALE, y * SCALE), value, font=face, fill=fill, anchor="lt")


def ticket(draw, x, y, w, h, compact=False):
    s = SCALE
    layout = LAYOUTS[compact]
    draw.rounded_rectangle(xy((x, y, x + w, y + h)), radius=25 * s, fill=LEAF)
    for cx in range(x + 18, x + w, 28):
        draw.ellipse(xy((cx - 9, y + h - 9, cx + 9, y + h + 9)), fill=BG)
    pad = layout["ticket_pad"]
    txt(draw, x + pad, y + 33, "EXAMPLE · OCTOBER 2026", MEDIUM(layout["ticket_label_size"]), ON_LEAF)
    txt(draw, x + pad, y + layout["ticket_body_y"], "Spent, so far", BODY(layout["ticket_body_size"]), ON_LEAF)
    txt(draw, x + pad, y + layout["ticket_amount_y"], "₹2,480", MONO(layout["ticket_amount_size"]), ON_LEAF)
    line = y + h - layout["ticket_line_offset"]
    draw.line(xy((x + pad, line, x + w - pad, line)), fill="#527B63", width=2 * s)
    txt(draw, x + pad, line + 26, "LATEST ENTRY", MEDIUM(layout["ticket_entry_size"]), ON_LEAF)
    txt(draw, x + pad, line + 67, "Zomato", DISPLAY(layout["ticket_merchant_size"]), ON_LEAF)
    txt(draw, x + pad, line + 117, "−₹2,480  ·  Food & dining", MONO(layout["ticket_detail_size"]), ON_LEAF)


def cover(width, height, name):
    canvas = Image.new("RGB", (width * SCALE, height * SCALE), BG)
    d = ImageDraw.Draw(canvas)
    compact = width < 1400
    layout = LAYOUTS[compact]
    tx = 735 if compact else 930
    tw = width - tx - layout["ticket_right"]
    ty = layout["ticket_top"]
    th = height - ty - layout["ticket_bottom"]

    # A thin trail of points belongs to an SMS becoming a receipt; it is not a page grid.
    for index in range(24):
        px = layout["trail_x"] + index * layout["trail_x_step"]
        py = (height - 192) - index * layout["trail_y_step"]
        if px < tx + 5:
            d.ellipse(xy((px, py, px + 3, py + 3)), fill="#536553")

    ticket(d, tx, ty, tw, th, compact)
    left = layout["left"]
    txt(d, left, layout["brand_y"], "kharcha.", DISPLAY(layout["brand_size"]), INK)
    title_y = layout["title_y"]
    for i, line in enumerate(["A little clearer", "every day."]):
        txt(d, left, title_y + i * layout["title_step"], line, DISPLAY(layout["title_size"]), INK)
    sub_y = title_y + layout["subtitle_offset"]
    txt(d, left, sub_y, "The spending ledger already in your messages.", BODY(layout["subtitle_size"]), MUTED)
    raw_y = height - layout["raw_offset"]
    d.rounded_rectangle(xy((left, raw_y - 16, layout["raw_right"], height - layout["raw_bottom"])), radius=14*SCALE, fill=SURFACE)
    txt(d, left + 20, raw_y + 3, "EXAMPLE BANK SMS", MEDIUM(layout["raw_label_size"]), GOLD)
    txt(d, left + 20, raw_y + 40, "A/C ··3381 debited by INR 2,480.00", MONO(layout["raw_text_size"]), INK)
    txt(d, left + 20, raw_y + 69, "to VPA zomato@pay", MONO(layout["raw_text_size"]), MUTED)
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
