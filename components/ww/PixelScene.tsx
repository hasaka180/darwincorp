"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Service-page heroes: dot-matrix scenes in the homepage dream palette.
 *
 *   web    a browser window assembles itself, a cursor clicks it and carries
 *          the layout to a phone; voxel </> mark.
 *   brand  a brand board constructs a logo (guides, circle, mark), sets type
 *          and colour, then the mark flies onto a social post; voxel & mark.
 *
 * Both share copper dunes and a floating voxel mark. Everything except the
 * mark is drawn into a low-resolution colour buffer, then re-rendered as
 * round dots whose size follows the buffer's alpha. The mark is a tiny
 * painter's-algorithm voxel renderer on the same 2D canvas, so no WebGL.
 */

export type PixelVariant = "web" | "brand";

type RGB = [number, number, number];
const LILAC: RGB = [230, 201, 219];
const LAVENDER: RGB = [196, 165, 207];
const ORCHID: RGB = [152, 103, 179];
const ROSE: RGB = [198, 79, 101];
const COPPER: RGB = [207, 116, 102];
const CORAL: RGB = [255, 91, 58];
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (v: number) => { v = clamp01(v); return v * v * (3 - 2 * v); };
const seg = (p: number, a: number, b: number) => smooth((p - a) / (b - a));
const TAU = Math.PI * 2;
const LOOP = 11; // seconds per cycle

/* ---------- Voxel glyphs ---------- */

/** </> drawn with 2-wide strokes. */
function webGlyph(): string[] {
  const rows = Array.from({ length: 7 }, () => Array(17).fill("."));
  const put = (x: number, y: number) => { rows[y][x] = "#"; rows[y][x + 1] = "#"; };
  for (let y = 0; y < 7; y++) {
    put(Math.abs(3 - y), y);
    put(9 - Math.round((y * 3) / 6), y);
    put(15 - Math.abs(3 - y), y);
  }
  return rows.map((r) => r.join(""));
}

const AMPERSAND = [
  "..####.....",
  ".##..##....",
  ".##..##....",
  "..####.....",
  ".####...##.",
  "##..##.##..",
  "##...###...",
  "##....##...",
  "##...####..",
  ".##.##..##.",
  "..###....##",
];

type V3 = [number, number, number];
const FACES: { n: V3; c: V3[] }[] = [
  { n: [1, 0, 0], c: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
  { n: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
  { n: [0, 1, 0], c: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]] },
  { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { n: [0, 0, -1], c: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] },
];
const DEPTH = 2;

/** Outer faces of a voxel glyph, each with its base colour. */
function buildMark(rows: string[]) {
  const H = rows.length, W = rows[0].length;
  const solid = new Set<string>();
  const vox: V3[] = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== "#") return;
    for (let z = 0; z < DEPTH; z++) { const v: V3 = [x, H - 1 - y, z]; vox.push(v); solid.add(v.join(",")); }
  }));
  // Colour runs across the glyph: lavender -> violet -> orchid -> coral.
  const stops: [number, RGB][] = [[0, [212, 178, 240]], [0.35, [150, 100, 228]], [0.66, [204, 86, 164]], [1, [255, 128, 92]]];
  const tint = (t: number): RGB => {
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const [a, ca] = stops[i - 1], [b, cb] = stops[i], k = (t - a) / (b - a);
        return [ca[0] + (cb[0] - ca[0]) * k, ca[1] + (cb[1] - ca[1]) * k, ca[2] + (cb[2] - ca[2]) * k];
      }
    }
    return stops[stops.length - 1][1];
  };
  const faces: { n: V3; pts: V3[]; base: RGB }[] = [];
  const cx = W / 2, cy = H / 2, cz = DEPTH / 2;
  for (const [x, y, z] of vox) {
    for (const f of FACES) {
      if (solid.has(`${x + f.n[0]},${y + f.n[1]},${z + f.n[2]}`)) continue;
      // Diagonal for tall glyphs, horizontal for wide ones.
      const t = W > H * 1.5 ? x / (W - 1) : (x / (W - 1)) * 0.6 + ((H - 1 - y) / (H - 1)) * 0.4;
      faces.push({ n: f.n, pts: f.c.map((c) => [x + c[0] - cx, y + c[1] - cy, z + c[2] - cz] as V3), base: tint(t) });
    }
  }
  return faces;
}

