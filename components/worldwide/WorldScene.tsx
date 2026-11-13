"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { MARKETS, STUDIO } from "./markets";

/**
 * The Working worldwide hero: the world as an isometric terrain slab, in the
 * homepage dream scene's palette. Lowlands glow copper, ranges rise dark plum,
 * and the half of the planet currently in daylight burns brighter (live, from
 * the visitor's clock). Arcs run from the Dubai studio to each market, each
 * city carries a pin with its local time, and clouds drift over the top.
 *
 * Relief comes from public/assets/worldwide/world-relief.png
 * (scripts/build-world-relief.py): R height, G land, B coast distance.
 */

const MAP_W = 8;
const MAP_D = 3;
const AMP = 0.8; // world height of the tallest peak
const SLAB = 0.44; // thickness of the block under sea level
const LAT_TOP = 78.75;
const LAT_SPAN = 135;
const ELEV = 0.62; // camera elevation, radians

const onMap = (lat: number, lon: number, y = 0) =>
  new THREE.Vector3(((lon + 180) / 360 - 0.5) * MAP_W, y, ((LAT_TOP - lat) / LAT_SPAN - 0.5) * MAP_D);

const PLACES = [STUDIO, ...MARKETS];
// Pin heights differ so neighbours' labels (London/Amsterdam, Dubai/Riyadh) clear each other.
const PIN: Record<string, number> = { Dubai: 1.12, Riyadh: 0.5, London: 1.5, Amsterdam: 0.98, "New York": 1.0, Singapore: 0.9 };
// Dropped on phones, where their neighbours' labels would cover them.
const MINOR = new Set(["Amsterdam", "Riyadh"]);
const REGIONS = [
  { name: "Americas", lat: -14, lon: -122 },
  { name: "EMEA", lat: -34, lon: -4 },
  { name: "APAC", lat: -30, lon: 88 },
];

// The homepage dream scene's palette (HeroDreamScene / dreamLighting).
const HEX = {
  deep: "#150a22",
  sea: "#2a1637",
  plum: "#3a1a3d",
  maroon: "#7a1c2e",
  coral: "#ff5b3a",
  copper: "#ffa15e",
  lilac: "#c4a5cf",
  moon: "#f7f8fa",
};

type Props = { onReady: () => void; onFail: () => void; onFocus?: (city: string) => void };

