"""Downloads the CC0 assets the villa scene uses from Poly Haven.

    python3 scripts/fetch-villa-assets.py

Files land in artwork/villa/assets/ (gitignored); scripts/create-villa-scene.py
reads them from there. Everything is CC0 (public domain) from https://polyhaven.com;
see artwork/villa/assets/CREDITS.md after running.
"""

import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "artwork" / "villa" / "assets"

# Surface textures (diffuse, roughness, displacement) at 2k: they tile across large areas.
TEXTURES = [
    "concrete_wall_008",    # cantilevered slabs
    "stone_wall_04",        # dry-stone retaining walls
    "large_grey_tiles",     # dark stone cladding (tinted)
    "marble_01",            # terrace and pool-deck tiles
    "wood_floor",           # timber slats, soffits, interior floors
    "white_plaster_02",     # interior walls
    "coast_sand_01",        # beach
    "damp_beach_sand",      # wet sand at the waterline
    "grass_ground",         # soil under the lawn
]
# Models at 1k: small on screen, so 1k textures are plenty.
MODELS = [
    "grass_medium_01", "island_tree_01", "island_tree_02", "island_tree_03", "jacaranda_tree", "tree_small_02",
    "cheiridopsis_succulent", "crystalline_iceplant", "wild_rooibos_bush", "potted_plant_04", "potted_plant_02",
    "mid_century_lounge_chair", "modern_coffee_table_01", "modern_ceiling_lamp_01", "coast_rocks_02", "coast_land_rocks_03",
]
MAPS = {"Diffuse": "diff", "Rough": "rough", "Displacement": "disp", "nor_gl": "nor"}


def get_json(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "darwin-villa/1.0"})) as r:
        return json.load(r)


def download(url, dest):
    if dest.exists() and dest.stat().st_size > 0:
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "darwin-villa/1.0"})) as r:
        dest.write_bytes(r.read())
    print("  ", dest.relative_to(ASSETS))


def main():
    credits = []
    for tex in TEXTURES:
        print(tex)
        files = get_json(f"https://api.polyhaven.com/files/{tex}")
        for key, short in MAPS.items():
            entry = files[key]["2k"]["jpg"]
            download(entry["url"], ASSETS / "textures" / tex / f"{short}.jpg")
        credits.append(tex)
    for model in MODELS:
        print(model)
        entry = get_json(f"https://api.polyhaven.com/files/{model}")["gltf"]["1k"]["gltf"]
        folder = ASSETS / "models" / model
        download(entry["url"], folder / f"{model}.gltf")
        for rel, inc in entry.get("include", {}).items():
            download(inc["url"], folder / rel)
        credits.append(model)
    (ASSETS / "CREDITS.md").write_text(
        "# Villa scene assets\n\nAll assets are CC0 (public domain) from Poly Haven, https://polyhaven.com.\n\n"
        + "\n".join(f"- [{a}](https://polyhaven.com/a/{a})" for a in credits) + "\n"
    )


if __name__ == "__main__":
    main()
