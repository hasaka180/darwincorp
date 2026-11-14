// Compresses the Cycles renders from scripts/create-villa-scene.py for the web.
//
//   node scripts/prepare-villa-assets.mjs
//
// artwork/villa/renders/pano-<look>.png       -> public/assets/villa/pano/<look>{,-hd}.webp
// artwork/villa/renders/build-pano/f_####.png -> public/assets/villa/pano/build{,-hd}.{webm,mp4}
// artwork/villa/renders/cycle-pano/f_####.png -> public/assets/villa/pano/cycle{,-hd}.{webm,mp4}
//
// Two sizes of everything: -hd at the full 3200×1200 render for large and
// high-density screens, and 1920×720 for phones and ordinary displays.
//
// The time-lapse loops seamlessly: its last second cross-fades into the build
// film's last second, which is the moment just before the time-lapse's first
// frame. Requires ffmpeg on PATH.
import sharp from "sharp";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const path = (p) => fileURLToPath(new URL(p, root));
const renders = path("artwork/villa/renders/");
const out = path("public/assets/villa/");
// Stills the site uses: the first frame, and one per season for reduced motion.
const LOOKS = ["spring-morning", "summer-sunset", "autumn-storm", "winter-snowfall"];
const BUILD_FRAMES = 168;
const CYCLE_START = 1001;
const CYCLE_FRAMES = 60 * 24;
const SD = "scale=1920:720:flags=lanczos";
const HD = "scale=trunc(iw/2)*2:trunc(ih/2)*2";
// Only encode a film once every frame of it has rendered.
const complete = (dir, count) => existsSync(dir) && readdirSync(dir).filter((f) => f.endsWith(".png")).length >= count;

const ffmpeg = (args, file) => {
  const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", ...args, file], { stdio: ["ignore", "ignore", "inherit"] });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${file}`);
  console.log(file.replace(out, ""));
};
const encode = (inputs, filter, name, crf) => {
  ffmpeg([...inputs, "-filter_complex", filter, "-map", "[v]", "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", String(crf.h264), "-preset", "slow", "-movflags", "+faststart"], `${out}${name}.mp4`);
  ffmpeg([...inputs, "-filter_complex", filter, "-map", "[v]", "-an", "-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p", "-crf", String(crf.vp9), "-b:v", "0", "-row-mt", "1"], `${out}${name}.webm`);
};

for (const frame of ["pano"]) {
  mkdirSync(`${out}${frame}`, { recursive: true });
  for (const look of LOOKS) {
    const png = `${renders}${frame}-${look}.png`;
    if (!existsSync(png)) continue;
    await sharp(png).webp({ quality: 84, effort: 6 }).toFile(`${out}${frame}/${look}-hd.webp`);
    await sharp(png).resize(1920).webp({ quality: 84, effort: 6 }).toFile(`${out}${frame}/${look}.webp`);
    console.log(`${frame}/${look}{,-hd}.webp`);
  }

  const buildSeq = `${renders}build-${frame}/f_%04d.png`;
  const buildDone = complete(`${renders}build-${frame}`, BUILD_FRAMES);
  if (buildDone) {
    // Hold the last frame for half a second before the time-lapse takes over.
    for (const [size, suffix, crf] of [[SD, "", { h264: 22, vp9: 33 }], [HD, "-hd", { h264: 22, vp9: 32 }]]) {
      encode(["-framerate", "24", "-i", buildSeq], `[0:v]tpad=stop_mode=clone:stop_duration=0.5,${size}[v]`, `${frame}/build${suffix}`, crf);
    }
  }

  if (buildDone && complete(`${renders}cycle-${frame}`, CYCLE_FRAMES)) {
    const inputs = [
      "-framerate", "24", "-start_number", String(CYCLE_START), "-i", `${renders}cycle-${frame}/f_%04d.png`,
      "-framerate", "24", "-start_number", String(BUILD_FRAMES - 23), "-i", buildSeq,
    ];
    for (const [size, suffix, crf] of [[SD, "", { h264: 24, vp9: 35 }], [HD, "-hd", { h264: 23, vp9: 33 }]]) {
      const filter = `[1:v]trim=end_frame=24,setpts=PTS-STARTPTS[tail];[0:v][tail]xfade=transition=fade:duration=1:offset=59,${size}[v]`;
      encode(inputs, filter, `${frame}/cycle${suffix}`, crf);
    }
  }
}