export default function WorldScene({ onReady, onFail, onFocus }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const regionRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);

  useEffect(() => {
    const tick = () =>
      setTimes(PLACES.map((p) => new Intl.DateTimeFormat("en-GB", { timeZone: p.tz, hour: "2-digit", minute: "2-digit" }).format(new Date())));
    tick();
    const t = window.setInterval(tick, 15000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(o: T) => { disposables.push(o); return o; };
    const col = (hex: string) => ({ value: new THREE.Color(hex) });

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      onFail();
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dpr);
    renderer.toneMapping = THREE.NeutralToneMapping;
    const el = renderer.domElement;
    el.className = "ww-scene__canvas";
    mount.appendChild(el);

    const scene = new THREE.Scene();
    scene.background = track(makeBackdrop());
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    camera.position.set(0, Math.sin(ELEV) * 30, Math.cos(ELEV) * 30);
    camera.lookAt(0, 0, 0);
    const camUp = new THREE.Vector3(0, Math.cos(ELEV), -Math.sin(ELEV));

    const rig = new THREE.Group(); // placed on screen by layout()
    const map = new THREE.Group(); // turned by drag
    rig.add(map);
    scene.add(rig);

    // ---------- Terrain ----------
    const small = mount.clientWidth < 700;
    const terrainMat = track(new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: null as THREE.Texture | null },
        uTexel: { value: new THREE.Vector2(1 / 1024, 1 / 384) },
        uTime: { value: 0 },
        uSunU: { value: 0.5 },
        uDeep: col(HEX.deep), uSea: col(HEX.sea), uPlum: col(HEX.plum), uMaroon: col(HEX.maroon),
        uCoral: col(HEX.coral), uCopper: col(HEX.copper), uLilac: col(HEX.lilac),
      },
      vertexShader: `
        uniform sampler2D uMap; varying vec2 vUv;
        void main(){
          vUv = uv;
          vec3 p = position;
          p.y += texture2D(uMap, uv).r * ${AMP.toFixed(2)};
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `
        uniform sampler2D uMap; uniform vec2 uTexel; uniform float uTime, uSunU;
        uniform vec3 uDeep, uSea, uPlum, uMaroon, uCoral, uCopper, uLilac;
        varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main(){
          vec4 t = texture2D(uMap, vUv);
          float h = t.r;
          float land = smoothstep(0.38, 0.62, t.g);
          float coast = t.b;

          // Normal from the height field.
          float hx = texture2D(uMap, vUv + vec2(uTexel.x, 0.0)).r - texture2D(uMap, vUv - vec2(uTexel.x, 0.0)).r;
          float hv = texture2D(uMap, vUv + vec2(0.0, uTexel.y)).r - texture2D(uMap, vUv - vec2(0.0, uTexel.y)).r;
          vec3 n = normalize(vec3(
            -hx * ${AMP.toFixed(2)} / (2.0 * uTexel.x * ${MAP_W.toFixed(1)}),
            1.0,
            hv * ${AMP.toFixed(2)} / (2.0 * uTexel.y * ${MAP_D.toFixed(1)})));
          float diff = max(dot(n, normalize(vec3(-0.55, 0.6, -0.4))), 0.0);

          float grain = hash(floor(vUv / uTexel * 1.7));
          // Daylight, live: brightest under the sun's meridian.
          float day = smoothstep(-0.25, 0.4, cos((vUv.x - uSunU) * 6.2831853));
          float lit = mix(0.42, 1.0, day);

          // Land: glowing lowlands, dark ranges with lit flanks, bright summits.
          float low = 1.0 - smoothstep(0.10, 0.40, h);
          vec3 rock = mix(uMaroon, uPlum, smoothstep(0.28, 0.66, h)) * (0.4 + 1.05 * diff);
          rock += uLilac * pow(diff, 5.0) * 0.25 * smoothstep(0.3, 0.7, h);
          vec3 glow = mix(uCoral, uCopper, grain * 0.55 + low * 0.25) * (0.8 + 0.55 * diff);
          vec3 lc = mix(rock, glow, low * lit);
          lc += uCopper * smoothstep(0.78, 0.97, h) * 0.75 * lit;
          lc *= 0.84 + 0.32 * grain;

          // Sea: depth rings out from the coast, a faint graticule, a warm shoreline.
          vec3 oc = mix(uDeep, uSea, smoothstep(0.0, 0.5, coast));
          float ring = 1.0 - smoothstep(0.0, 0.05, abs(fract(coast * 9.0 - uTime * 0.015) - 0.5));
          oc += uLilac * ring * 0.10 * smoothstep(0.03, 0.3, coast);
          vec2 g = vUv * vec2(12.0, 6.0);
          vec2 q = abs(fract(g - 0.5) - 0.5) / fwidth(g);
          oc += uLilac * (1.0 - min(min(q.x, q.y), 1.0)) * 0.07;
          oc += uCoral * smoothstep(0.26, 0.5, t.g) * 0.32 * lit;
          oc *= 0.9 + 0.2 * grain;

          gl_FragColor = vec4(mix(oc, lc, land), 1.0);
        }`,
    }));
    const terrainGeo = track(new THREE.PlaneGeometry(MAP_W, MAP_D, small ? 320 : 560, small ? 120 : 210));
    terrainGeo.rotateX(-Math.PI / 2);
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.frustumCulled = false; // displaced in the shader
    map.add(terrain);

    // The block the terrain sits on.
    const slabMat = track(new THREE.ShaderMaterial({
      uniforms: { uDeep: col(HEX.deep), uMaroon: col(HEX.maroon), uCoral: col(HEX.coral) },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform vec3 uDeep, uMaroon, uCoral; varying vec3 vP;
        float hash(float p){ return fract(sin(p * 91.345) * 47453.5453); }
        void main(){
          float k = vP.y / ${SLAB.toFixed(2)} + 0.5;
          float strata = hash(floor((vP.x + vP.z) * 46.0));
          vec3 c = mix(uDeep * 0.55, uMaroon * 0.62, pow(k, 1.6)) * (0.72 + 0.5 * strata);
          c += uCoral * smoothstep(0.93, 1.0, k) * 0.55;
          gl_FragColor = vec4(c, 1.0);
        }`,
    }));
    const slab = new THREE.Mesh(track(new THREE.BoxGeometry(MAP_W, SLAB, MAP_D)), slabMat);
    slab.position.y = -SLAB / 2 - 0.003;
    map.add(slab);

    const glowTex = track(makeGlowTexture());
    const under = new THREE.Mesh(
      track(new THREE.PlaneGeometry(MAP_W * 1.7, MAP_D * 2.4)),
      track(new THREE.MeshBasicMaterial({ map: glowTex, color: "#9a2535", transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })),
    );
    under.rotation.x = -Math.PI / 2;
    under.position.y = -SLAB - 0.2;
    map.add(under);

    // ---------- Survey lines ----------
    const m = 0.24, hx = MAP_W / 2 + m, hz = MAP_D / 2 + m;
    const linePts: number[] = [];
    const seg = (a: number[], b: number[]) => linePts.push(...a, ...b);
    seg([-hx, 0, -hz], [hx, 0, -hz]); seg([hx, 0, -hz], [hx, 0, hz]); seg([hx, 0, hz], [-hx, 0, hz]); seg([-hx, 0, hz], [-hx, 0, -hz]);
    for (let lon = -180; lon <= 180; lon += 15) {
      const x = (lon / 360) * MAP_W;
      seg([x, 0, hz], [x, 0, hz + (lon % 45 === 0 ? 0.16 : 0.07)]);
    }
    const lineGeo = track(new THREE.BufferGeometry());
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePts, 3));
    map.add(new THREE.LineSegments(lineGeo, track(new THREE.LineBasicMaterial({ color: HEX.lilac, transparent: true, opacity: 0.28 }))));

    // ---------- Routes from the studio ----------
    const studio = onMap(STUDIO.lat, STUDIO.lon, 0.06);
    const arcMats: THREE.ShaderMaterial[] = [];
    MARKETS.forEach((mk, i) => {
      const end = onMap(mk.lat, mk.lon, 0.06);
      const mid = studio.clone().lerp(end, 0.5);
      mid.y = 0.55 + studio.distanceTo(end) * 0.24;
      const mat = track(new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uOff: { value: i / MARKETS.length }, uBoost: { value: 0 }, a: col(HEX.coral), b: col(HEX.moon) },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform float uTime, uOff, uBoost; uniform vec3 a, b; varying vec2 vUv;
          void main(){
            float head = fract(uTime * 0.3 + uOff) * 1.3 - 0.15;
            float d = head - vUv.x;
            float pulse = smoothstep(0.3, 0.0, d) * step(0.0, d);
            vec3 c = mix(a, b, vUv.x * 0.7);
            gl_FragColor = vec4(c * (0.9 + pulse * 2.2 + uBoost * 0.9), 0.4 + pulse + uBoost * 0.35);
          }`,
      }));
      arcMats.push(mat);
      map.add(new THREE.Mesh(track(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(studio, mid, end), 90, 0.013, 6, false)), mat));
    });

    // ---------- City pins ----------
    const pinTops: THREE.Vector3[] = [];
    const pinPts: number[] = [];
    const rings: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>[] = [];
    const ringGeo = track(new THREE.RingGeometry(0.86, 1, 48));
    ringGeo.rotateX(-Math.PI / 2);
    PLACES.forEach((p, i) => {
      const base = onMap(p.lat, p.lon, 0.05);
      const top = base.clone().setY((PIN[p.city] ?? 0.8) * (small ? 1.7 : 1));
      pinTops.push(top);
      pinPts.push(base.x, base.y, base.z, top.x, top.y, top.z);
      const beacon = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: glowTex, color: i === 0 ? HEX.coral : HEX.moon, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false })));
      beacon.position.copy(base);
      beacon.scale.setScalar(i === 0 ? 0.42 : 0.24);
      map.add(beacon);
      const ring = new THREE.Mesh(ringGeo, track(new THREE.MeshBasicMaterial({ color: i === 0 ? HEX.coral : HEX.moon, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending })));
      ring.position.copy(base);
      map.add(ring);
      rings.push(ring);
    });
    const pinGeo = track(new THREE.BufferGeometry());
    pinGeo.setAttribute("position", new THREE.Float32BufferAttribute(pinPts, 3));
    map.add(new THREE.LineSegments(pinGeo, track(new THREE.LineBasicMaterial({ color: HEX.moon, transparent: true, opacity: 0.7, depthTest: false }))));

    // ---------- Clouds ----------
    const cloudTex = track(makeCloudTexture());
    const cloudMat = track(new THREE.SpriteMaterial({ map: cloudTex, color: new THREE.Color(0.93, 0.91, 0.95), transparent: true, depthWrite: false }));
    const rand = mulberry(11);
    const clouds = [
      { x: -3.3, z: -0.9, y: 1.15, s: 0.95 }, { x: -1.9, z: 0.9, y: 0.95, s: 0.6 }, { x: -0.6, z: -1.15, y: 1.25, s: 0.8 },
      { x: 1.0, z: 1.0, y: 0.95, s: 0.7 }, { x: 2.5, z: -1.0, y: 1.2, s: 1.0 }, { x: 3.4, z: 0.6, y: 1.0, s: 0.6 },
    ].map((c) => {
      const g = new THREE.Group();
      g.position.set(c.x, c.y, c.z);
      for (let i = 0; i < 16; i++) {
        const puff = new THREE.Sprite(cloudMat);
        // Bigger puffs in the middle, small ones at the rim, all on a flat base.
        const u = rand() - 0.5, size = (0.16 + (0.5 - Math.abs(u)) * 0.42 + rand() * 0.08) * c.s;
        puff.position.set(u * 0.95 * c.s, size * 0.42 + rand() * 0.05, (rand() - 0.5) * 0.3 * c.s);
        puff.scale.setScalar(size);
        g.add(puff);
      }
      map.add(g);
      return { g, speed: 0.025 + rand() * 0.02 };
    });

    // ---------- Post ----------
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.45, 0.5, 0.8);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    disposables.push(composer, bloom);

    // ---------- Layout ----------
    let w = 1, h = 1, baseAz = -0.36;
    const layout = () => {
      w = mount.clientWidth || 1;
      h = mount.clientHeight || 1;
      const aspect = w / h;
      const portrait = aspect < 0.9;
      // Portrait turns the slab to stand tall; landscape lays it across the frame.
      const viewW = portrait ? 8.5 : aspect > 1.45 ? 12.2 : 10.6;
      const viewH = viewW / aspect;
      baseAz = portrait ? -0.68 : -0.36;
      camera.left = -viewW / 2; camera.right = viewW / 2; camera.top = viewH / 2; camera.bottom = -viewH / 2;
      camera.updateProjectionMatrix();
      const ox = portrait ? 0 : viewW * 0.022;
      const oy = portrait ? viewH * 0.19 : viewH * 0.07;
      rig.position.set(ox, 0, 0).addScaledVector(camUp, oy);
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(mount);

    // ---------- Relief texture ----------
    let ready = false, disposed = false;
    new THREE.TextureLoader().load(
      "/assets/worldwide/world-relief.png",
      (tex) => {
        if (disposed) { tex.dispose(); return; }
        tex.colorSpace = THREE.NoColorSpace;
        tex.minFilter = tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        terrainMat.uniforms.uMap.value = track(tex);
        ready = true;
        onReady();
      },
      undefined,
      () => { if (!disposed) onFail(); },
    );

    // ---------- Interaction ----------
    let userAz = 0, vel = 0, lastX = 0;
    let drag: { x: number; az: number } | null = null;
    const pointer = new THREE.Vector2(), eased = new THREE.Vector2();
    const onDown = (e: PointerEvent) => {
      drag = { x: e.clientX, az: userAz };
      lastX = e.clientX; vel = 0;
      el.setPointerCapture(e.pointerId);
      mount.classList.add("is-grabbing");
    };
    const onMove = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
      if (!drag) return;
      userAz = THREE.MathUtils.clamp(drag.az + (e.clientX - drag.x) * 0.0045, -0.75, 0.75);
      vel = (e.clientX - lastX) * 0.0045;
      lastX = e.clientX;
    };
    const onUp = () => { drag = null; mount.classList.remove("is-grabbing"); };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    window.addEventListener("pointermove", onMove, { passive: true });

    // Step through the markets, lighting each route in turn.
    let tour = 0;
    const tourTimer = window.setInterval(() => {
      if (drag) return;
      tour = (tour + 1) % PLACES.length;
      setFocus(tour);
      onFocus?.(PLACES[tour].city);
    }, 3600);

    // ---------- Loop ----------
    let raf = 0, visible = true, last = performance.now(), time = 0;
    const tmp = new THREE.Vector3();
    const place = (node: HTMLElement | null, v: THREE.Vector3) => {
      if (!node) return;
      tmp.copy(v);
      map.localToWorld(tmp).project(camera);
      node.style.transform = `translate3d(${((tmp.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((-tmp.y * 0.5 + 0.5) * h).toFixed(1)}px, 0)`;
      node.style.opacity = ready ? "1" : "0";
    };
    const regionPts = REGIONS.map((r) => onMap(r.lat, r.lon, 0.02));
    const frame = (now: number) => {
      raf = 0;
      if (disposed) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!reduce) time += dt;

      if (!drag && Math.abs(vel) > 0.0002) {
        userAz = THREE.MathUtils.clamp(userAz + vel, -0.75, 0.75);
        vel *= 0.92;
      }
      eased.lerp(pointer, 0.05);
      map.rotation.set(eased.y * 0.035, baseAz + userAz + eased.x * 0.05 + Math.sin(time * 0.22) * 0.03, 0);

      const d = new Date();
      terrainMat.uniforms.uSunU.value = (((12 - (d.getUTCHours() + d.getUTCMinutes() / 60)) * 15 + 180) / 360 + 1) % 1;
      terrainMat.uniforms.uTime.value = time;
      arcMats.forEach((mat, i) => {
        mat.uniforms.uTime.value = time;
        mat.uniforms.uBoost.value += ((tour === i + 1 ? 1 : 0) - mat.uniforms.uBoost.value) * 0.08;
      });
      rings.forEach((ring, i) => {
        const ph = (time * 0.45 + i * 0.19) % 1;
        ring.scale.setScalar(0.04 + ph * (i === 0 ? 0.34 : 0.2));
        ring.material.opacity = (1 - ph) * (tour === i || i === 0 ? 0.9 : 0.45);
      });
      clouds.forEach((c) => {
        c.g.position.x += c.speed * dt * (reduce ? 0 : 1);
        if (c.g.position.x > MAP_W / 2 + 0.4) c.g.position.x = -MAP_W / 2 - 0.4;
      });

      composer.render();
      map.updateMatrixWorld();
      pinTops.forEach((v, i) => place(labelRefs.current[i], v));
      regionPts.forEach((v, i) => place(regionRefs.current[i], v));

      if (visible) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    });
    io.observe(mount);
    const onLost = (e: Event) => { e.preventDefault(); onFail(); };
    el.addEventListener("webglcontextlost", onLost);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearInterval(tourTimer);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("webglcontextlost", onLost);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      el.remove();
    };
  }, [onReady, onFail, onFocus]);

  return (
    <div ref={mountRef} className="ww-scene">
      <div className="ww-scene__labels" aria-hidden="true">
        {REGIONS.map((r, i) => (
          <span key={r.name} ref={(n) => { regionRefs.current[i] = n; }} className="ww-region"><b>{r.name}</b></span>
        ))}
        {PLACES.map((p, i) => (
          <div key={p.city} ref={(n) => { labelRefs.current[i] = n; }} className={`ww-tag ${i === 0 ? "is-home" : ""} ${MINOR.has(p.city) ? "is-minor" : ""} ${focus === i ? "is-focus" : ""}`}>
            <span className="ww-tag__box">
              <span className="ww-tag__city">{p.city}</span>
              <span className="ww-tag__time">{times[i] ?? "--:--"}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Plum night with a crimson haze low on the right, like the homepage dusk. */
function makeBackdrop() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  const base = g.createLinearGradient(0, 0, 0, 512);
  base.addColorStop(0, "#160b25");
  base.addColorStop(0.55, "#1b1026");
  base.addColorStop(1, "#23102f");
  g.fillStyle = base;
  g.fillRect(0, 0, 512, 512);
  const haze = (x: number, y: number, r: number, color: string) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, color);
    rg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rg;
    g.fillRect(0, 0, 512, 512);
  };
  haze(400, 520, 360, "rgba(154, 37, 53, 0.38)");
  haze(90, 60, 300, "rgba(152, 103, 179, 0.16)");
  haze(60, 500, 260, "rgba(78, 37, 69, 0.5)");
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.18, "rgba(255,255,255,0.75)");
  grad.addColorStop(0.45, "rgba(255,255,255,0.18)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** One soft puff: white on top, lilac shade underneath. */
function makeCloudTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.68, "rgba(255,255,255,1)");
  grad.addColorStop(0.86, "rgba(255,255,255,0.35)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  g.globalCompositeOperation = "source-atop";
  const shade = g.createLinearGradient(0, 44, 0, 120);
  shade.addColorStop(0, "rgba(255,255,255,0)");
  shade.addColorStop(1, "rgba(132, 96, 148, 0.9)");
  g.fillStyle = shade;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