const LIGHT: V3 = (() => { const l: V3 = [-0.45, 0.7, 0.55]; const m = Math.hypot(...l); return [l[0] / m, l[1] / m, l[2] / m]; })();

function drawMark(ctx: CanvasRenderingContext2D, faces: ReturnType<typeof buildMark>, mx: number, my: number, s: number, t: number) {
  // Gentle sway, never side-on, so the glyph always reads.
  const ay = Math.sin(t * 0.45) * 0.42 + 0.18;
  const ax = 0.3 + Math.sin(t * 0.3) * 0.06;
  const sy = Math.sin(ay), cyr = Math.cos(ay), sx = Math.sin(ax), cxr = Math.cos(ax);
  const rot = (p: V3): V3 => {
    const x1 = p[0] * cyr + p[2] * sy, z1 = -p[0] * sy + p[2] * cyr;
    return [x1, p[1] * cxr - z1 * sx, p[1] * sx + z1 * cxr];
  };
  const D = 34; // camera distance in voxel units
  const drawn: { z: number; pts: [number, number][]; col: string }[] = [];
  for (const f of faces) {
    const n = rot(f.n);
    if (n[2] <= 0.001) continue;
    const r = f.pts.map(rot);
    const pts = r.map((p) => { const k = D / (D - p[2]); return [mx + p[0] * s * k, my - p[1] * s * k] as [number, number]; });
    const lam = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
    const amb = 0.5 + 0.7 * lam, spec = Math.pow(lam, 8) * 0.5;
    const col = f.base.map((c) => Math.min(255, Math.round(c * amb + 255 * spec)));
    drawn.push({ z: (r[0][2] + r[1][2] + r[2][2] + r[3][2]) / 4, pts, col: `rgb(${col[0]},${col[1]},${col[2]})` });
  }
  drawn.sort((a, b) => a.z - b.z);
  ctx.lineJoin = "round";
  ctx.lineWidth = 0.75;
  for (const d of drawn) {
    ctx.beginPath();
    ctx.moveTo(d.pts[0][0], d.pts[0][1]);
    for (let i = 1; i < 4; i++) ctx.lineTo(d.pts[i][0], d.pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = d.col;
    ctx.strokeStyle = d.col; // seals hairline seams between faces
    ctx.fill();
    ctx.stroke();
  }
}

/* ---------- Layout ---------- */

function layout(w: number, h: number, variant: PixelVariant) {
  // The ampersand is taller than </>, so it gets smaller voxels.
  const k = variant === "brand" ? 0.98 : 1;
  if (w / h > 1.15) {
    const bw = w * 0.24, pw = w * 0.092;
    return {
      wide: true,
      board: { x: w * 0.47, y: h * 0.14, w: bw, h: Math.min(h * 0.36, bw * 0.78) },
      phone: { x: w * 0.872, y: h * 0.18, w: pw, h: Math.min(h * 0.46, pw * 2.05) },
      mark: variant === "brand"
        ? { x: w * 0.75, y: h * 0.67, s: Math.min(w * 0.014, h * 0.024) * k }
        : { x: w * 0.74, y: h * 0.66, s: Math.min(w * 0.014, h * 0.024) },
      dunes: h * 0.8,
    };
  }
  return {
    wide: false,
    board: { x: w * 0.06, y: h * 0.1, w: w * 0.52, h: h * 0.36 },
    phone: { x: w * 0.72, y: h * 0.1, w: w * 0.21, h: h * 0.44 },
    mark: { x: w * 0.5, y: h * (variant === "brand" ? 0.63 : 0.64), s: w * 0.03 * k },
    dunes: h * 0.83,
  };
}
type Layout = ReturnType<typeof layout>;
type Rect = { x: number; y: number; w: number; h: number };

/* ---------- Shared buffer drawing (units: buffer cells) ---------- */

function roundRect(b: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  b.beginPath();
  if (b.roundRect) b.roundRect(x, y, w, h, r); else b.rect(x, y, w, h);
}

function ripple(b: CanvasRenderingContext2D, x: number, y: number, q: number, max: number) {
  if (q <= 0 || q >= 1) return;
  b.beginPath();
  b.arc(x, y, 1 + q * max, 0, TAU);
  b.lineWidth = 1;
  b.strokeStyle = rgba(CORAL, 1 - q);
  b.stroke();
}

/** Frame that draws in from the top. */
function frameIn(b: CanvasRenderingContext2D, r: Rect, radius: number, q: number, a: number) {
  if (q <= 0) return;
  b.save();
  b.beginPath();
  b.rect(r.x - 2, r.y - 2, r.w + 4, (r.h + 4) * q);
  b.clip();
  roundRect(b, r.x, r.y, r.w, r.h, radius);
  b.lineWidth = 1;
  b.strokeStyle = rgba(LILAC, 0.95 * a);
  b.stroke();
  b.restore();
}

function backdrop(b: CanvasRenderingContext2D, cols: number, rows: number, step: number, L: Layout, t: number) {
  const c = (v: number) => v / step;
  b.clearRect(0, 0, cols, rows);

  // Light from the mark swells the nearby dots.
  const gx = c(L.mark.x), gy = c(L.mark.y), gr = c(L.mark.s * 13);
  const glow = b.createRadialGradient(gx, gy, 0, gx, gy, gr);
  glow.addColorStop(0, rgba(LILAC, 0.55));
  glow.addColorStop(0.5, rgba(ORCHID, 0.18));
  glow.addColorStop(1, rgba(ORCHID, 0));
  b.fillStyle = glow;
  b.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);

  // Copper dunes, as under the homepage sky.
  const dune = (base: number, amp: number, freq: number, speed: number, top: RGB, a: number) => {
    b.beginPath();
    b.moveTo(0, rows);
    for (let x = 0; x <= cols; x++) {
      b.lineTo(x, base + Math.sin(x * freq + t * speed) * amp + Math.sin(x * freq * 0.37 - t * speed * 0.6) * amp * 1.6);
    }
    b.lineTo(cols, rows);
    b.closePath();
    const g = b.createLinearGradient(0, base - amp * 2, 0, rows);
    g.addColorStop(0, rgba(top, a));
    g.addColorStop(0.35, rgba(ROSE, a * 0.5));
    g.addColorStop(1, rgba(ORCHID, a * 0.12));
    b.fillStyle = g;
    b.fill();
  };
  const dr = c(L.dunes);
  dune(dr - rows * 0.05, rows * 0.012, 0.07, 0.25, ORCHID, 0.35);
  dune(dr, rows * 0.018, 0.11, 0.5, COPPER, 0.85);
  if (L.wide) {
    // Keep the copy side quiet.
    b.globalCompositeOperation = "destination-out";
    const e = b.createLinearGradient(0, 0, cols * 0.58, 0);
    e.addColorStop(0, "rgba(0,0,0,1)");
    e.addColorStop(0.55, "rgba(0,0,0,0.92)");
    e.addColorStop(1, "rgba(0,0,0,0)");
    b.fillStyle = e;
    b.fillRect(0, dr - rows * 0.12, cols, rows);
    b.globalCompositeOperation = "source-over";
  }
  b.lineWidth = 1;
}

