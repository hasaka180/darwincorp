"""Build the relief texture for the Working worldwide hero map.

Output: public/assets/worldwide/world-relief.png (1024x384, equirectangular,
latitude 78.75N to 56.25S), read by components/worldwide/WorldScene.tsx.
  R = terrain height      G = land (soft-edged coast)      B = coast distance field

Land comes from the 256x128 mask the `cobe` package embeds. Elevation is
sculpted here: the interior rises away from the coast, the major ranges are
drawn as blurred polylines, and ridged noise breaks them up. It is a stylised
relief for an illustration, not survey data.

Run from the repo root:  python3 scripts/build-world-relief.py
"""
import base64
import io
import random
import re

from PIL import Image, ImageChops, ImageDraw, ImageFilter

W, H = 1024, 384
LAT_TOP, LAT_SPAN = 78.75, 135.0
rng = random.Random(7)


def xy(lat, lon):
    return ((lon + 180.0) / 360.0 * W, (LAT_TOP - lat) / LAT_SPAN * H)


def noise(cells_x, cells_y):
    small = Image.new("L", (cells_x, cells_y))
    small.putdata([rng.randrange(256) for _ in range(cells_x * cells_y)])
    return small.resize((W, H), Image.BICUBIC)


# ---- Land ----
src = open("node_modules/cobe/dist/index.esm.js").read()
mask = Image.open(io.BytesIO(base64.b64decode(re.search(r"data:image/png;base64,([A-Za-z0-9+/=]+)", src).group(1)))).convert("L")
mask = mask.crop((0, 8, 256, 104))  # drop the Arctic cap and Antarctica
land_hard = mask.resize((W, H), Image.BICUBIC)
land = land_hard.filter(ImageFilter.GaussianBlur(2.2))
coast = land_hard.filter(ImageFilter.GaussianBlur(16))
interior = land_hard.filter(ImageFilter.GaussianBlur(11)).point(lambda v: max(0, min(255, (v - 150) * 255 // 105)))

# ---- Ranges: (height 0-1, width in px, [(lat, lon), ...]) ----
RANGES = [
    # Asia
    (1.00, 9, [(35, 74), (30.5, 81), (27.8, 87), (28, 95)]),            # Himalaya
    (0.55, 22, [(34, 82), (33, 92)]),                                   # Tibet
    (0.78, 7, [(38, 72), (42, 79), (43, 87)]),                          # Pamir, Tien Shan
    (0.70, 6, [(36, 71), (34.5, 66)]),                                  # Hindu Kush
    (0.55, 7, [(49.5, 86), (46, 96)]),                                  # Altai
    (0.32, 20, [(47, 98), (46, 106)]),                                  # Mongolian plateau
    (0.40, 7, [(67, 129), (63, 140)]),                                  # Verkhoyansk
    (0.40, 6, [(52, 96), (53, 108)]),                                   # Sayan
    (0.50, 4, [(57, 160), (53, 158)]),                                  # Kamchatka
    (0.50, 4, [(40, 140.5), (36, 138), (34.5, 134)]),                   # Japan
    (0.36, 4, [(19, 73.7), (10, 77)]),                                  # Western Ghats
    (0.42, 4, [(4, 96.5), (-4, 103)]),                                  # Sumatra
    (0.40, 5, [(4, 115), (0, 113.5)]),                                  # Borneo
    (0.62, 4, [(-3.5, 137), (-6, 145.5)]),                              # New Guinea
    (0.42, 5, [(27, 100), (23, 103), (18, 105)]),                       # Yunnan, Annam
    # Middle East, Caucasus
    (0.62, 6, [(37.5, 45), (33, 48), (29.5, 53), (27, 57)]),            # Zagros
    (0.55, 4, [(36.5, 49.5), (36, 53.5)]),                              # Alborz
    (0.72, 4, [(43.4, 40.5), (42.3, 45.5), (41, 48)]),                  # Caucasus
    (0.45, 9, [(39, 30), (39.2, 42)]),                                  # Anatolia
    (0.50, 5, [(28, 36), (22, 40), (16, 43.6)]),                        # Hijaz, Asir
    (0.52, 3, [(25.7, 56.1), (23, 58.2)]),                              # Hajar
    (0.30, 16, [(32, 55), (31, 60)]),                                   # Iranian plateau
    # Europe
    (0.72, 5, [(44.3, 7), (46.4, 9.5), (47.2, 13.8)]),                  # Alps
    (0.50, 3, [(42.8, -1), (42.5, 2)]),                                 # Pyrenees
    (0.40, 4, [(49.2, 20), (47.2, 25), (45.5, 25.2)]),                  # Carpathians
    (0.45, 6, [(60, 7.5), (65, 14), (69, 19.5)]),                       # Scandes
    (0.35, 4, [(66, 60), (58, 59), (52, 58)]),                          # Urals
    (0.30, 3, [(57.3, -5), (56.5, -4)]),                                # Highlands
    (0.34, 3, [(42.5, 21.5), (39.5, 21.2)]),                            # Dinarides, Pindus
    # Africa
    (0.55, 5, [(31, -8), (34, -2), (36, 6)]),                           # Atlas
    (0.66, 13, [(11, 38.5), (8, 39.5)]),                                # Ethiopian highlands
    (0.50, 6, [(1, 36.5), (-3.5, 36), (-9.5, 34)]),                     # East African rift
    (0.50, 6, [(-27.5, 29.5), (-31, 28)]),                              # Drakensberg
    (0.40, 6, [(23.3, 5.6)]),                                           # Ahaggar
    (0.40, 5, [(21, 17.8)]),                                            # Tibesti
    (0.34, 3, [(-15, 49), (-23, 47)]),                                  # Madagascar
    (0.28, 18, [(-12, 18), (-16, 22)]),                                 # Angolan plateau
    # Americas
    (0.72, 10, [(62, -135), (55, -125), (48, -115), (42, -110), (37, -106.5), (33, -106.5)]),  # Rockies
    (0.60, 4, [(48, -121.5), (40.5, -121.5), (36.5, -118.5)]),          # Cascades, Sierra Nevada
    (0.76, 6, [(63, -152), (61, -142)]),                                # Alaska range
    (0.55, 6, [(28, -107), (22, -103.5), (18.5, -99)]),                 # Sierra Madre
    (0.30, 5, [(45, -71), (40, -77), (35, -83)]),                       # Appalachians
    (0.40, 3, [(15, -91), (10, -84)]),                                  # Central America
    (0.92, 6, [(10, -73), (4, -75), (-5, -78), (-12, -75.5), (-18, -69), (-27, -68), (-35, -70), (-45, -72.3), (-52, -73)]),  # Andes
    (0.26, 18, [(-16, -45), (-20, -44)]),                               # Brazilian highlands
    (0.30, 9, [(4.5, -62)]),                                            # Guiana highlands
    (0.50, 26, [(75, -42), (68, -43)]),                                 # Greenland ice sheet
    # Oceania
    (0.36, 4, [(-18, 145.5), (-28, 152), (-36, 148.6)]),                # Great Dividing Range
    (0.50, 3, [(-42, 172.5), (-45, 168.5)]),                            # Southern Alps
]

ranges = Image.new("L", (W, H), 0)
for width in sorted({r[1] for r in RANGES}):
    layer = Image.new("L", (W, H), 0)
    draw = ImageDraw.Draw(layer)
    for height, w, pts in RANGES:
        if w != width:
            continue
        p = [xy(lat, lon) for lat, lon in pts]
        fill = round(height * 255)
        if len(p) == 1:
            draw.ellipse((p[0][0] - w, p[0][1] - w, p[0][0] + w, p[0][1] + w), fill=fill)
        else:
            draw.line(p, fill=fill, width=w, joint="curve")
            for x, y in p:
                draw.ellipse((x - w / 2, y - w / 2, x + w / 2, y + w / 2), fill=fill)
    # Blur spreads the line into a ridge; the gain restores the crest height.
    layer = layer.filter(ImageFilter.GaussianBlur(width * 0.55)).point(lambda v: min(255, v * 1.45))
    ranges = ImageChops.lighter(ranges, layer)

# ---- Texture: ridged noise for the ranges, fine grain everywhere ----
def ridged(img):
    return img.point(lambda v: 255 - abs(2 * v - 255))

ridge = ImageChops.multiply(ridged(noise(96, 36)), ridged(noise(192, 72)).point(lambda v: 90 + v * 165 // 255))
ridge = ImageChops.screen(ridge, ridged(noise(48, 18)).point(lambda v: v * 0.45))
rolling = ImageChops.add(noise(40, 15), noise(128, 48), scale=2)
grain = noise(512, 192)

height = interior.point(lambda v: 30 + v * 0.17)                               # coast 0.12 -> interior 0.29
height = ImageChops.add(height, ImageChops.multiply(interior, rolling).point(lambda v: v * 0.16))
height = ImageChops.add(height, ImageChops.multiply(ranges, ridge.point(lambda v: 84 + v * 171 // 255)))
height = ImageChops.add(height, ImageChops.multiply(ranges, grain).point(lambda v: v * 0.10))
height = height.filter(ImageFilter.GaussianBlur(0.7))

# Flat at the map edge, so the slab's walls meet the terrain cleanly.
edge = Image.new("L", (W, H), 0)
ImageDraw.Draw(edge).rectangle((10, 10, W - 11, H - 11), fill=255)
edge = edge.filter(ImageFilter.GaussianBlur(8))
height = ImageChops.multiply(ImageChops.multiply(height, land.point(lambda v: max(0, min(255, (v - 96) * 4)))), edge)

Image.merge("RGB", (height, land, coast)).save("public/assets/worldwide/world-relief.png", optimize=True)
print("wrote public/assets/worldwide/world-relief.png", height.getextrema())
