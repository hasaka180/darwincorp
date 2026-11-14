"""Build the capability card backgrounds for /locations/worldwide.

Six 720x900 textures in Darwin's dusk palette (plum, crimson, coral, mauve,
lilac), each a different technique so the row reads as a set but no two cards
match. Output: public/assets/worldwide/cards/{name}.webp

Run from the repo root:  python3 scripts/build-card-art.py
"""
import math
import os
import random

from PIL import Image, ImageChops, ImageDraw, ImageFilter

W, H = 720, 900
OUT = "public/assets/worldwide/cards"
os.makedirs(OUT, exist_ok=True)

PAL = {
    "night": "#160b25", "plum": "#2a1035", "wine": "#420f25", "mauve": "#674158",
    "crimson": "#9a2535", "rose": "#c64f65", "coral": "#ff5b3a", "copper": "#ff8d5e",
    "orchid": "#b24d93", "purple": "#9867b3", "lilac": "#c4a5cf", "moon": "#ede0f2",
}


def rgb(name):
    h = PAL[name].lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def vgrad(top, bottom, w=W, h=H):
    a, b = rgb(top), rgb(bottom)
    g = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / (h - 1)
        g.putpixel((0, y), tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3)))
    return g.resize((w, h))


def noise(rng, cw, ch, w=W, h=H, resample=Image.BICUBIC):
    n = Image.new("L", (cw, ch))
    n.putdata([rng.randrange(256) for _ in range(cw * ch)])
    return n.resize((w, h), resample)


def grain(img, rng, amount=0.09):
    """Fine film grain, centred on mid-grey so it doesn't shift the tone."""
    n = Image.new("L", (W, H))
    n.putdata([max(0, min(255, int(rng.gauss(128, 46)))) for _ in range(W * H)])
    return Image.blend(img, ImageChops.soft_light(img, Image.merge("RGB", (n, n, n))), amount * 6)


def blob(draw, cx, cy, rx, ry, color):
    draw.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=color)


# 1. Website: painterly blotches, like thick paint on canvas.
def mosaic(rng):
    names = ["crimson", "rose", "mauve", "plum", "wine", "copper"]
    weights = [2.6, 2, 4, 4.5, 4, 0.5]
    lw, lh = 72, 90
    # Filter colour indices, not RGB, so only palette colours survive.
    small = Image.new("P", (lw, lh))
    small.putpalette([v for n in names for v in rgb(n)] + [0] * (768 - 3 * len(names)))
    small.putdata([names.index(rng.choices(names, weights)[0]) for _ in range(lw * lh)])
    # Majority filters grow the random pixels into organic patches.
    for size in (3, 5, 5, 7):
        small = small.filter(ImageFilter.ModeFilter(size))
    img = small.convert("RGB").resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(11))
    # Dabs of a lighter tone on top, like brush marks catching the light.
    d = ImageDraw.Draw(img, "RGBA")
    for _ in range(140):
        x, y = rng.uniform(0, W), rng.uniform(0, H)
        c = img.getpixel((min(int(x), W - 1), min(int(y), H - 1)))
        lift = tuple(min(255, int(v * 1.25 + 10)) for v in c) + (90,)
        d.rounded_rectangle((x, y, x + rng.uniform(18, 60), y + rng.uniform(10, 34)), radius=8, fill=lift)
    img = img.filter(ImageFilter.GaussianBlur(2.2))
    return grain(img, rng, 0.14)


# 2. Brand: horizontal smears, as if the colour was dragged across.
def smear(rng):
    img = vgrad("mauve", "plum")
    d = ImageDraw.Draw(img)
    for _ in range(70):
        name = rng.choices(["rose", "crimson", "mauve", "plum", "lilac", "wine"], [3, 4, 4, 5, 0.6, 4])[0]
        y = rng.gauss(H * 0.52, H * 0.2)
        blob(d, rng.uniform(0, W), y, rng.uniform(40, 220), rng.uniform(6, 34), rgb(name))
    img = img.resize((12, H), Image.BILINEAR).resize((W, H), Image.BICUBIC)
    img = img.filter(ImageFilter.GaussianBlur(9))
    return grain(img, rng, 0.08)


