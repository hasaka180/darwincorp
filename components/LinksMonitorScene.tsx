"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import {
  VIEW_HEIGHT,
  CAMERA_FOV,
  SCREEN_W,
  SCREEN_H,
  SCREEN_Y,
  BEZEL,
  CASING_W,
  CASING_TOP,
  CASING_BOTTOM,
  CASING_H,
  CASING_Y,
  CASING_DEPTH,
  NECK_H,
  BASE_W,
  BASE_H,
  BASE_D,
  BASE_Y,
  BASE_TOP,
  DESK_Y,
  KEYBOARD_W,
  KEYBOARD_D,
  KEYBOARD_H,
  KEYBOARD_Z,
  MOUSE_X,
  MOUSE_Z,
} from "@/lib/linksMonitorGeometry";

/**
 * The retro CRT setup behind /links.
 *
 * A WebGL renderer draws the low-poly monitor, system unit, keyboard, desk
 * and the neon skyline; a CSS3DRenderer sharing the same camera mounts the
 * real, clickable link list (`screen` element) on the glass, inside the
 * monitor group — so when the monitor tilts with the pointer the links tilt
 * with it, pixel-exact.
 *
 * Boot sequence: the monitor settles into frame, the neon line draws in,
 * then the CRT powers on (LED, flash, glow, and the DOM gets `is-on` so the
 * page can run its own beam/stagger animation). The power button on the
 * bezel is clickable and toggles the screen.
 */

const CREAM = 0xd8d1c1;
const CREAM_DARK = 0xc4bcaa;
const TRIM = 0x121318;
const NEON_RED = 0xff2a3d;
const LED_ON = 0x6dffb0;
const LED_OFF = 0x3a2a22;

type Props = {
  className?: string;
  onScreenElement: (el: HTMLDivElement | null) => void;
};

/* ------------------------------ textures ------------------------------ */

function gradientTexture(stops: Array<[number, string]>, height = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, height);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeScreenTexture() {
  const w = 256;
  const h = Math.round((SCREEN_H / SCREEN_W) * w);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#070b18";
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w * 0.35, h * 0.68, 0, w * 0.35, h * 0.68, w);
  glow.addColorStop(0, "rgba(58,92,190,0.36)");
  glow.addColorStop(1, "rgba(58,92,190,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(0,0,0,0.24)";
  for (let y = 0; y < h; y += 2) ctx.fillRect(0, y, w, 1);
  const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.28, w / 2, h / 2, h * 0.78);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function makeKeyboardTexture() {
  const w = 384;
  const h = 112;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#cbc3b2";
  ctx.fillRect(0, 0, w, h);
  const cols = 18;
  const rows = 4;
  const pad = 5;
  const cw = (w - pad * (cols + 1)) / cols;
  const ch = (h - pad * (rows + 1)) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = pad + c * (cw + pad);
      const y = pad + r * (ch + pad);
      ctx.fillStyle = "#7f786b";
      ctx.fillRect(x, y + 2, cw, ch - 2);
      ctx.fillStyle = "#a59d8d";
      ctx.fillRect(x, y, cw, ch - 3);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeStripeTexture(color: string, gap: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = gap;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 8, gap);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 8, Math.max(1, Math.round(gap * 0.4)));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function makeLabelTexture(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0d0e12";
  ctx.fillRect(0, 0, 256, 96);
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, 244, 84);
  ctx.fillStyle = "#e9e9e9";
  ctx.font = "bold 40px ui-monospace, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 50);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeGlowTexture(inner: string, outer: string) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* ------------------------------ geometry ------------------------------ */

function roundedRectShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** A box with softly rounded edges (extruded rounded rect with a bevel). */
function roundedBox(w: number, h: number, d: number, r: number, bevel: number) {
  const geo = new THREE.ExtrudeGeometry(roundedRectShape(w - bevel * 2, h - bevel * 2, r), {
    depth: d - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 6,
  });
  geo.center();
  return geo;
}

function buildingShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0, 3.4);
  shape.lineTo(1.05, 4.7);
  shape.lineTo(2.0, 4.35);
  shape.lineTo(2.0, 0);
  shape.closePath();
  return shape;
}

function neonPath(points: Array<[number, number]>, z: number) {
  const path = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 0; i < points.length - 1; i++) {
    path.add(new THREE.LineCurve3(
      new THREE.Vector3(points[i][0], points[i][1], z),
      new THREE.Vector3(points[i + 1][0], points[i + 1][1], z),
    ));
  }
  return path;
}

