// Generates the Real Estate page photography through the local OpenHiggsfield
// setup's reAPI key (Nano Banana Pro), then compresses each image for the web.
//
//   node scripts/generate-realestate-images.mjs [slug ...]
//
// Originals land in artwork/realestate/<slug>.png (not committed), web copies
// in public/assets/realestate/<slug>.webp. Existing originals are skipped, so a
// rerun only fills in what is missing; pass slugs to force those again.
import sharp from "sharp";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const path = (p) => fileURLToPath(new URL(p, root));
const ART = path("artwork/realestate/");
const OUT = path("public/assets/realestate/");
mkdirSync(ART, { recursive: true });
mkdirSync(OUT, { recursive: true });

const env = readFileSync(`${homedir()}/higgsfield/open-higgsfield-main/.env.local`, "utf8");
const KEY = env.match(/^REAPI_API_KEY=(.+)$/m)?.[1]?.trim();
const BASE = (env.match(/^REAPI_BASE_URL=(.+)$/m)?.[1]?.trim() || "https://reapi.ai/api/v1").replace(/\/$/, "");
if (!KEY) throw new Error("REAPI_API_KEY missing from the OpenHiggsfield .env.local");

const STYLE = "Editorial architectural photography for a luxury real estate brand in Dubai. Natural light, warm sand, stone and soft dusk tones, calm and uncluttered, realistic materials, shot on a full-frame camera, no text, no logos, no watermarks.";

// [slug, aspect ratio, web width, prompt]
const IMAGES = [
  // Gallery slideshow: "Before they buy a property, they imagine a life."
  ["life-terrace", "16:9", 1920, "A contemporary villa terrace opening onto an infinity pool and a planted garden, sliding glass doors fully open, linen loungers, late golden hour."],
  ["life-penthouse", "16:9", 1920, "Penthouse living room at blue hour with floor-to-ceiling windows framing the Dubai skyline, warm lamps, low sofa, travertine floor."],
  ["life-courtyard", "16:9", 1920, "Courtyard house with a shaded inner garden, olive tree, reflecting pool and limestone walls, dappled midday shade."],
  ["life-light", "16:9", 1920, "Sunlit minimalist interior in late afternoon, long shadows from vertical fins across plaster walls, oak dining table, sheer curtains."],
  // Property finder cards
  ["prop-coastal-residence", "4:3", 1200, "Exterior of a modern four-bedroom beachfront villa on Palm Jumeirah, white stone and glass, palm trees, sea beyond, soft morning light."],
  ["prop-the-skyline", "4:3", 1200, "Two-bedroom apartment in a slender Downtown Dubai tower, view from the balcony toward the skyline at dusk, modern furniture."],
  ["prop-the-courtyard", "4:3", 1200, "Exterior of a three-bedroom villa in Dubai Hills with a walled front courtyard, warm sandstone, desert landscaping, afternoon light."],
  ["prop-marina-light", "4:3", 1200, "Bright one-bedroom apartment overlooking Dubai Marina water and yachts, white interior, morning light."],
  ["prop-the-crown", "4:3", 1200, "Exterior of a penthouse crowning a Downtown Dubai tower at twilight, large terrace with pool and glowing interiors."],
  ["prop-garden-house", "4:3", 1200, "Five-bedroom family villa with a lush lawn garden in Dubai Hills, low horizontal architecture, timber screens, golden hour."],
  // Detail story
  ["detail-exterior", "4:3", 1600, "Front facade of a waterfront villa, white stone and bronze-framed glass, palm-lined entrance, sea in the distance, clear morning light."],
  ["detail-interior", "4:3", 1600, "Double-height living room with a full-height window wall to the sea, curved sofa, sculptural pendant, travertine and oak."],
  // Agents (concept profiles, fictional people)
  ["agent-a", "1:1", 720, "Head-and-shoulders portrait of a fictional professional real estate consultant, a man in his forties in a tailored navy suit, warm neutral studio background, soft light, friendly."],
  ["agent-b", "1:1", 720, "Head-and-shoulders portrait of a fictional professional leasing specialist, a woman in her thirties in a cream blazer, warm neutral studio background, soft light, friendly."],
  ["agent-c", "1:1", 720, "Head-and-shoulders portrait of a fictional professional investment advisor, a man in his thirties in a charcoal suit, warm neutral studio background, soft light, friendly."],
  // The reveal
  ["reveal", "16:9", 1920, "Abstract architectural form at night: curved white concrete ribbons and shadow, lit by a single warm light, deep navy sky, minimal and sculptural."],
  // Industry series covers
  ["series-real-estate", "3:4", 900, "A contemporary villa at dusk with glowing interiors reflected in a still pool."],
  ["series-interior-design", "3:4", 900, "A refined interior vignette: plaster wall, sculptural chair, linen, warm side light."],
  ["series-hospitality", "3:4", 900, "Boutique hotel arrival courtyard at dusk with lanterns, palms and a reflecting pool."],
  ["series-personal-brands", "3:4", 900, "A calm creative studio desk by a window, notebook, camera and coffee, soft morning light, no people."],
];

async function api(method, url, body) {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url} → ${res.status} ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

async function generate([slug, aspect, width, prompt]) {
  const png = `${ART}${slug}.png`;
  if (!existsSync(png) || force.has(slug)) {
    const task = await api("POST", "/images/generations", {
      model: "gemini-3-pro-image-preview", prompt: `${prompt} ${STYLE}`, size: aspect, resolution: "2K", n: 1,
    });
    const deadline = Date.now() + 10 * 60_000;
    let url;
    while (!url) {
      if (Date.now() > deadline) throw new Error(`${slug}: timed out`);
      await new Promise((r) => setTimeout(r, 5000));
      const s = await api("GET", `/tasks/${encodeURIComponent(task.id)}`);
      if (s.status === "failed") throw new Error(`${slug}: ${JSON.stringify(s.error)}`);
      url = s.output?.image_urls?.[0];
    }
    writeFileSync(png, Buffer.from(await (await fetch(url)).arrayBuffer()));
  }
  await sharp(png).resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toFile(`${OUT}${slug}.webp`);
  console.log(`✓ ${slug}`);
}

const force = new Set(process.argv.slice(2));
const todo = force.size ? IMAGES.filter((i) => force.has(i[0])) : IMAGES;
// Four at a time keeps the queue moving without hammering the API.
const queue = [...todo];
let failed = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  for (let job; (job = queue.shift()); ) {
    try { await generate(job); } catch (e) { failed++; console.error(`✗ ${e.message}`); }
  }
}));
if (failed) process.exitCode = 1;