# 3. Interactive: a soft bloom of lilac, purple and coral light.
def bloom(rng):
    img = vgrad("plum", "night")
    d = ImageDraw.Draw(img)
    blob(d, W * 0.25, H * 0.12, 420, 380, rgb("lilac"))
    blob(d, W * 0.55, H * 0.48, 380, 360, rgb("purple"))
    blob(d, W * 0.88, H * 0.86, 300, 280, rgb("coral"))
    blob(d, W * 0.08, H * 0.92, 260, 220, rgb("plum"))
    img = img.filter(ImageFilter.GaussianBlur(150))
    return grain(img, rng, 0.06)


# 4. UI/UX: dune bands, the homepage landscape folded into layers.
def dunes(rng):
    img = vgrad("night", "mauve")
    d = ImageDraw.Draw(img)
    bands = [("mauve", 0.4), ("crimson", 0.52), ("wine", 0.64), ("plum", 0.76), ("night", 0.88)]
    for name, base in bands:
        amp, freq, ph = rng.uniform(18, 46), rng.uniform(1.2, 2.6), rng.uniform(0, 6.28)
        pts = [(x, H * base + amp * math.sin(x / W * freq * 6.28 + ph) + 14 * math.sin(x / W * 13 + ph * 2)) for x in range(0, W + 8, 8)]
        d.polygon(pts + [(W, H), (0, H)], fill=rgb(name))
        light = tuple(min(255, c + 45) for c in rgb(name))
        d.line(pts, fill=light, width=3)
    img = img.filter(ImageFilter.GaussianBlur(9))
    return grain(img, rng, 0.1)


# 5. Motion: an aura of soft rings, offset like a ripple in motion.
def rings(rng):
    img = Image.new("RGB", (W, H), rgb("plum"))
    d = ImageDraw.Draw(img)
    seq = ["night", "plum", "wine", "crimson", "rose", "coral", "rose", "crimson", "wine", "mauve", "plum", "mauve"]
    for i, name in enumerate(seq):
        r = 760 - i * 60
        cx, cy = W * 0.62 - i * 9, H * 0.42 + i * 6
        blob(d, cx, cy, r * 0.82, r, rgb(name))
    img = img.filter(ImageFilter.GaussianBlur(44))
    return grain(img, rng, 0.08)


# 6. AI: a pixel dissolve over a coral glow, in the Handjet spirit.
def pixels(rng):
    img = vgrad("night", "plum")
    d = ImageDraw.Draw(img)
    blob(d, W * 0.3, H * 0.8, 320, 280, rgb("crimson"))
    blob(d, W * 0.22, H * 0.92, 200, 160, rgb("coral"))
    blob(d, W * 0.78, H * 0.15, 260, 240, rgb("mauve"))
    img = img.filter(ImageFilter.GaussianBlur(120))
    d = ImageDraw.Draw(img)
    s = 24
    for gy in range(0, H, s):
        for gx in range(0, W, s):
            px = img.getpixel((min(gx + s // 2, W - 1), min(gy + s // 2, H - 1)))
            lum = sum(px) / 765
            r = rng.random()
            if r < lum * 0.55:
                k = rng.uniform(1.1, 1.32)
                c = tuple(min(255, int(v * k + 8)) for v in px)
            elif r > 0.93:
                c = tuple(int(v * 0.65) for v in px)
            else:
                continue
            d.rectangle((gx + 1, gy + 1, gx + s - 2, gy + s - 2), fill=c)
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    return grain(img, rng, 0.07)


CARDS = {"web": mosaic, "brand": smear, "interactive": bloom, "product": dunes, "motion": rings, "ai": pixels}

for i, (name, fn) in enumerate(CARDS.items()):
    fn(random.Random(100 + i)).save(f"{OUT}/{name}.webp", quality=72, method=6)
    print("wrote", f"{OUT}/{name}.webp", os.path.getsize(f"{OUT}/{name}.webp") // 1024, "KB")