function blip(on: boolean) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(on ? 620 : 420, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(on ? 1480 : 180, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => void ctx.close(), 400);
  } catch {
    /* audio is a garnish */
  }
}

/* ------------------------------ component ------------------------------ */

export default function LinksMonitorScene({ className, onScreenElement }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onScreenRef = useRef(onScreenElement);
  onScreenRef.current = onScreenElement;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const stage = mount.parentElement ?? mount;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const cameraDistance = VIEW_HEIGHT / 2 / Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 120);
    camera.position.set(0, 1.4, cameraDistance);
    camera.lookAt(0, 0.9, 0);

    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(item: T) => {
      disposables.push(item);
      return item;
    };

    let renderer: THREE.WebGLRenderer | undefined;
    let cssRenderer: CSS3DRenderer | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let visibilityObserver: IntersectionObserver | undefined;
    let disposed = false;
    let visible = true;
    let raf = 0;
    let lastFrame = 0;
    let startTime = 0;
    let elapsed = 0;
    let bootTimer = 0;
    let readyTimer = 0;

    // interaction + animation state
    const pointer = new THREE.Vector2(0, 0);
    let pointerActive = false;
    let pointerDownAt = 0;
    const raycaster = new THREE.Raycaster();
    let hoveringButton = false;
    let powered = false;
    let autoBooted = false;
    let level = 0; // eased screen brightness 0..1
    let flash = 0; // decaying turn-on flash

    const monitor = new THREE.Group();
    const backdrop = new THREE.Group();
    const skyline = new THREE.Group();
    let screenTexture: THREE.CanvasTexture | undefined;
    let screenMat: THREE.MeshBasicMaterial | undefined;
    let glowMat: THREE.SpriteMaterial | undefined;
    let ledMat: THREE.MeshBasicMaterial | undefined;
    let buttonMat: THREE.MeshPhongMaterial | undefined;
    let powerButton: THREE.Mesh | undefined;
    let neon: THREE.BufferGeometry | undefined;
    let neonGlow: THREE.BufferGeometry | undefined;
    let neonMat: THREE.MeshBasicMaterial | undefined;
    let screenObject: CSS3DObject | undefined;
    const screenEl = document.createElement("div");
    screenEl.className = "linksos__screen";
    screenEl.style.pointerEvents = "auto";

    const setPower = (on: boolean, withSound: boolean) => {
      if (powered === on) return;
      powered = on;
      if (on) flash = 1;
      screenEl.classList.toggle("is-on", on);
      screenEl.classList.toggle("is-off", !on);
      // Belt and braces: once the boot animation's window has passed, pin the
      // resting state declaratively, so a browser that skipped the keyframes
      // still ends up with a readable screen.
      clearTimeout(readyTimer);
      if (on) {
        readyTimer = window.setTimeout(() => screenEl.classList.add("is-ready"), 1700);
      } else {
        screenEl.classList.remove("is-ready");
      }
      if (ledMat) ledMat.color.setHex(on ? LED_ON : LED_OFF);
      if (withSound) blip(on);
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      lastFrame = 0;
    };
    const resume = () => {
      if (visible && !document.hidden && !raf && !disposed) raf = requestAnimationFrame(draw);
    };

    const draw = (now: number) => {
      raf = 0;
      if (disposed || !visible || document.hidden) return;
      if (lastFrame && now - lastFrame < 1000 / 30) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.08) : 0;
      lastFrame = now;
      // Wall-clock, not accumulated frame time: a throttled or paused tab
      // must never leave the intro half-played.
      if (!startTime) startTime = now;
      elapsed = (now - startTime) / 1000;
      const t = reduceMotion ? 99 : elapsed;

      // --- entrance: the monitor settles into frame, the neon line draws in
      const enter = THREE.MathUtils.clamp(t / 1.05, 0, 1);
      const e = 1 - Math.pow(1 - enter, 3);
      monitor.position.y = -0.7 * (1 - e);
      monitor.position.z = -1.5 * (1 - e);
      monitor.scale.setScalar(0.94 + 0.06 * e);
      const settleTilt = 0.12 * (1 - e);
      if (neon && neonGlow) {
        const frac = THREE.MathUtils.clamp((t - 0.35) / 1.1, 0, 1);
        const eased = 1 - Math.pow(1 - frac, 2);
        neon.setDrawRange(0, Math.floor((neon.index?.count ?? 0) * eased));
        neonGlow.setDrawRange(0, Math.floor((neonGlow.index?.count ?? 0) * eased));
      }
      // --- pointer parallax (mouse) or a slow idle sway (touch / idle)
      const targetY = pointerActive ? pointer.x * 0.2 : Math.sin(elapsed * 0.45) * 0.05;
      const targetX = pointerActive ? -pointer.y * 0.1 : Math.sin(elapsed * 0.33) * 0.02;
      const k = reduceMotion ? 1 : 1 - Math.exp(-delta * 4.5);
      monitor.rotation.y += ((reduceMotion ? 0 : targetY) - monitor.rotation.y) * k;
      monitor.rotation.x += ((reduceMotion ? 0 : targetX) + settleTilt - monitor.rotation.x) * k;
      backdrop.position.x += (-monitor.rotation.y * 1.6 - backdrop.position.x) * k;
      skyline.position.x += (-monitor.rotation.y * 3.2 - skyline.position.x) * k;

      // --- power: brightness eases toward the state, with a flash on turn-on
      level += ((powered ? 1 : 0) - level) * (reduceMotion ? 1 : 1 - Math.exp(-delta * 7));
      flash = Math.max(0, flash - delta * 2.2);
      const bright = level + flash * flash * 1.1;
      if (screenMat) screenMat.color.setScalar(bright);
      if (glowMat) glowMat.opacity = 0.55 * level + flash * 0.4;
      if (screenTexture && !reduceMotion) screenTexture.offset.y = (elapsed * 0.035) % 1;
      if (ledMat) ledMat.opacity = powered ? 0.72 + Math.sin(elapsed * 2.6) * 0.28 : 0.9;
      if (neonMat && !reduceMotion) {
        const flicker = Math.sin(elapsed * 9.1) * Math.sin(elapsed * 2.3) > 0.9 ? 0.55 : 1;
        neonMat.opacity = flicker;
      }
      if (buttonMat) {
        buttonMat.emissive.setHex(hoveringButton ? 0x3a3f4a : 0x000000);
      }

      // --- hover test for the power button
      if (powerButton && pointerActive) {
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObject(powerButton, false).length > 0;
        if (hit !== hoveringButton) {
          hoveringButton = hit;
          stage.style.cursor = hit ? "pointer" : "";
        }
      }

      try {
        renderer?.render(scene, camera);
        cssRenderer?.render(scene, camera);
      } catch {
        stop();
        return;
      }
      raf = requestAnimationFrame(draw);
    };

    const updatePointer = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      pointer.set(
        THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1),
        THREE.MathUtils.clamp(1 - ((event.clientY - rect.top) / rect.height) * 2, -1, 1),
      );
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointerActive = true;
      updatePointer(event);
    };
    const onPointerLeave = () => {
      pointerActive = false;
      hoveringButton = false;
      stage.style.cursor = "";
    };
    const onPointerDown = (event: PointerEvent) => {
      pointerDownAt = performance.now();
      updatePointer(event);
    };
    const onPointerUp = (event: PointerEvent) => {
      if (performance.now() - pointerDownAt > 400 || !powerButton) return;
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.intersectObject(powerButton, false).length) {
        autoBooted = true;
        setPower(!powered, true);
      }
    };
    const onVisibility = () => { if (document.hidden) stop(); else resume(); };

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x04050a, 1);
      renderer.domElement.className = "linksos__gl";
      mount.appendChild(renderer.domElement);

      cssRenderer = new CSS3DRenderer();
      cssRenderer.domElement.className = "linksos__css";
      cssRenderer.domElement.style.pointerEvents = "none";
      mount.appendChild(cssRenderer.domElement);

      // ---- lights: illustrative, not photoreal ----
      scene.add(new THREE.HemisphereLight(0xa8b8ff, 0x2a0c12, 1.7));
      const key = new THREE.DirectionalLight(0xfff4e6, 2.5);
      key.position.set(-7, 10, 14);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x3f6dff, 1.6);
      rim.position.set(9, 5, -8);
      scene.add(rim);
      const deskLight = new THREE.DirectionalLight(0xff3a4a, 0.42);
      deskLight.position.set(0, -6, 10);
      scene.add(deskLight);

      // ---- backdrop: sky, skyline, neon ----
      scene.add(backdrop);
      const sky = new THREE.Mesh(
        track(new THREE.PlaneGeometry(22, 40)),
        track(new THREE.MeshBasicMaterial({ map: track(gradientTexture([
          [0, "#03040a"], [0.36, "#050a24"], [0.58, "#0c1e6e"], [0.74, "#123ab8"], [0.86, "#4b1230"], [1, "#12060a"],
        ])) })),
      );
      sky.position.set(0, 1, -16);
      backdrop.add(sky);

      backdrop.add(skyline);
      const facade = track(makeStripeTexture("rgba(70,110,220,0.32)", 6));
      facade.repeat.set(1, 3.2);
      const buildingMat = track(new THREE.MeshBasicMaterial({ color: 0x0a0d18, map: facade, transparent: false }));
      const bShape = buildingShape();
      [
        { x: 2.6, y: 4.6, s: 1.75, z: -10 },
        { x: 6.0, y: 5.4, s: 1.5, z: -11 },
        { x: -7.6, y: 5.0, s: 1.25, z: -11 },
        { x: -4.9, y: 6.0, s: 0.9, z: -12 },
      ].forEach(({ x, y, s, z }) => {
        const mesh = new THREE.Mesh(track(new THREE.ShapeGeometry(bShape)), buildingMat);
        mesh.position.set(x, y, z);
        mesh.scale.set(s, s, 1);
        skyline.add(mesh);
      });

      const path = neonPath([[5.0, 12.4], [5.0, 10.0], [3.2, 10.0], [3.2, 8.9], [-6.2, 7.5]], -6);
      neon = track(new THREE.TubeGeometry(path, 96, 0.09, 6, false));
      neonGlow = track(new THREE.TubeGeometry(path, 96, 0.34, 6, false));
      neonMat = track(new THREE.MeshBasicMaterial({ color: NEON_RED, transparent: true, opacity: 1, toneMapped: false }));
      const neonGlowMat = track(new THREE.MeshBasicMaterial({
        color: NEON_RED, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      backdrop.add(new THREE.Mesh(neon, neonMat));
      backdrop.add(new THREE.Mesh(neonGlow, neonGlowMat));
      neon.setDrawRange(0, 0);
      neonGlow.setDrawRange(0, 0);
      const spur = new THREE.Mesh(
        track(new THREE.TubeGeometry(neonPath([[3.9, 12.4], [3.9, 10.9]], -6), 4, 0.09, 6, false)),
        neonMat,
      );
      backdrop.add(spur);

      // ---- desk + red glow ----
      const desk = new THREE.Mesh(
        track(new THREE.PlaneGeometry(26, 22)),
        track(new THREE.MeshBasicMaterial({ map: track(gradientTexture([
          [0, "#0d0406"], [0.4, "#3b0d13"], [0.72, "#7a1b22"], [0.9, "#5a1219"], [1, "#2b0a0d"],
        ])) })),
      );
      desk.rotation.x = -Math.PI / 2;
      desk.position.set(0, DESK_Y - 0.01, 2);
      scene.add(desk);
      const deskGlow = new THREE.Sprite(track(new THREE.SpriteMaterial({
        map: track(makeGlowTexture("rgba(255,70,80,0.35)", "rgba(255,70,80,0)")),
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      })));
      deskGlow.position.set(0, DESK_Y + 0.4, 5);
      deskGlow.scale.set(16, 5, 1);
      scene.add(deskGlow);

      // ---- system unit ----
      const plasticMat = track(new THREE.MeshPhongMaterial({ color: CREAM, shininess: 22, specular: 0x2a2a2a }));
      const plasticDark = track(new THREE.MeshPhongMaterial({ color: CREAM_DARK, shininess: 14, specular: 0x222222 }));
      const trimMat = track(new THREE.MeshPhongMaterial({ color: TRIM, shininess: 30, specular: 0x333333 }));

      const base = new THREE.Mesh(track(roundedBox(BASE_W, BASE_H, BASE_D, 0.22, 0.1)), plasticDark);
      base.position.set(0, BASE_Y, -BASE_D / 2 + 1.2);
      scene.add(base);
      const baseFrontZ = base.position.z + BASE_D / 2 + 0.01;
      [0.35, -0.2].forEach((dy) => {
        const slot = new THREE.Mesh(track(new THREE.BoxGeometry(2.6, 0.32, 0.12)), trimMat);
        slot.position.set(1.7, BASE_Y + dy, baseFrontZ);
        scene.add(slot);
      });
      const vents = new THREE.Mesh(
        track(new THREE.PlaneGeometry(2.4, 1.1)),
        track(new THREE.MeshBasicMaterial({ map: track(makeStripeTexture("rgba(40,36,32,0.9)", 8)), transparent: true })),
      );
      (vents.material as THREE.MeshBasicMaterial).map!.repeat.set(1, 9);
      vents.position.set(-2.5, BASE_Y, baseFrontZ);
      scene.add(vents);
      const neck = new THREE.Mesh(track(new THREE.BoxGeometry(3.2, NECK_H + 0.05, 2.2)), trimMat);
      neck.position.set(0, BASE_TOP + NECK_H / 2, -0.4);
      scene.add(neck);

      // ---- keyboard + mouse ----
      const keyTex = track(makeKeyboardTexture());
      const keyboard = new THREE.Mesh(
        track(new THREE.BoxGeometry(KEYBOARD_W, KEYBOARD_H, KEYBOARD_D)),
        [plasticDark, plasticDark, track(new THREE.MeshPhongMaterial({ map: keyTex, shininess: 8 })), plasticDark, plasticMat, plasticDark],
      );
      keyboard.rotation.x = 0.06;
      keyboard.position.set(-0.4, DESK_Y + KEYBOARD_H / 2 + 0.05, KEYBOARD_Z);
      scene.add(keyboard);
      const mouse = new THREE.Mesh(track(new THREE.SphereGeometry(0.42, 14, 10)), plasticMat);
      mouse.scale.set(0.9, 0.5, 1.35);
      mouse.position.set(MOUSE_X, DESK_Y + 0.2, MOUSE_Z);
      scene.add(mouse);

      // ---- monitor group (everything here tilts together) ----
      scene.add(monitor);
      const casing = new THREE.Mesh(track(roundedBox(CASING_W, CASING_H, CASING_DEPTH, 0.5, 0.16)), plasticMat);
      casing.position.set(0, CASING_Y, -CASING_DEPTH / 2);
      monitor.add(casing);

      const bezel = new THREE.Mesh(
        track(roundedBox(SCREEN_W + BEZEL * 1.1, SCREEN_H + BEZEL * 1.1, 0.5, 0.42, 0.08)),
        trimMat,
      );
      bezel.position.set(0, SCREEN_Y, -0.08);
      monitor.add(bezel);

      screenTexture = track(makeScreenTexture());
      screenMat = track(new THREE.MeshBasicMaterial({ map: screenTexture, color: 0x000000 }));
      const glass = new THREE.Mesh(track(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H)), screenMat);
      glass.position.set(0, SCREEN_Y, 0.18);
      monitor.add(glass);

      glowMat = track(new THREE.SpriteMaterial({
        map: track(makeGlowTexture("rgba(90,130,255,0.55)", "rgba(90,130,255,0)")),
        transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      const glow = new THREE.Sprite(glowMat);
      glow.position.set(0, SCREEN_Y, 0.3);
      glow.scale.set(SCREEN_W * 1.55, SCREEN_H * 1.4, 1);
      monitor.add(glow);

      // the DOM screen lives right on the glass
      screenObject = new CSS3DObject(screenEl);
      screenObject.position.set(0, SCREEN_Y, 0.2);
      monitor.add(screenObject);

      // control band: vent grille, plaque, buttons, power
      const bandY = CASING_BOTTOM + 0.72;
      const grille = new THREE.Mesh(
        track(new THREE.PlaneGeometry(1.6, 0.7)),
        track(new THREE.MeshBasicMaterial({ map: track(makeStripeTexture("rgba(40,36,32,0.9)", 8)), transparent: true })),
      );
      (grille.material as THREE.MeshBasicMaterial).map!.repeat.set(1, 6);
      grille.position.set(-CASING_W / 2 + 1.3, bandY, 0.03);
      monitor.add(grille);

      const plaque = new THREE.Mesh(
        track(new THREE.PlaneGeometry(1.7, 0.64)),
        track(new THREE.MeshBasicMaterial({ map: track(makeLabelTexture("HASAKA")) })),
      );
      plaque.position.set(0, bandY, 0.03);
      monitor.add(plaque);

      const knobMat = track(new THREE.MeshPhongMaterial({ color: 0x8e887b, shininess: 30 }));
      [1.35, 1.85, 2.35].forEach((dx) => {
        const knob = new THREE.Mesh(track(new THREE.CylinderGeometry(0.11, 0.11, 0.12, 12)), knobMat);
        knob.rotation.x = Math.PI / 2;
        knob.position.set(dx, bandY, 0.05);
        monitor.add(knob);
      });
      buttonMat = track(new THREE.MeshPhongMaterial({ color: 0xb6ae9d, shininess: 26 }));
      powerButton = new THREE.Mesh(track(roundedBox(0.62, 0.62, 0.2, 0.1, 0.04)), buttonMat);
      powerButton.position.set(CASING_W / 2 - 0.85, bandY, 0.08);
      monitor.add(powerButton);
      const powerRing = new THREE.Mesh(track(new THREE.RingGeometry(0.14, 0.18, 20, 1, 0.6, 5.1)), trimMat);
      powerRing.position.set(powerButton.position.x, bandY, 0.19);
      monitor.add(powerRing);

      ledMat = track(new THREE.MeshBasicMaterial({ color: LED_OFF, transparent: true, opacity: 0.9, toneMapped: false }));
      const led = new THREE.Mesh(track(new THREE.CircleGeometry(0.075, 12)), ledMat);
      led.position.set(CASING_W / 2 - 1.55, bandY - 0.42, 0.03);
      monitor.add(led);

      // papers stacked on top
      const paperMat = track(new THREE.MeshPhongMaterial({ color: 0xece7db, shininess: 4 }));
      for (let i = 0; i < 4; i++) {
        const paper = new THREE.Mesh(track(new THREE.BoxGeometry(4.4 - i * 0.12, 0.06, 1.6 - i * 0.05)), paperMat);
        paper.position.set(0.15 - i * 0.08, CASING_TOP + 0.03 + i * 0.065, -CASING_DEPTH / 2 + 0.3);
        paper.rotation.y = (i % 2 ? -1 : 1) * 0.06 * (i + 1);
        monitor.add(paper);
      }

      // ---- sizing: both renderers + the DOM screen ----
      const resize = () => {
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer?.setSize(width, height, false);
        cssRenderer?.setSize(width, height);
        // the screen element's pixel size ≈ the size it renders at rest, so
        // text is rasterised at ~1:1 and stays crisp
        const worldPerPx = VIEW_HEIGHT / height;
        const pxW = Math.round(SCREEN_W / worldPerPx);
        const pxH = Math.round(SCREEN_H / worldPerPx);
        screenEl.style.width = `${pxW}px`;
        screenEl.style.height = `${pxH}px`;
        screenObject?.scale.setScalar(SCREEN_W / pxW);
        resume();
      };
      resize();
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      visibilityObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) resume(); else stop();
      });
      visibilityObserver.observe(mount);
      document.addEventListener("visibilitychange", onVisibility);
      stage.addEventListener("pointermove", onPointerMove, { passive: true });
      stage.addEventListener("pointerleave", onPointerLeave);
      stage.addEventListener("pointerdown", onPointerDown, { passive: true });
      stage.addEventListener("pointerup", onPointerUp);

      onScreenRef.current(screenEl);
      if (reduceMotion) {
        autoBooted = true;
        setPower(true, false);
      } else {
        bootTimer = window.setTimeout(() => {
          if (disposed || autoBooted) return;
          autoBooted = true;
          setPower(true, false);
        }, 1150);
      }
      resume();
    } catch {
      // No WebGL: hand the page a plain element so the link list still renders.
      screenEl.classList.add("is-on", "is-static");
      mount.appendChild(screenEl);
      onScreenRef.current(screenEl);
    }

    return () => {
      disposed = true;
      stop();
      clearTimeout(bootTimer);
      clearTimeout(readyTimer);
      onScreenRef.current(null);
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerleave", onPointerLeave);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointerup", onPointerUp);
      stage.style.cursor = "";
      disposables.forEach((item) => item.dispose());
      renderer?.dispose();
      renderer?.domElement.remove();
      cssRenderer?.domElement.remove();
      screenEl.remove();
    };
  }, []);

  return <div ref={mountRef} className={className} />;
}
