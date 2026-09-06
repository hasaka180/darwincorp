import sharp from "sharp";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const web = process.argv.includes("--web");
for (const name of ["dream-poster", "dream-poster-mobile"]) {
  const source = web ? name.replace("dream-", "dream-web-") : name;
  await sharp(fileURLToPath(new URL(`artwork/dream/${source}.png`, root)))
    .webp({ quality: 86 })
    .toFile(fileURLToPath(new URL(`public/assets/dream/${name}.webp`, root)));
}
