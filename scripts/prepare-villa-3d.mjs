// Web-sized copies of the scanned surface textures the live 3D villa maps in
// world space (colour, normal, roughness), from artwork/villa/assets/textures.
//
//   node scripts/prepare-villa-3d.mjs
//
// Large, close surfaces keep 2K colour; everything else is 1K.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const src = fileURLToPath(new URL("artwork/villa/assets/textures/", root));
const out = fileURLToPath(new URL("public/assets/villa/3d/tex/", root));
mkdirSync(out, { recursive: true });

const SURFACES = {
  concrete_wall_008: 2048, stone_wall_04: 2048, marble_01: 2048, large_grey_tiles: 1024, wood_floor: 1024,
  white_plaster_02: 1024, coast_sand_01: 1024, damp_beach_sand: 1024, grass_ground: 1024,
};
for (const [tex, colour] of Object.entries(SURFACES)) {
  for (const [map, size, q] of [["diff", colour, 80], ["nor", 1024, 82], ["rough", 512, 75]]) {
    await sharp(`${src}${tex}/${map}.jpg`).resize(size).webp({ quality: q, effort: 5 }).toFile(`${out}${tex}-${map}.webp`);
  }
  console.log(tex);
}