/* ---------- Web: browser builds, cursor carries it to a phone ---------- */

function cursor(b: CanvasRenderingContext2D, x: number, y: number, k: number, a: number) {
  const pts = [[0, 0], [0, 7], [1.8, 5.4], [3.2, 8.4], [4.4, 7.8], [3, 4.9], [5.2, 4.9]];
  b.beginPath();
  pts.forEach(([px, py], i) => (i ? b.lineTo(x + px * k, y + py * k) : b.moveTo(x + px * k, y + py * k)));
  b.closePath();
  b.fillStyle = `rgba(255,255,255,${a})`;
  b.fill();
}

function paintWeb(b: CanvasRenderingContext2D, step: number, L: Layout, p: number, w: number) {
  const c = (v: number) => v / step;
  const fade = 1 - seg(p, 0.92, 0.99);

  const B = { x: c(L.board.x), y: c(L.board.y), w: c(L.board.w), h: c(L.board.h) };
  frameIn(b, B, 2, seg(p, 0, 0.08), fade);
  const pb = seg(p, 0.08, 0.14) * fade;
  if (pb > 0) {
    b.fillStyle = rgba(LILAC, 0.6 * pb);
    b.fillRect(B.x, B.y + 3, B.w, 0.9);
    [CORAL, ROSE, LAVENDER].forEach((col, i) => { b.beginPath(); b.arc(B.x + 2 + i * 1.9, B.y + 1.6, 0.75, 0, TAU); b.fillStyle = rgba(col, pb); b.fill(); });
  }
  const textW = B.w * 0.5;
  b.fillStyle = `rgba(255,255,255,${0.95 * fade})`;
  b.fillRect(B.x + 2, B.y + 6, textW * seg(p, 0.15, 0.23), 1.7);
  b.fillRect(B.x + 2, B.y + 8.6, textW * 0.72 * seg(p, 0.19, 0.27), 1.7);
  b.fillStyle = rgba(LAVENDER, 0.55 * fade);
  for (let i = 0; i < 3; i++) b.fillRect(B.x + 2, B.y + 12 + i * 1.8, textW * (0.9 - i * 0.18) * seg(p, 0.25 + i * 0.025, 0.32 + i * 0.025), 0.8);
  const img = { x: B.x + B.w * 0.6, y: B.y + 5.5, w: B.w * 0.34, h: B.h * 0.52 };
  const pi = seg(p, 0.3, 0.42);
  if (pi > 0) {
    const g = b.createLinearGradient(img.x, img.y, img.x + img.w, img.y + img.h);
    g.addColorStop(0, rgba(CORAL, 0.95 * fade));
    g.addColorStop(0.55, rgba(ROSE, 0.8 * fade));
    g.addColorStop(1, rgba(ORCHID, 0.75 * fade));
    b.fillStyle = g;
    b.fillRect(img.x, img.y, img.w * pi, img.h);
  }
  const btn = { x: B.x + 2, y: B.y + B.h - 5.5, w: Math.min(9, B.w * 0.3), h: 2.6 };
  const pbn = seg(p, 0.42, 0.48) * fade;
  const flash1 = p > 0.61 && p < 0.65;
  if (pbn > 0) { roundRect(b, btn.x, btn.y, btn.w, btn.h, 1.3); b.fillStyle = flash1 ? `rgba(255,255,255,${pbn})` : rgba(CORAL, pbn); b.fill(); }

  const P = { x: c(L.phone.x), y: c(L.phone.y), w: c(L.phone.w), h: c(L.phone.h) };
  const pp = seg(p, 0.64, 0.7) * fade;
  if (pp > 0) {
    frameIn(b, P, 2.4, 1, pp);
    b.fillStyle = rgba(LILAC, 0.7 * pp);
    b.fillRect(P.x + P.w / 2 - 1.5, P.y + 1.2, 3, 0.8);
    const pim = seg(p, 0.68, 0.76) * fade;
    const g = b.createLinearGradient(P.x, P.y + 3, P.x + P.w, P.y + 3 + P.h * 0.38);
    g.addColorStop(0, rgba(CORAL, 0.95 * pim));
    g.addColorStop(1, rgba(ORCHID, 0.8 * pim));
    b.fillStyle = g;
    b.fillRect(P.x + 1.5, P.y + 3, (P.w - 3) * pim, P.h * 0.38);
    b.fillStyle = `rgba(255,255,255,${0.95 * fade})`;
    b.fillRect(P.x + 1.5, P.y + 4.5 + P.h * 0.38, (P.w - 3) * 0.85 * seg(p, 0.72, 0.79), 1.4);
    b.fillRect(P.x + 1.5, P.y + 6.6 + P.h * 0.38, (P.w - 3) * 0.6 * seg(p, 0.74, 0.81), 1.4);
    b.fillStyle = rgba(LAVENDER, 0.55 * fade);
    b.fillRect(P.x + 1.5, P.y + 9.5 + P.h * 0.38, (P.w - 3) * 0.8 * seg(p, 0.76, 0.83), 0.8);
    const pbtn = seg(p, 0.78, 0.83) * fade;
    const flash2 = p > 0.85 && p < 0.88;
    roundRect(b, P.x + 1.5, P.y + P.h - 4.5, P.w - 3, 2.4, 1.2);
    b.fillStyle = flash2 ? `rgba(255,255,255,${pbtn})` : rgba(CORAL, pbtn);
    b.fill();
  }

  const k = w > 700 ? 1 : 0.75;
  const start = { x: B.x + B.w * 0.85, y: B.y + B.h + 7 };
  const b1 = { x: btn.x + btn.w * 0.6, y: btn.y + btn.h * 0.5 };
  const b2 = { x: P.x + P.w * 0.55, y: P.y + P.h - 3.3 };
  const ca = seg(p, 0.48, 0.52) * (1 - seg(p, 0.9, 0.94));
  if (ca > 0) {
    let x = start.x, y = start.y;
    const m1 = seg(p, 0.5, 0.6), m2 = seg(p, 0.66, 0.84);
    x += (b1.x - start.x) * m1 + (b2.x - b1.x) * m2;
    y += (b1.y - start.y) * m1 + (b2.y - b1.y) * m2 - Math.sin(m2 * Math.PI) * c(L.phone.h) * 0.25;
    ripple(b, b1.x, b1.y, (p - 0.61) / 0.1, 6);
    ripple(b, b2.x, b2.y, (p - 0.85) / 0.08, 5);
    cursor(b, x, y, k, ca);
  }
}

/* ---------- Brand: construct a mark, set type and colour, apply it ---------- */

/** The demo logo: a crescent with a coral dot, "a brand that evolves". */
function crescent(b: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string | CanvasGradient, cut: string | null, dotA: number) {
  b.beginPath();
  b.arc(cx, cy, r, 0, TAU);
  b.fillStyle = fill;
  b.fill();
  const ix = cx + r * 0.34, iy = cy - r * 0.16;
  b.beginPath();
  b.arc(ix, iy, r * 0.62, 0, TAU);
  if (cut) { b.fillStyle = cut; b.fill(); }
  else { b.globalCompositeOperation = "destination-out"; b.fillStyle = "#000"; b.fill(); b.globalCompositeOperation = "source-over"; }
  if (dotA > 0) { b.beginPath(); b.arc(ix + r * 0.05, iy + r * 0.05, Math.max(0.7, r * 0.2), 0, TAU); b.fillStyle = rgba(CORAL, dotA); b.fill(); }
}

function paintBrand(b: CanvasRenderingContext2D, step: number, L: Layout, p: number, serif: string) {
  const c = (v: number) => v / step;
  const fade = 1 - seg(p, 0.92, 0.99);

  // Brand board.
  const B = { x: c(L.board.x), y: c(L.board.y), w: c(L.board.w), h: c(L.board.h) };
  frameIn(b, B, 2, seg(p, 0, 0.08), fade);
  const pad = 2.5;
  const q = Math.min(B.h * 0.62, B.w * 0.44); // construction square
  const ox = B.x + pad, oy = B.y + pad, mcx = ox + q / 2, mcy = oy + q / 2, R = q * 0.4;

  // The mark resolves inside the construction.
  const pm = seg(p, 0.2, 0.3) * fade;
  if (pm > 0) {
    const g = b.createLinearGradient(mcx - R, mcy - R, mcx + R, mcy + R);
    g.addColorStop(0, rgba(LILAC, pm));
    g.addColorStop(0.5, rgba(ORCHID, pm));
    g.addColorStop(1, rgba(ROSE, pm));
    crescent(b, mcx, mcy, R, g, null, pm);
  }
  // Guides: grid, diagonals and the circle, fading back once the mark lands.
  const pg = seg(p, 0.08, 0.16) * (1 - 0.65 * seg(p, 0.52, 0.6)) * fade;
  if (pg > 0) {
    b.lineWidth = 0.7;
    b.strokeStyle = rgba(LAVENDER, 0.75 * pg);
    b.beginPath();
    b.rect(ox, oy, q, q);
    b.moveTo(ox, mcy); b.lineTo(ox + q, mcy);
    b.moveTo(mcx, oy); b.lineTo(mcx, oy + q);
    b.moveTo(ox, oy); b.lineTo(ox + q, oy + q);
    b.moveTo(ox + q, oy); b.lineTo(ox, oy + q);
    b.stroke();
    b.lineWidth = 1;
  }
  const pc = seg(p, 0.12, 0.22);
  if (pc > 0) {
    b.beginPath();
    b.arc(mcx, mcy, R, -Math.PI / 2, -Math.PI / 2 + TAU * pc);
    b.strokeStyle = rgba(LILAC, 0.95 * fade * (1 - 0.5 * seg(p, 0.52, 0.6)));
    b.stroke();
  }

  // Type specimen.
  const tx = ox + q + 2.5, tw = B.x + B.w - pad - tx;
  const pt = seg(p, 0.3, 0.4) * fade;
  if (pt > 0) {
    const size = Math.min(q * 0.95, tw * 0.95);
    b.font = `600 ${size}px ${serif}`;
    b.textBaseline = "alphabetic";
    b.fillStyle = `rgba(255,255,255,${pt})`;
    b.fillText("Aa", tx, oy + size * 0.78);
    b.fillStyle = rgba(LAVENDER, 0.6 * fade);
    for (let i = 0; i < 3; i++) b.fillRect(tx, oy + size * 0.78 + 2.2 + i * 1.8, tw * (0.9 - i * 0.2) * seg(p, 0.34 + i * 0.025, 0.41 + i * 0.025), 0.8);
  }

  // Colour swatches.
  const sy = oy + q + 2, sh = B.y + B.h - pad - sy;
  if (sh > 1) {
    const gap = 1.4, sw = (B.w - pad * 2 - gap * 3) / 4;
    [CORAL, ROSE, ORCHID, LILAC].forEach((col, i) => {
      const s = seg(p, 0.42 + i * 0.03, 0.47 + i * 0.03) * fade;
      if (s <= 0) return;
      roundRect(b, ox + i * (sw + gap), sy + sh * (1 - s), sw, sh * s, 0.8);
      b.fillStyle = rgba(col, 0.95);
      b.fill();
    });
  }

  // Phone with a social post.
  const P = { x: c(L.phone.x), y: c(L.phone.y), w: c(L.phone.w), h: c(L.phone.h) };
  const pp = seg(p, 0.6, 0.66) * fade;
  const tile = { x: P.x + 1.5, y: P.y + 3, w: P.w - 3, h: Math.min(P.w - 3, P.h * 0.5) };
  const tcx = tile.x + tile.w / 2, tcy = tile.y + tile.h / 2, tr = tile.w * 0.28;
  if (pp > 0) {
    frameIn(b, P, 2.4, 1, pp);
    b.fillStyle = rgba(LILAC, 0.7 * pp);
    b.fillRect(P.x + P.w / 2 - 1.5, P.y + 1.2, 3, 0.8);
    const pti = seg(p, 0.64, 0.72) * fade;
    if (pti > 0) {
      const g = b.createLinearGradient(tile.x, tile.y, tile.x + tile.w, tile.y + tile.h);
      g.addColorStop(0, rgba(ORCHID, 0.9 * pti));
      g.addColorStop(1, rgba(ROSE, 0.9 * pti));
      b.fillStyle = g;
      b.fillRect(tile.x, tile.y, tile.w, tile.h * pti);
    }
    b.fillStyle = `rgba(255,255,255,${0.95 * fade})`;
    b.fillRect(tile.x, tile.y + tile.h + 1.6, tile.w * 0.8 * seg(p, 0.78, 0.84), 1.4);
    b.fillStyle = rgba(LAVENDER, 0.55 * fade);
    b.fillRect(tile.x, tile.y + tile.h + 4, tile.w * 0.9 * seg(p, 0.8, 0.86), 0.8);
    b.fillRect(tile.x, tile.y + tile.h + 5.8, tile.w * 0.6 * seg(p, 0.82, 0.88), 0.8);
    // Swatch dots echo the palette under the post.
    [CORAL, ROSE, ORCHID, LILAC].forEach((col, i) => {
      const s = seg(p, 0.84 + i * 0.01, 0.87 + i * 0.01) * fade;
      if (s > 0) { b.beginPath(); b.arc(tile.x + 1 + i * 2.4, P.y + P.h - 3, 0.8, 0, TAU); b.fillStyle = rgba(col, s); b.fill(); }
    });
  }

  // The mark leaves the board and lands on the post.
  const fly = seg(p, 0.66, 0.76);
  const landed = p >= 0.76;
  if (fly > 0 && !landed) {
    const x = mcx + (tcx - mcx) * fly, y = mcy + (tcy - mcy) * fly - Math.sin(fly * Math.PI) * B.h * 0.35;
    const r = R + (tr - R) * fly;
    crescent(b, x, y, r, `rgba(255,255,255,${0.9 * fade})`, null, fade);
  }
  if (landed) {
    const pop = 1 + 0.25 * (1 - seg(p, 0.76, 0.82));
    crescent(b, tcx, tcy, tr * pop, `rgba(255,255,255,${fade})`, rgba(ROSE, 0.9 * fade), fade);
    ripple(b, tcx, tcy, (p - 0.76) / 0.1, tile.w * 0.55);
  }
}

/* ---------- Component ---------- */

export default function PixelScene({ variant }: { variant: PixelVariant }) {
  const wrap = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const canvas = ref.current, box = wrap.current;
    if (!canvas || !box) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mark = buildMark(variant === "brand" ? AMPERSAND : webGlyph());
    // The homepage's Handjet display face: a pixel font that survives the dot grid.
    const fontVar = getComputedStyle(document.documentElement).getPropertyValue("--font-handjet").trim();
    const serif = `${fontVar ? `${fontVar}, ` : ""}ui-monospace, monospace`;
    const buf = document.createElement("canvas");
    const bctx = buf.getContext("2d", { willReadFrequently: true })!;
    const colour = document.createElement("canvas");
    const cctx = colour.getContext("2d")!;
    const dots = document.createElement("canvas");
    const dctx = dots.getContext("2d")!;
    const ambient = document.createElement("canvas");
    const actx = ambient.getContext("2d")!;

    let w = 0, h = 0, dpr = 1, step = 8, cols = 0, rows = 0;
    let L = layout(1, 1, variant);

    const resize = () => {
      const r = box.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      step = Math.max(6, Math.round(w / 170));
      cols = Math.ceil(w / step); rows = Math.ceil(h / step);
      for (const cv of [canvas, dots, ambient]) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      buf.width = colour.width = cols; buf.height = colour.height = rows;
      L = layout(w, h, variant);
      // Static dot grid: the matrix every lit dot sits on.
      actx.setTransform(dpr, 0, 0, dpr, 0, 0);
      actx.clearRect(0, 0, w, h);
      actx.beginPath();
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const x = (i + 0.5) * step, y = (j + 0.5) * step;
        actx.moveTo(x + step * 0.1, y);
        actx.arc(x, y, step * 0.1, 0, TAU);
      }
      actx.fillStyle = rgba(LAVENDER, 0.16);
      actx.fill();
    };

    const frame = (t: number) => {
      backdrop(bctx, cols, rows, step, L, t);
      const p = (t % LOOP) / LOOP;
      if (variant === "brand") paintBrand(bctx, step, L, p, serif);
      else paintWeb(bctx, step, L, p, w);

      const img = bctx.getImageData(0, 0, cols, rows);
      const d = img.data;
      const maxR = step * 0.5;
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dctx.globalCompositeOperation = "source-over";
      dctx.clearRect(0, 0, w, h);
      dctx.beginPath();
      for (let j = 0, k = 0; j < rows; j++) for (let i = 0; i < cols; i++, k += 4) {
        const a = d[k + 3];
        if (a < 10) continue;
        const r = maxR * Math.pow(a / 255, 0.55);
        const x = (i + 0.5) * step, y = (j + 0.5) * step;
        dctx.moveTo(x + r, y);
        dctx.arc(x, y, r, 0, TAU);
        d[k + 3] = 255;
      }
      dctx.fillStyle = "#fff";
      dctx.fill();
      cctx.putImageData(img, 0, 0);
      dctx.globalCompositeOperation = "source-in";
      dctx.imageSmoothingEnabled = false;
      dctx.drawImage(colour, 0, 0, cols * step, rows * step);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(ambient, 0, 0, w, h);

      const s = L.mark.s, mx = L.mark.x, my = L.mark.y + Math.sin(t * 0.8) * s * 0.45;
      // Back light behind the mark.
      ctx.globalCompositeOperation = "lighter";
      const back = ctx.createRadialGradient(mx, my, 0, mx, my, s * 16);
      back.addColorStop(0, "rgba(198,79,101,0.32)");
      back.addColorStop(0.45, "rgba(152,103,179,0.14)");
      back.addColorStop(1, "rgba(152,103,179,0)");
      ctx.fillStyle = back;
      ctx.fillRect(mx - s * 16, my - s * 16, s * 32, s * 32);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(dots, 0, 0, w, h);

      // Rays.
      ctx.globalCompositeOperation = "lighter";
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(t * 0.05);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU, len = s * (i % 2 ? 9 : 15), wd = s * 0.22;
        const g = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
        g.addColorStop(0, "rgba(255,240,250,0.32)");
        g.addColorStop(1, "rgba(196,165,207,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(-Math.sin(a) * wd, Math.cos(a) * wd);
        ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
        ctx.lineTo(Math.sin(a) * wd, -Math.cos(a) * wd);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";

      drawMark(ctx, mark, mx, my, s, t);

      // Core flare over the mark.
      ctx.globalCompositeOperation = "lighter";
      const core = ctx.createRadialGradient(mx, my, 0, mx, my, s * 4.5);
      core.addColorStop(0, `rgba(255,255,255,${variant === "brand" ? 0.45 : 0.75})`);
      core.addColorStop(0.3, `rgba(255,214,236,${variant === "brand" ? 0.16 : 0.3})`);
      core.addColorStop(1, "rgba(196,165,207,0)");
      ctx.fillStyle = core;
      ctx.fillRect(mx - s * 5, my - s * 5, s * 10, s * 10);
      ctx.globalCompositeOperation = "source-over";
    };

    resize();
    let raf = 0, visible = true, t0 = performance.now();
    const loop = (now: number) => {
      raf = 0;
      frame((now - t0) / 1000);
      if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!raf && !reduced && visible && !document.hidden) raf = requestAnimationFrame(loop); };
    const still = () => frame(LOOP * 0.88); // fully built

    if (reduced) still(); else frame(0);
    setLive(true);
    start();
    // Repaint once the serif loads, so the specimen uses it.
    document.fonts?.ready.then(() => { if (reduced) still(); });

    const ro = new ResizeObserver(() => { resize(); if (reduced) still(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); });
    io.observe(box);
    const onVis = () => { if (!document.hidden) { t0 = performance.now() - ((performance.now() - t0) % (LOOP * 1000)); start(); } };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [variant]);

  return (
    <div ref={wrap} className={`svx-scene ${live ? "is-live" : ""}`} aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}
