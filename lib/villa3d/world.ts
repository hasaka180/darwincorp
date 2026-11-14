import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { U, patch, waterNormals } from "./materials";
import { CYCLE, NO_FLY, SEASON_LENGTH, labelAt, lookAt, weatherAt } from "./timeline";
import { LOOKS, type Look } from "./looks";

/**
 * The live villa. The model comes from Blender (scripts/export-villa-web.py);
 * everything that moves is animated here in real time: the construction, sun
 * and moon, seasons and weather, the sea, wind in every plant, sailing boats,
 * gulls and falling coconuts. Visitors orbit and zoom the camera.
 */

export type VillaWorld = {
  jump(season: number): void;
  setAuto(on: boolean): void;
  replay(): void;
  zoom(factor: number): void;
  dispose(): void;
};
type Options = {
  progress: { current: number };
  reducedMotion: boolean;
  onLoad(fraction: number): void;
  onReady(): void;
  onFail(): void;
  onStatus(season: number, label: string, building: boolean): void;
  onProgress(fraction: number): void;
  onInteract(): void;
};

const BASE = "/assets/villa/3d/";
const SEA = -5.4;
const BUILD_SECONDS = 7;
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const TARGET = new THREE.Vector3(0.5, 2.6, 2);
const sanitize = (n: string) => n.replace(/\s/g, "_").replace(/[[\].:/]/g, "");
const smooth = (a: number, b: number, v: number) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const coast = (x: number, z: number) => (x + 24 + 0.35 * z) * 0.944; // metres inland from the waterline
function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

type Manifest = {
  palms: { trunk: string; crown: string }[]; boats: string[]; gull: string; lawn: string; beds: string[];
  templates: Record<string, string[]>; plan: [string, number, number, string, number][];
};

export async function createVillaWorld(mount: HTMLElement, opts: Options): Promise<VillaWorld> {
  const phone = Math.min(window.innerWidth, window.innerHeight) < 760 || window.matchMedia("(pointer: coarse)").matches;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance", failIfMajorPerformanceCaveat: true });
  } catch {
    opts.onFail();
    return { jump() {}, setAuto() {}, replay() {}, zoom() {}, dispose() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, phone ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  mount.appendChild(renderer.domElement);
  renderer.domElement.style.touchAction = "pan-y";

  const scene = new THREE.Scene();
  const fog = new THREE.FogExp2(0xcfdbe4, 0.00045);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 6000);

  // ---- Sky: physical sky with drifting clouds, a grey veil for overcast, stars and moon.
  const sky = new Sky();
  sky.scale.setScalar(4500);
  const skyU = (sky.material as THREE.ShaderMaterial).uniforms;
  skyU.turbidity.value = 3;
  skyU.rayleigh.value = 1.2;
  skyU.mieCoefficient.value = 0.004;
  skyU.mieDirectionalG.value = 0.85;
  skyU.cloudScale.value = 0.00025;
  skyU.cloudSpeed.value = 0.00008;
  scene.add(sky);
  const veil = new THREE.Mesh(new THREE.SphereGeometry(4000, 32, 16), new THREE.ShaderMaterial({
    uniforms: { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uAmt: { value: 0 }, uTime: U.uTime, uFlash: { value: 0 } },
    vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `uniform vec3 uTop, uHor; uniform float uAmt, uTime, uFlash; varying vec3 vD;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y); }
      void main(){
        float y = max(vD.y, 0.0);
        vec2 p = vD.xz / (y + 0.12) * 1.4 + vec2(uTime * 0.02, uTime * 0.008);
        float c = n(p) * 0.55 + n(p * 2.3) * 0.3 + n(p * 5.1) * 0.15;
        vec3 col = mix(uHor, uTop, pow(y, 0.6)) * (0.8 + 0.4 * c) + vec3(uFlash);
        gl_FragColor = vec4(col, uAmt);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide, transparent: true, depthWrite: false, fog: false,
  }));
  veil.renderOrder = 1;
  scene.add(veil);
  const starPos: number[] = [];
  const sr = rng(301);
  for (let i = 0; i < 1600; i++) {
    const y = 0.05 + sr() * 0.95, a = sr() * Math.PI * 2, r = Math.sqrt(1 - y * y);
    starPos.push(Math.cos(a) * r * 3800, y * 3800, Math.sin(a) * r * 3800);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.8, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  scene.add(stars);
  const moonDir = new THREE.Vector3(0.55, 0.36, 0.76).normalize();
  const moon = new THREE.Mesh(new THREE.SphereGeometry(40, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf3efe2, fog: false, transparent: true }));
  moon.position.copy(moonDir).multiplyScalar(3500);
  scene.add(moon);

  // Reflections come from the sky alone, refreshed a couple of times a second.
  const envScene = new THREE.Scene();
  const envSky = new Sky();
  envSky.scale.setScalar(400);
  envSky.material = sky.material;
  envScene.add(envSky);
  const envVeil = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 12), veil.material);
  envScene.add(envVeil);
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envRT: THREE.WebGLRenderTarget | null = null;
  const refreshEnv = () => {
    const next = pmrem.fromScene(envScene, 0, 1, 1000, { size: 128 });
    scene.environment = next.texture;
    envRT?.dispose();
    envRT = next;
  };

  // ---- Lights
  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(phone ? 2048 : 4096, phone ? 2048 : 4096);
  Object.assign(sun.shadow.camera, { left: -38, right: 38, top: 38, bottom: -38, near: 20, far: 320 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.04;
  sun.target.position.copy(TARGET);
  const moonLight = new THREE.DirectionalLight(0xa9bce8, 0);
  moonLight.position.copy(moonDir).multiplyScalar(100);
  const hemi = new THREE.HemisphereLight(0xbcd6ee, 0x6b6450, 0.6);
  const flashLight = new THREE.DirectionalLight(0xcfd8ff, 0);
  flashLight.position.set(-60, 120, -80);
  const interior = [[-4.5, 3.0, -1], [0, 3.0, -1.8], [4, 3.0, -3.6], [-3.5, 6.8, -2.5], [2.8, 6.8, -2.5], [-1, 3.1, 4.5]].map(([x, y, z]) => {
    const l = new THREE.PointLight(0xffb877, 0, 14, 2);
    l.position.set(x, y, z);
    scene.add(l);
    return l;
  });
  const poolLight = new THREE.PointLight(0x4fd0ee, 0, 12, 2);
  poolLight.position.set(0, -0.6, 9.3);
  const fireLight = new THREE.PointLight(0xff8a3d, 0, 10, 2);
  fireLight.position.set(7.2, 0.8, 4.9);
  scene.add(sun, sun.target, moonLight, hemi, flashLight, poolLight, fireLight);

  // ---- Post-processing: ambient occlusion and bloom on desktop.
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: phone ? 0 : 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  let gtao: GTAOPass | null = null;
  let bloom: UnrealBloomPass | null = null;
  if (!phone) {
    gtao = new GTAOPass(scene, camera, 1, 1);
    gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.6, thickness: 2, scale: 1, samples: 12 });
    gtao.blendIntensity = 0.85;
    composer.addPass(gtao);
    bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.22, 0.45, 3.0); // only lamps and the sun glow
    composer.addPass(bloom);
  }
  composer.addPass(new OutputPass());

  // ---- Loading
  const draco = new DRACOLoader();
  draco.setDecoderPath(BASE + "draco/");
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  const texLoader = new THREE.TextureLoader();
  let loaded = 0;
  const TOTAL = 6 + 27;
  const tick = () => opts.onLoad(Math.min(1, ++loaded / TOTAL));
  const glb = (name: string) => loader.loadAsync(BASE + name + ".glb").then((g) => { tick(); return g.scene; });
  const tex = (name: string, colour = true) => texLoader.loadAsync(BASE + "tex/" + name + ".webp").then((t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    if (colour) t.colorSpace = THREE.SRGBColorSpace;
    tick();
    return t;
  });
  const SURF = ["concrete_wall_008", "stone_wall_04", "marble_01", "large_grey_tiles", "wood_floor", "white_plaster_02", "coast_sand_01", "damp_beach_sand", "grass_ground"];

  let disposed = false;
  let manifest: Manifest;
  let villa: THREE.Group, land: THREE.Group, props: THREE.Group;
  const T: Record<string, { map: THREE.Texture; normal: THREE.Texture; rough: THREE.Texture }> = {};
  try {
    const [m, v, l, pr, ...texs] = await Promise.all([
      fetch(BASE + "manifest.json").then((r) => { tick(); return r.json(); }),
      glb("villa"), glb("landscape"), glb("props"),
      ...SURF.flatMap((s) => [tex(`${s}-diff`), tex(`${s}-nor`, false), tex(`${s}-rough`, false)]),
    ]);
    manifest = m as Manifest;
    villa = v; land = l; props = pr;
    SURF.forEach((s, i) => { T[s] = { map: texs[i * 3] as THREE.Texture, normal: texs[i * 3 + 1] as THREE.Texture, rough: texs[i * 3 + 2] as THREE.Texture }; });
  } catch (e) {
    console.warn("[villa] load failed", e);
    opts.onFail();
    renderer.dispose();
    return { jump() {}, setAuto() {}, replay() {}, zoom() {}, dispose() {} };
  }
  if (disposed) return { jump() {}, setAuto() {}, replay() {}, zoom() {}, dispose() {} };

  // ---- Materials, rebuilt from the Blender names
  const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(o);
  const tri = (key: string, size: number, tint: [number, number, number], normalScale = 1) =>
    ({ ...T[key], size, tint: new THREE.Color(...tint), normalScale });
  const emissive = (hex: number) => std({ color: 0x111111, emissive: hex, emissiveIntensity: 0 });
  const M: Record<string, THREE.Material> = {};
  const lamps: { mat: THREE.MeshStandardMaterial; k: number }[] = [];
  const foliage: { mat: THREE.MeshStandardMaterial; spring: THREE.Color; summer: THREE.Color; autumn: THREE.Color; winter: THREE.Color }[] = [];
  const surface = (key: string, size: number, tint: [number, number, number], rough = 1, wet = 0.8, ns = 1, snow = 1) =>
    patch(std({ color: 0xffffff, roughness: rough }), { tri: tri(key, size, tint, ns), snow, wet });
  const leafy = (spring: number[], summer: number[], autumn: number[], winter: number[], snow: number) => {
    const mat = patch(std({ color: new THREE.Color(...summer), roughness: 0.6, side: THREE.DoubleSide }), { snow, flutter: 0.012 });
    foliage.push({ mat, spring: new THREE.Color(...spring), summer: new THREE.Color(...summer), autumn: new THREE.Color(...autumn), winter: new THREE.Color(...winter) });
    return mat;
  };
  const pool = std({ color: new THREE.Color(0.25, 0.75, 0.82), roughness: 0.04, metalness: 0, transparent: true, opacity: 0.86, envMapIntensity: 1.4, emissive: 0x18a8c8, emissiveIntensity: 0 });
  const snowLayer = std({ color: 0xeef2f6, roughness: 0.6, transparent: true, opacity: 0 });
  const blueprint = new THREE.MeshBasicMaterial({ color: 0x9ad8ff, transparent: true, opacity: 0, depthWrite: false });
  const OURS: Record<string, () => THREE.Material> = {
    "Concrete / off-white architectural": () => surface("concrete_wall_008", 2.5, [1.08, 1.07, 1.05], 0.9, 0.8, 0.6),
    "Stone / dry-stack retaining wall": () => surface("stone_wall_04", 2.2, [0.95, 0.94, 0.92], 1, 0.6, 1.3),
    "Stone / dark grey cladding": () => surface("large_grey_tiles", 1.8, [0.32, 0.32, 0.34], 0.55, 0.5),
    "Stone / travertine terrace": () => surface("marble_01", 2.4, [1.12, 1.08, 1.02], 0.8, 1.0, 0.6),
    "Timber / oak slats and soffits": () => surface("wood_floor", 2.0, [0.95, 0.85, 0.75], 0.9, 0.6, 0.6),
    "Interior / warm plaster": () => surface("white_plaster_02", 2.5, [1, 0.95, 0.88], 1, 0, 0.4, 0),
    "Interior / oak floor": () => surface("wood_floor", 2.0, [1.05, 0.95, 0.85], 0.7, 0, 0.4, 0),
    "Glass / low-iron glazing": () => new THREE.MeshPhysicalMaterial({ color: 0xe6f0ee, metalness: 0, roughness: 0.02, transparent: true, opacity: 0.18, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide }),
    "Water / pool": () => pool,
    "Pool / glass mosaic": () => std({ color: new THREE.Color(0.1, 0.55, 0.62), roughness: 0.25 }),
    "Metal / dark bronze aluminium": () => patch(std({ color: new THREE.Color(0.05, 0.04, 0.032), metalness: 1, roughness: 0.35 }), { snow: 0.5, wet: 0.4 }),
    "Fabric / oatmeal boucle": () => patch(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.62, 0.58, 0.52), roughness: 0.95, sheen: 0.5 }), { snow: 1, wet: 0.3 }),
    "Fabric / white canvas": () => patch(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.82, 0.8, 0.76), roughness: 0.9, sheen: 0.4 }), { snow: 1 }),
    "Furniture / dark walnut": () => patch(std({ color: new THREE.Color(0.08, 0.05, 0.035), roughness: 0.5 }), { snow: 0.6, wet: 0.5 }),
    "Fabric / bed linen": () => new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.86, 0.85, 0.82), roughness: 0.9, sheen: 0.5 }),
    "Ceramic / planter": () => std({ color: new THREE.Color(0.8, 0.78, 0.74), roughness: 0.4 }),
    "Light / LED strip 2700K": () => { const m = emissive(0xffb86b); lamps.push({ mat: m, k: 6 }); return m; },
    "Light / pendant 2700K": () => { const m = emissive(0xffb366); lamps.push({ mat: m, k: 4 }); return m; },
    "Light / fire": () => { const m = emissive(0xff6b1a); lamps.push({ mat: m, k: 9 }); return m; },
    "Bark / palm trunk": () => patch(std({ color: new THREE.Color(0.28, 0.22, 0.16), roughness: 0.9 }), { snow: 0.5 }),
    "Leaves / palm fronds": () => leafy([0.17, 0.32, 0.07], [0.13, 0.26, 0.06], [0.15, 0.25, 0.06], [0.14, 0.22, 0.1], 0.35),
    "Leaves / garden shrubs": () => leafy([0.12, 0.26, 0.06], [0.08, 0.18, 0.05], [0.14, 0.17, 0.05], [0.1, 0.15, 0.08], 0.8),
    "Leaves / canopy shadow mass": () => std({ color: new THREE.Color(0.02, 0.035, 0.012), roughness: 0.9 }),
    "Soil / planting bed": () => patch(std({ color: new THREE.Color(0.06, 0.045, 0.03), roughness: 0.95 }), { snow: 0.9 }),
    "Ground / grass, sand, rock": () => patch(std({ color: 0xffffff, roughness: 0.95, vertexColors: true }),
      { ground: { grass: T.grass_ground.map, sand: T.coast_sand_01.map, damp: T.damp_beach_sand.map, size: 2.5 }, snow: 1 }),
    "Landscape / mountains": () => mountainMaterial(),
    "Snow / settled layer": () => snowLayer,
    "Fruit / coconut": () => std({ color: new THREE.Color(0.16, 0.1, 0.05), roughness: 0.7 }),
    "Boat / white gelcoat hull": () => std({ color: new THREE.Color(0.8, 0.8, 0.78), roughness: 0.25 }),
    "Boat / sailcloth": () => std({ color: new THREE.Color(0.85, 0.84, 0.8), roughness: 0.7, side: THREE.DoubleSide }),
    "Bird / gull plumage": () => std({ color: new THREE.Color(0.82, 0.82, 0.8), roughness: 0.8, side: THREE.DoubleSide }),
    "Bird / gull wingtip": () => std({ color: new THREE.Color(0.05, 0.05, 0.05), roughness: 0.8, side: THREE.DoubleSide }),
    "Water / wake foam": () => std({ color: 0xe8eef0, roughness: 0.6, transparent: true, opacity: 0.55, depthWrite: false }),
    "Fabric / sheer curtain": () => std({ color: new THREE.Color(0.93, 0.91, 0.87), roughness: 0.8, transparent: true, opacity: 0.7, side: THREE.DoubleSide, emissive: 0xffd9a8, emissiveIntensity: 0 }),
    "Light / blueprint": () => blueprint,
  };
  function mountainMaterial() {
    const mat = std({ color: 0xffffff, roughness: 0.95, flatShading: true });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uPeaks = peaks;
      shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vMW; varying vec3 vMN;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvMW = (modelMatrix * vec4(transformed,1.0)).xyz; vMN = normalize(mat3(modelMatrix) * objectNormal);");
      shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nuniform float uPeaks; varying vec3 vMW; varying vec3 vMN;")
        .replace("#include <color_fragment>", `#include <color_fragment>
          float slope = smoothstep(0.6, 0.9, vMN.y);
          vec3 rockC = mix(vec3(0.2, 0.17, 0.14), vec3(0.36, 0.31, 0.25), fract(sin(dot(floor(vMW.xz * 0.05), vec2(12.9, 78.2))) * 437.5));
          vec3 col = mix(rockC, vec3(0.12, 0.13, 0.06), slope);
          float line = smoothstep(55.0, 95.0, vMW.y) * uPeaks * vMN.y;
          diffuseColor.rgb = mix(col, vec3(0.85, 0.87, 0.9), smoothstep(0.25, 0.45, line));`);
    };
    return mat;
  }
  const peaks = { value: 0.3 };
  const polyMat = new Map<THREE.Material, THREE.Material>();
  const remap = (mat: THREE.Material) => {
    const name = mat.name || "";
    if (name.startsWith("web/")) {
      const key = name.slice(4);
      if (!M[key]) M[key] = OURS[key]?.() ?? std({ color: 0x9a9a9a, roughness: 0.8 });
      return M[key];
    }
    // Poly Haven asset materials keep their textures; foliage gets wind, season and snow.
    if (!polyMat.has(mat)) {
      const lower = name.toLowerCase();
      const leafy = /leaves|leaf|grass_medium|iceplant|succulent/.test(lower);
      const m = mat as THREE.MeshStandardMaterial;
      if (leafy) { m.side = THREE.DoubleSide; patch(m, { season: true, snow: 0.7, flutter: 0.008 }); }
      else if (!/lounge|coffee|ceiling|globe|pot|dirt/.test(lower)) patch(m, { snow: 0.8 });
      if (/globe/.test(lower)) { m.emissive = new THREE.Color(1, 0.75, 0.45); lamps.push({ mat: m, k: 3 }); }
      polyMat.set(mat, m);
    }
    return polyMat.get(mat)!;
  };
  const dress = (root: THREE.Object3D, shadows = true) => {
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(remap) : remap(mesh.material);
      const glassy = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).some((m) => m.transparent);
      mesh.castShadow = shadows && !glassy;
      mesh.receiveShadow = true;
    });
  };
  dress(villa);
  dress(land);
  dress(props);
  const lawn = land.getObjectByName(sanitize(manifest.lawn)) as THREE.Mesh | undefined;
  if (lawn) lawn.visible = false;
  scene.add(villa, land, props);

  // ---- The sea: summed waves in the vertex shader, fading out towards the beach; foam on crests and surf.
  const seaU = { uWaves: { value: 1 }, uCaps: { value: 0 }, uFoamTex: { value: waterNormals() } };
  const seaMat = std({ color: new THREE.Color(0.006, 0.035, 0.05), roughness: 0.07, metalness: 0, envMapIntensity: 1.25 });
  seaMat.normalMap = seaU.uFoamTex.value;
  seaMat.normalScale = new THREE.Vector2(0.35, 0.35);
  seaMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, U, seaU);
    const waves = `
      const int NW = 5;
      vec3 WAV[NW] = vec3[](vec3(0.85, 0.53, 0.06), vec3(0.3, 0.95, 0.09), vec3(-0.6, 0.8, 0.13), vec3(0.95, -0.3, 0.21), vec3(0.1, 1.0, 0.33));
      float AMP[NW] = float[](0.32, 0.22, 0.14, 0.08, 0.05);
      float seaFade(vec3 p) { return clamp(-((p.x + 24.0 + 0.35 * p.z) * 0.944 + 1.5) / 22.0, 0.12, 1.0); }
      vec3 seaWave(vec3 p, out vec3 n) {
        float h = 0.0, dx = 0.0, dz = 0.0, amp = uWaves * seaFade(p);
        for (int i = 0; i < NW; i++) {
          float ph = dot(WAV[i].xy, p.xz) * WAV[i].z + uTime * sqrt(9.8 * WAV[i].z);
          float a = AMP[i] * amp;
          h += a * sin(ph);
          dx += a * WAV[i].z * WAV[i].x * cos(ph);
          dz += a * WAV[i].z * WAV[i].y * cos(ph);
        }
        n = normalize(vec3(-dx, 1.0, -dz));
        return vec3(0.0, h, 0.0);
      }`;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\nuniform float uTime, uWaves;\nvarying vec3 vSea; varying float vH;\n${waves}`)
      .replace("#include <beginnormal_vertex>", `vec3 wpos0 = (modelMatrix * vec4(position, 1.0)).xyz; vec3 wn; vec3 wdisp = seaWave(wpos0, wn); vec3 objectNormal = wn;
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3( tangent.xyz );
        #endif`)
      .replace("#include <begin_vertex>", "vec3 transformed = position + wdisp; vH = wdisp.y / max(0.2, uWaves * 0.6); vSea = wpos0;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nuniform float uTime, uCaps; uniform sampler2D uFoamTex; varying vec3 vSea; varying float vH;`)
      .replace("#include <normal_fragment_maps>", `
        vec3 d1 = texture2D(uFoamTex, vSea.xz * 0.025 + uTime * vec2(0.012, 0.007)).xyz * 2.0 - 1.0;
        vec3 d2 = texture2D(uFoamTex, vSea.xz * 0.061 - uTime * vec2(0.009, 0.015)).xyz * 2.0 - 1.0;
        vec3 dn = normalize(vec3((d1.xy + d2.xy) * 0.35, 1.0));
        normal = normalize(normal + (viewMatrix * vec4(dn.x, 0.0, dn.y, 0.0)).xyz);`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        float s = (vSea.x + 24.0 + 0.35 * vSea.z) * 0.944;
        float surfBand = smoothstep(-9.0, -2.0, s) * (1.0 - smoothstep(-1.6, 0.0, s));
        float grain = texture2D(uFoamTex, vSea.xz * 0.09 + uTime * 0.02).x;
        float surf = smoothstep(0.35, 0.75, surfBand * (0.6 + grain));
        float caps = smoothstep(0.55, 0.95, vH) * uCaps * smoothstep(0.4, 0.7, grain);
        float foam = max(surf, caps);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.82, 0.85, 0.86), foam);`)
      .replace("#include <lights_physical_fragment>", "roughnessFactor = mix(roughnessFactor, 0.6, foam);\n#include <lights_physical_fragment>");
  };
  const seaNear = new THREE.Mesh(new THREE.PlaneGeometry(1300, 1300, 300, 300).rotateX(-Math.PI / 2), seaMat);
  seaNear.position.set(-260, SEA, -340);
  seaNear.receiveShadow = true;
  const seaFar = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000).rotateX(-Math.PI / 2), seaMat);
  seaFar.position.y = SEA - 0.8;
  scene.add(seaNear, seaFar);

  // ---- Planting: loaded after the house is on screen.
  type Sway = { obj: THREE.Object3D; base: THREE.Euler; q: THREE.Quaternion; ph: number; amp: number; kind: "palm" | "crown" | "tree" };
  const sways: Sway[] = [];
  const buildables: { obj: THREE.Object3D; start: number; dur: number; kind: string; base: THREE.Vector3; scale: THREE.Vector3 }[] = [];
  const nuts: THREE.Object3D[] = [];
  const planting = new THREE.Group();
  const grassLayer = new THREE.Group();
  scene.add(planting, grassLayer);
  const registerBuild = (roots: THREE.Object3D[]) => {
    for (const [prefix, start, dur, kind, stagger] of manifest.plan) {
      const key = sanitize(prefix);
      roots.filter((o) => o.name.startsWith(key)).forEach((obj, i) =>
        buildables.push({ obj, start: start + i * stagger, dur, kind, base: obj.position.clone(), scale: obj.scale.clone() }));
    }
  };
  registerBuild(villa.children);

  const loadPlanting = async () => {
    const [plant, templates] = await Promise.all([glb("planting"), glb("templates")]);
    if (disposed) return;
    dress(plant);
    planting.add(plant);
    registerBuild(plant.children);
    for (const { trunk, crown } of manifest.palms) {
      const t = plant.getObjectByName(sanitize(trunk)), c = plant.getObjectByName(sanitize(crown));
      if (t) sways.push({ obj: t, base: t.rotation.clone(), q: t.quaternion.clone(), ph: Math.random() * 6, amp: 1, kind: "palm" });
      if (c) sways.push({ obj: c, base: c.rotation.clone(), q: c.quaternion.clone(), ph: Math.random() * 6, amp: 1, kind: "crown" });
      c?.traverse((o) => { if (o.name.startsWith("Coconut")) nuts.push(o); });
    }
    plant.children.filter((o) => /^(Tree_canopy|Shrub|Agave)/.test(o.name)).forEach((o, i) =>
      sways.push({ obj: o, base: o.rotation.clone(), q: o.quaternion.clone(), ph: i * 2.3, amp: o.name.startsWith("Tree") ? 1 : 0.6, kind: "tree" }));

    // Grass clumps, iceplant and bushes scattered over the lawn and the beds.
    dress(templates, false);
    const variants = (key: string) => (manifest.templates[key] ?? []).map((n) => templates.getObjectByName(sanitize(n))).filter(Boolean) as THREE.Object3D[];
    const beds = manifest.beds.map((b) => villa.getObjectByName(sanitize(b)) as THREE.Mesh).filter(Boolean);
    scatterOn([lawn].filter(Boolean) as THREE.Mesh[], variants("grass_medium_01"), phone ? 9000 : 26000, 1.0, 2.0, 11, true);
    scatterOn(beds, variants("grass_medium_01"), phone ? 2000 : 6000, 0.9, 1.6, 12, true);
    scatterOn(beds, variants("crystalline_iceplant"), phone ? 250 : 700, 1.2, 2.2, 13, false);
    scatterOn(beds, variants("wild_rooibos_bush"), phone ? 30 : 80, 0.8, 1.3, 14, false);
    applyBuild(built ? 99 : buildT);
  };
  const dummy = new THREE.Object3D();
  function scatterOn(surfs: THREE.Mesh[], kinds: THREE.Object3D[], count: number, smin: number, smax: number, seed: number, grassy: boolean) {
    if (!surfs.length || !kinds.length) return;
    const r = rng(seed);
    const samplers = surfs.map((m) => { m.updateWorldMatrix(true, false); return { m, s: new MeshSurfaceSampler(m).build() }; });
    const perKind = kinds.map(() => [] as THREE.Matrix4[]);
    const p = new THREE.Vector3(), n = new THREE.Vector3();
    let guard = 0;
    while (perKind.reduce((a, b) => a + b.length, 0) < count && guard++ < count * 4) {
      const { m, s } = samplers[Math.floor(r() * samplers.length)];
      s.sample(p, n);
      p.applyMatrix4(m.matrixWorld);
      n.transformDirection(m.matrixWorld);
      if (n.y < 0.5) continue;
      // Thin out with distance from the villa (nobody sees single clumps 60 m away).
      const far = p.distanceTo(TARGET);
      if (grassy && far > 35 && r() < (far - 35) / 45) continue;
      dummy.position.copy(p);
      dummy.rotation.set((r() - 0.5) * 0.2, r() * Math.PI * 2, (r() - 0.5) * 0.2);
      dummy.scale.setScalar(smin + r() * (smax - smin));
      dummy.updateMatrix();
      perKind[Math.floor(r() * kinds.length)].push(dummy.matrix.clone());
    }
    // A variant may be one mesh or a group of meshes (one per material); instance each part.
    kinds.forEach((kind, i) => {
      const mats = perKind[i];
      if (!mats.length) return;
      kind.traverse((o) => {
        const part = o as THREE.Mesh;
        if (!part.isMesh) return;
        const mat = Array.isArray(part.material) ? part.material[0] : part.material;
        const inst = new THREE.InstancedMesh(part.geometry, patchInstanced(mat as THREE.MeshStandardMaterial, grassy), mats.length);
        mats.forEach((m, j) => inst.setMatrixAt(j, m));
        inst.receiveShadow = true;
        inst.castShadow = !grassy;
        grassLayer.add(inst);
      });
    });
  }
  const instancedMats = new Map<THREE.Material, THREE.Material>();
  function patchInstanced(mat: THREE.MeshStandardMaterial, grassy: boolean) {
    if (!instancedMats.has(mat)) {
      const m = mat.clone();
      m.side = THREE.DoubleSide;
      patch(m, { season: true, snow: 0.7, wind: grassy ? 0.9 : 0.25, flutter: grassy ? 0 : 0.01 });
      instancedMats.set(mat, m);
    }
    return instancedMats.get(mat)!;
  }

  // ---- Boats and gulls
  type Boat = { obj: THREE.Object3D; x: number; z: number; h: number; v: number; th: number; tv: number; next: number; r: () => number; motor: boolean; ph: number; wake?: THREE.Object3D };
  const boats: Boat[] = manifest.boats.map((name, i) => {
    const obj = props.getObjectByName(sanitize(name))!;
    const motor = name.startsWith("Motor");
    return { obj, x: obj.position.x, z: obj.position.z, h: obj.rotation.y, v: motor ? 5 : 1.6, th: obj.rotation.y, tv: motor ? 6 : 2, next: 2 + i, r: rng(40 + i), motor, ph: i * 1.9, wake: obj.getObjectByName(sanitize(name + " / wake")) ?? undefined };
  }).filter((b) => b.obj);
  // Well offshore, in the bay, and inside the camera's wide view (Blender's in_bay, in three's axes).
  const inBay = (x: number, z: number) => (x + 24 + 0.35 * z) * 0.944 < -45 && z < -170 && z > -900 && Math.abs(Math.atan2(x + 27, -z + 64) - 0.206) < 0.62;
  const gullTemplate = props.getObjectByName(sanitize(manifest.gull));
  const gulls: { obj: THREE.Object3D; wings: THREE.Object3D[]; flight: null | { t0: number; dur: number; p0: THREE.Vector3; p1: THREE.Vector3; p2: THREE.Vector3; ph: number } }[] = [];
  if (gullTemplate) {
    gullTemplate.visible = false;
    for (let i = 0; i < 14; i++) {
      const g = gullTemplate.clone(true);
      g.visible = false;
      props.add(g);
      gulls.push({ obj: g, wings: g.children.filter((c) => c.name.includes("wing") && !c.name.includes("tip")), flight: null });
    }
  }
  const gr = rng(21);
  let nextFlight = 0.5;
  const flyOK = (t: number) => !NO_FLY.some(([a, b]) => t >= a && t < b);
  function launchFlights(clockT: number, cycleT: number) {
    if (clockT < nextFlight) return;
    nextFlight = clockT + 0.8 + gr() * 2.4;
    if (built && !flyOK(cycleT)) return;
    const depth = -48 + gr() * 56;           // Blender Y of the flight line → three z = -depth
    const dist = depth + 64;
    const cx = -27 + 0.209 * dist, half = 0.7 * dist + 8, dir = gr() < 0.5 ? -1 : 1, speed = 8.5 + gr() * 4;
    const dur = (2 * half) / speed;
    const alt = (10.5 - 0.13 * dist) + (0.15 + gr() * 0.7) * 0.29 * dist;
    const p0 = new THREE.Vector3(cx - dir * half, alt, -(depth + (gr() - 0.5) * 16));
    const p2 = new THREE.Vector3(cx + dir * half, alt + (gr() - 0.5) * 6, -(depth + (gr() - 0.5) * 16));
    const p1 = p0.clone().add(p2).multiplyScalar(0.5).add(new THREE.Vector3(0, -4 + gr() * 9, (gr() - 0.5) * 44));
    const flock = [1, 1, 1, 2, 2, 3, 4][Math.floor(gr() * 7)];
    for (let k = 0, placed = 0; k < gulls.length && placed < flock; k++) {
      if (gulls[k].flight) continue;
      const off = new THREE.Vector3((gr() - 0.5) * 6 * placed, (gr() - 0.5) * 2.4 * placed, (gr() - 0.5) * 4 * placed);
      gulls[k].flight = { t0: clockT + placed * 0.3, dur, p0: p0.clone().add(off), p1: p1.clone().add(off), p2: p2.clone().add(off), ph: gr() * 6 };
      placed++;
    }
  }

  // ---- Weather: rain, snow and leaves near the villa
  const AREA = { x0: -45, x1: 40, y0: -5.5, y1: 30, z0: -30, z1: 50 };
  const wr = rng(503);
  const RAIN = phone ? 1400 : 3000;
  const rainPos = new Float32Array(RAIN * 6), drops = new Float32Array(RAIN * 3);
  for (let i = 0; i < RAIN; i++) { drops[i * 3] = AREA.x0 + wr() * (AREA.x1 - AREA.x0); drops[i * 3 + 1] = AREA.y0 + wr() * (AREA.y1 - AREA.y0); drops[i * 3 + 2] = AREA.z0 + wr() * (AREA.z1 - AREA.z0); }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xc8d4e2, transparent: true, opacity: 0, depthWrite: false }));
  rain.frustumCulled = false;
  const SNOWN = phone ? 1400 : 3000;
  const snowPos = new Float32Array(SNOWN * 3);
  for (let i = 0; i < SNOWN; i++) { snowPos[i * 3] = AREA.x0 + wr() * (AREA.x1 - AREA.x0); snowPos[i * 3 + 1] = AREA.y0 + wr() * (AREA.y1 - AREA.y0); snowPos[i * 3 + 2] = AREA.z0 + wr() * (AREA.z1 - AREA.z0); }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPos, 3));
  const flake = (() => { const c = document.createElement("canvas"); c.width = c.height = 32; const g = c.getContext("2d")!; const gr2 = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr2.addColorStop(0, "rgba(255,255,255,1)"); gr2.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr2; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
  const snowPts = new THREE.Points(snowGeo, new THREE.PointsMaterial({ map: flake, size: 0.3, transparent: true, opacity: 0, depthWrite: false }));
  snowPts.frustumCulled = false;
  const LEAVES = 220;
  const leafMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.3, 0.2), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.8 }), LEAVES);
  const leafState = Array.from({ length: LEAVES }, () => ({ p: new THREE.Vector3(AREA.x0 + wr() * 80, wr() * 12, AREA.z0 + wr() * 80), r: new THREE.Euler(), sp: new THREE.Vector3(wr() * 3, wr() * 3, wr() * 3) }));
  const leafColors = [0xc8661f, 0x9c3b12, 0xd9a13a, 0x7a4a1c].map((c) => new THREE.Color(c));
  leafState.forEach((_, i) => leafMesh.setColorAt(i, leafColors[i % 4]));
  leafMesh.frustumCulled = false;
  scene.add(rain, snowPts, leafMesh);

  // ---- Camera: orbit around the villa, zoom with pinch / ctrl+wheel / buttons.
  const orbit = { theta: -0.412, phi: 1.455, r: 69, tTheta: -0.412, tPhi: 1.455, tR: 69, lastInput: -10 };
  const resize = () => {
    const w = mount.clientWidth || 1, h = mount.clientHeight || 1;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    gtao?.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.9 ? 44 : 32;
    // Shift the lens so the villa sits clear of the hero copy.
    if (camera.aspect < 0.9) camera.setViewOffset(w, h, 0, h * 0.26, w, h);
    else camera.setViewOffset(w, h, -w * 0.12, 0, w, h);
    camera.updateProjectionMatrix();
  };
  resize();
  const pointers = new Map<number, { x: number; y: number }>();
  let pinch = 0;
  const onDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (e.pointerType === "mouse") renderer.domElement.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) orbit.tR = Math.min(110, Math.max(26, orbit.tR * (pinch / d)));
      pinch = d;
      return;
    }
    orbit.tTheta = Math.min(1.1, Math.max(-1.6, orbit.tTheta - dx * 0.005));
    if (e.pointerType === "mouse") orbit.tPhi = Math.min(1.5, Math.max(1.0, orbit.tPhi - dy * 0.004));
    orbit.lastInput = time;
    opts.onInteract();
  };
  const onUp = (e: PointerEvent) => { pointers.delete(e.pointerId); pinch = 0; };
  const onWheel = (e: WheelEvent) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    orbit.tR = Math.min(110, Math.max(26, orbit.tR * Math.exp(e.deltaY * 0.01)));
    orbit.lastInput = time;
    opts.onInteract();
  };
  const el = renderer.domElement;
  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onUp);
  el.addEventListener("wheel", onWheel, { passive: false });

  // ---- State and the loop
  let buildT = opts.reducedMotion ? 99 : 0;
  let built = opts.reducedMotion;
  let cycleT = 0, hold = -1, auto = !opts.reducedMotion;
  let time = 0, last = 0, raf = 0, sinceEnv = 1, frame = 0;
  let visible = true;
  let status = "";
  let flash = 0, flashT = 0, nextFlash = 0;
  const L: Look = { ...LOOKS["spring-morning"] };
  const cur: Look = { ...LOOKS["spring-morning"], overTop: [...LOOKS["spring-morning"].overTop], overHorizon: [...LOOKS["spring-morning"].overHorizon] };
  const sunDir = new THREE.Vector3(), tmp = new THREE.Vector3(), col = new THREE.Color(), col2 = new THREE.Color();
  const dropped: { obj: THREE.Object3D; parent: THREE.Object3D; t0: number; start: THREE.Vector3; vx: number; floor: number }[] = [];

  function applyBuild(t: number) {
    for (const b of buildables) {
      const k = Math.min(1, Math.max(0, (t - b.start) / b.dur));
      b.obj.visible = k > 0;
      if (k <= 0) continue;
      const e = 1 - Math.pow(1 - k, 3);
      if (b.kind === "grow") b.obj.scale.set(b.scale.x, b.scale.y * Math.max(0.001, e), b.scale.z);
      else if (b.kind === "pop") { const bo = 1 + 2.6 * Math.pow(k - 1, 3) + 1.6 * Math.pow(k - 1, 2); b.obj.scale.copy(b.scale).multiplyScalar(Math.max(0.001, bo)); }
      else if (b.kind === "drop") b.obj.position.y = b.base.y + (1 - e) * 6;
    }
    grassLayer.scale.setScalar(Math.max(0.001, smooth(4.4, 5.5, t)));
    grassLayer.visible = t > 4.4;
    blueprint.opacity = 0.95 * smooth(0.1, 0.4, t) * (1 - smooth(4.4, 5.6, t));
  }
  applyBuild(buildT);

  function sampleLook(t: number) {
    lookAt(t, L);
    const k = first ? 1 : 1 - Math.exp(-dtNow * 2.2);
    for (const key of Object.keys(L) as (keyof Look)[]) {
      const a = L[key];
      if (Array.isArray(a)) for (let c = 0; c < 3; c++) (cur[key] as number[])[c] += (a[c] - (cur[key] as number[])[c]) * k;
      else (cur as unknown as Record<string, number>)[key] += ((a as number) - (cur[key] as number)) * k;
    }
    first = false;
  }
  let first = true, dtNow = 0.016;

  function applyLook(dt: number) {
    const c = cur;
    const gate = built ? 1 : smooth(5.4, 6.4, buildT);
    // Sun position: Blender's sky rotation (clockwise from +Y) converted to three's axes.
    const e = THREE.MathUtils.degToRad(c.sunElev), r = THREE.MathUtils.degToRad(c.sunRot);
    sunDir.set(Math.sin(r) * Math.cos(e), Math.sin(e), -Math.cos(r) * Math.cos(e));
    skyU.sunPosition.value.copy(sunDir).multiplyScalar(450000);
    skyU.turbidity.value = 2.5 + c.aerosol * 1.2;
    skyU.cloudCoverage.value = Math.min(0.9, c.clouds + c.overcast * 0.4);
    skyU.cloudDensity.value = 0.35 + c.overcast * 0.4;
    skyU.time.value = time;
    const day = smooth(-0.1, 0.3, Math.sin(e));
    const low = 1 - smooth(0.05, 0.45, Math.sin(e));
    col.setRGB(1, 0.92 - low * 0.35, 0.85 - low * 0.6);
    sun.color.copy(col);
    sun.intensity = (0.2 + 3.2 * day) * (1 - c.overcast * 0.82) * smooth(-0.04, 0.02, Math.sin(e)) + flash * 1.5;
    sun.position.copy(TARGET).addScaledVector(sunDir.y > 0.05 ? sunDir : tmp.set(sunDir.x, 0.05, sunDir.z).normalize(), 150);
    moonLight.intensity = c.moonPower * 0.9;
    hemi.intensity = 0.15 + 0.85 * day * (1 - c.overcast * 0.3) + c.moonPower * 0.2 + flash * 2;
    col.setRGB(0.55, 0.7, 0.9).lerp(col2.setRGB(c.overHorizon[0], c.overHorizon[1], c.overHorizon[2]), c.overcast);
    hemi.color.copy(col).multiplyScalar(0.4 + 0.6 * day);
    hemi.groundColor.setRGB(0.33, 0.3, 0.24).multiplyScalar(0.3 + 0.7 * day);
    // The physical sky is bright HDR: keep reflections and exposure in proportion to it.
    scene.environmentIntensity = 0.08 + 0.3 * day;
    renderer.toneMappingExposure = Math.pow(2, c.exposure) * (0.5 + (1 - day) * 0.9);
    const vm = veil.material as THREE.ShaderMaterial;
    vm.uniforms.uTop.value.setRGB(c.overTop[0], c.overTop[1], c.overTop[2]).multiplyScalar(0.35 + 0.9 * day);
    vm.uniforms.uHor.value.setRGB(c.overHorizon[0], c.overHorizon[1], c.overHorizon[2]).multiplyScalar(0.35 + 0.9 * day);
    vm.uniforms.uAmt.value = c.overcast * 0.97;
    vm.uniforms.uFlash.value = flash * 0.4;
    // Haze colour: the horizon, by time of day and weather.
    col.setRGB(0.72, 0.8, 0.88).lerp(col2.setRGB(0.95, 0.62, 0.42), low * day).multiplyScalar(0.12 + 0.88 * day);
    col.lerp(col2.setRGB(c.overHorizon[0], c.overHorizon[1], c.overHorizon[2]).multiplyScalar(0.35 + 0.9 * day), c.overcast);
    fog.color.copy(col);
    fog.density = c.fog * 1.1;
    (stars.material as THREE.PointsMaterial).opacity = c.stars * (1 - c.overcast * 0.9);
    (moon.material as THREE.MeshBasicMaterial).opacity = c.stars * (1 - c.overcast);

    // Seasons, snow, wetness, wind, lights.
    U.uSpring.value = c.spring; U.uAutumn.value = c.autumn; U.uWinter.value = c.winter;
    U.uSnow.value = c.snow; U.uWet.value = c.wet; U.uWind.value = c.wind;
    peaks.value = c.peaks;
    snowLayer.opacity = c.snowcap;
    const lights = c.lights * gate;
    const flicker = 0.85 + Math.sin(time * 17) * 0.08 + Math.random() * 0.07;
    for (const { mat, k } of lamps) mat.emissiveIntensity = lights * k * (k > 8 ? flicker : 1);
    for (const l of interior) l.intensity = lights * 40;
    poolLight.intensity = lights * 25 * (1 - c.frozen);
    fireLight.intensity = lights * 20 * flicker;
    pool.color.setRGB(0.25, 0.75, 0.82).lerp(col.setRGB(0.78, 0.86, 0.9), c.frozen);
    pool.roughness = 0.04 + c.frozen * 0.3;
    pool.opacity = 0.86 + c.frozen * 0.14;
    pool.emissiveIntensity = lights * 0.8 * (1 - c.frozen);
    for (const f of foliage) {
      f.mat.color.copy(f.summer).lerp(f.spring, c.spring).lerp(f.autumn, c.autumn).lerp(f.winter, c.winter);
    }
    seaU.uWaves.value = c.waves;
    seaU.uCaps.value = c.whitecaps;
    seaMat.roughness = 0.07 + c.overcast * 0.12;

    // Lightning in the heaviest part of the storm.
    if (built && c.overcast > 0.95 && c.wind > 0.8 && time > nextFlash && !opts.reducedMotion) { flashT = 0.45; nextFlash = time + 2.5 + Math.random() * 4; }
    flashT = Math.max(0, flashT - dt);
    flash = flashT > 0 ? ((flashT > 0.3 || (flashT < 0.2 && flashT > 0.12)) ? 1 : 0.15) * (flashT / 0.45) : 0;
    flashLight.intensity = flash * 6;
  }

  function animateLife(dt: number) {
    const w = cur.wind;
    const gust = (t: number) => 0.6 + 0.4 * Math.sin(t * 0.9) * Math.sin(t * 0.37 + 1.3);
    for (const s of sways) {
      if (s.kind === "palm") {
        const lean = w * 0.1 * gust(time + s.ph) + Math.sin(time * 3.4 + s.ph) * (0.01 + 0.03 * w);
        s.obj.quaternion.setFromAxisAngle(Z_AXIS, -lean).multiply(s.q); // lean in world space, away from the sea
      }
      else if (s.kind === "crown") s.obj.rotation.set(s.base.x + Math.sin(time * 7.1 + s.ph) * (0.015 + 0.07 * w), s.base.y, s.base.z);
      else {
        const amp = (0.012 + 0.04 * w) * s.amp;
        s.obj.rotation.set(s.base.x + Math.sin(time * 2.6 + s.ph) * amp, s.base.y, s.base.z + Math.cos(time * 2.1 + s.ph * 1.3) * amp + 0.03 * w * gust(time + s.ph) * s.amp);
      }
    }
    // Boats sail random legs, tack, and steer back into the bay.
    for (const b of boats) {
      if (time >= b.next) {
        b.th = b.h + (b.r() < 0.5 ? -1 : 1) * (0.5 + b.r() * 1.4);
        const [lo, hi] = b.motor ? [3, 8.5] : [0.8, 3.2];
        b.tv = b.r() > 0.2 ? lo + b.r() * (hi - lo) : lo * 0.3;
        b.next = time + (b.motor ? 5 : 4) + b.r() * 8;
      }
      if (!inBay(b.x + Math.cos(b.h) * b.v * 12, b.z - Math.sin(b.h) * b.v * 12)) b.th = Math.atan2(b.z + 460, -70 - b.x); // back towards the middle of the bay
      const diff = ((b.th - b.h + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      const turn = Math.max(-(b.motor ? 0.45 : 0.3) * dt, Math.min((b.motor ? 0.45 : 0.3) * dt, diff));
      b.h += turn;
      b.v += (b.tv - b.v) * Math.min(1, dt * 0.4);
      b.x += Math.cos(b.h) * b.v * dt;
      b.z -= Math.sin(b.h) * b.v * dt;
      b.obj.position.set(b.x, SEA + Math.sin(time * 1.1 + b.ph) * 0.12 * cur.waves, b.z);
      b.obj.rotation.set(w * (b.motor ? 0.02 : 0.2) + turn / Math.max(dt, 1e-3) * 0.4 + Math.sin(time * 0.9 + b.ph) * 0.03 * cur.waves, b.h, Math.sin(time * 0.7 + b.ph) * 0.025 * cur.waves, "YXZ");
      if (b.wake) b.wake.scale.set(Math.max(0.001, b.v / 8.5), 1, Math.max(0.001, b.v / 8.5));
    }
    // Gulls on curved paths, flapping and gliding.
    for (const g of gulls) {
      const f = g.flight;
      if (!f) continue;
      const u = (time - f.t0) / f.dur;
      if (u < 0) { g.obj.visible = false; continue; }
      if (u > 1) { g.flight = null; g.obj.visible = false; continue; }
      g.obj.visible = true;
      const a = (1 - u) * (1 - u), b2 = 2 * (1 - u) * u, c2 = u * u;
      const x = f.p0.x * a + f.p1.x * b2 + f.p2.x * c2, y = f.p0.y * a + f.p1.y * b2 + f.p2.y * c2 + Math.sin(time * 1.4 + f.ph) * 0.6, z = f.p0.z * a + f.p1.z * b2 + f.p2.z * c2;
      const dx = x - g.obj.position.x, dz = z - g.obj.position.z;
      g.obj.position.set(x, y, z);
      if (Math.abs(dx) + Math.abs(dz) > 1e-4) g.obj.rotation.set(Math.sin(time * 1.3 + f.ph) * 0.18, Math.atan2(-dz, dx), 0, "YXZ");
      const gliding = Math.sin(time * 0.9 + f.ph) < -0.25;
      const flap = gliding ? 0.14 : 0.6 * Math.sin((time + f.ph) * Math.PI * 2 * 2.8);
      g.wings.forEach((wg, i) => { wg.rotation.x = flap * (i === 0 ? 1 : -1); });
    }
    // Coconuts shake loose in the storm (and occasionally on a summer afternoon).
    if (built && nuts.length && Math.random() < dt * (cur.wind > 0.8 ? 0.45 : 0.02)) {
      const nut = nuts[Math.floor(Math.random() * nuts.length)];
      if (nut.parent && !dropped.some((d) => d.obj === nut)) {
        const start = nut.getWorldPosition(new THREE.Vector3());
        const parent = nut.parent;
        scene.attach(nut);
        let floor = -4.66;
        for (const [x, z, y] of [[-14.6, -4, -3.0], [14.7, -1, -3.0], [14.7, -11.5, -3.0], [-12.8, 3, -1.4]]) if (Math.hypot(start.x - x, start.z + z) < 3) floor = y;
        dropped.push({ obj: nut, parent, t0: time, start, vx: 0.5 + cur.wind * 1.5, floor });
      }
    }
    for (const d of dropped) {
      const t = time - d.t0;
      const fall = d.start.y - 4.905 * t * t;
      if (fall > d.floor) d.obj.position.set(d.start.x + d.vx * t, fall, d.start.z);
      else d.obj.position.y = d.floor;
      d.obj.rotation.x += dt * 4;
    }
  }

  function weather(dt: number) {
    const wx = built ? weatherAt(cycleT) : { rain: 0, snow: 0, leaves: 0, storm: 0 };
    const rm = rain.material as THREE.LineBasicMaterial;
    rm.opacity += (0.45 * Math.min(1, wx.rain) - rm.opacity) * Math.min(1, dt * 2);
    rain.visible = rm.opacity > 0.01;
    if (rain.visible) {
      const n = Math.floor(RAIN * Math.min(1, wx.rain + 0.2)), slant = 2 + cur.wind * 9;
      for (let i = 0; i < n; i++) {
        let x = drops[i * 3], y = drops[i * 3 + 1];
        const z = drops[i * 3 + 2];
        y -= 34 * dt; x += slant * dt;
        if (y < AREA.y0 || x > AREA.x1) { y = AREA.y1 - Math.random() * 4; x = AREA.x0 + Math.random() * (AREA.x1 - AREA.x0); }
        drops[i * 3] = x; drops[i * 3 + 1] = y;
        rainPos.set([x, y, z, x - slant * 0.03, y + 0.9, z], i * 6);
      }
      rainGeo.attributes.position.needsUpdate = true;
      rainGeo.setDrawRange(0, n * 2);
    }
    const sm = snowPts.material as THREE.PointsMaterial;
    sm.opacity += (Math.min(1, wx.snow) - sm.opacity) * Math.min(1, dt * 1.5);
    snowPts.visible = sm.opacity > 0.01;
    if (snowPts.visible) {
      for (let i = 0; i < SNOWN; i++) {
        const j = i * 3;
        snowPos[j + 1] -= (1.2 + (i % 7) * 0.15) * dt;
        snowPos[j] += (Math.sin(time * 0.9 + i) * 0.6 + cur.wind * 1.5) * dt;
        if (snowPos[j + 1] < AREA.y0) { snowPos[j + 1] = AREA.y1; snowPos[j] = AREA.x0 + Math.random() * (AREA.x1 - AREA.x0); }
      }
      snowGeo.attributes.position.needsUpdate = true;
    }
    const n = Math.floor(LEAVES * Math.min(1, wx.leaves));
    leafMesh.visible = n > 0;
    leafMesh.count = n;
    for (let i = 0; i < n; i++) {
      const l = leafState[i];
      l.p.y -= (0.8 + cur.wind) * dt;
      l.p.x += (cur.wind * 3 + Math.sin(time * 1.7 + i) * 0.9) * dt;
      l.r.x += l.sp.x * dt; l.r.y += l.sp.y * dt; l.r.z += l.sp.z * dt;
      if (l.p.y < -4.8 || l.p.x > AREA.x1) { l.p.set(AREA.x0 + Math.random() * 60, 4 + Math.random() * 8, AREA.z0 + Math.random() * 80); }
      dummy.position.copy(l.p); dummy.rotation.copy(l.r); dummy.scale.setScalar(1); dummy.updateMatrix();
      leafMesh.setMatrixAt(i, dummy.matrix);
    }
    leafMesh.instanceMatrix.needsUpdate = true;
  }

  function updateCamera() {
    const idle = time - orbit.lastInput > 6;
    const drift = idle && !opts.reducedMotion ? Math.sin(time * 0.05) * 0.08 : 0;
    orbit.theta += (orbit.tTheta + drift - orbit.theta) * 0.08;
    orbit.phi += (orbit.tPhi - orbit.phi) * 0.08;
    orbit.r += (orbit.tR - orbit.r) * 0.08;
    const p = opts.progress.current || 0;
    const r = orbit.r * (1 - p * 0.3);
    camera.position.set(TARGET.x + r * Math.sin(orbit.phi) * Math.sin(orbit.theta), TARGET.y + r * Math.cos(orbit.phi), TARGET.z + r * Math.sin(orbit.phi) * Math.cos(orbit.theta));
    camera.lookAt(TARGET);
    sky.position.copy(camera.position);
    veil.position.copy(camera.position);
    stars.position.copy(camera.position);
    moon.position.copy(camera.position).addScaledVector(moonDir, 3500);
  }

  let readyAnnounced = false;
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    dtNow = dt;
    time += dt;
    frame++;
    U.uTime.value = time;
    if (!built) {
      buildT += dt;
      applyBuild(buildT);
      if (buildT >= BUILD_SECONDS) built = true;
    } else if (!opts.reducedMotion && (auto || hold >= 0)) {
      cycleT += dt;
      if (hold >= 0) { if (cycleT >= (hold + 1) * SEASON_LENGTH || cycleT < hold * SEASON_LENGTH) cycleT = hold * SEASON_LENGTH; }
      else cycleT %= CYCLE;
    }
    sampleLook(cycleT);
    applyLook(dt);
    if (!opts.reducedMotion) {
      animateLife(dt);
      launchFlights(time, cycleT);
      weather(dt);
    }
    updateCamera();
    sinceEnv += dt;
    if (sinceEnv > 0.5) { refreshEnv(); sinceEnv = 0; }
    composer.render(dt);
    const label = built ? labelAt(cycleT) : "Building the villa";
    if (label !== status) { status = label; opts.onStatus(Math.floor(cycleT / SEASON_LENGTH) % 4, label, !built); }
    opts.onProgress(built ? cycleT / CYCLE : buildT / BUILD_SECONDS);
    if (!readyAnnounced) { readyAnnounced = true; opts.onReady(); loadPlanting().catch((e) => console.warn("[villa] planting failed", e)); }
  };
  if (process.env.NODE_ENV !== "production") {
    (window as unknown as { __villa: unknown }).__villa = { scene, camera, renderer, U, buildables, composer, get built() { return built; }, get buildT() { return buildT; } };
  }
  const start = () => { if (!raf && visible && !document.hidden && !disposed) { last = 0; raf = requestAnimationFrame(loop); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  const onVisibility = () => (document.hidden ? stop() : start());
  const onLost = (e: Event) => { e.preventDefault(); stop(); opts.onFail(); };
  document.addEventListener("visibilitychange", onVisibility);
  renderer.domElement.addEventListener("webglcontextlost", onLost);
  const ro = new ResizeObserver(resize);
  ro.observe(mount);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); else stop(); });
  io.observe(mount);
  start();

  return {
    jump(season) {
      hold = season; auto = false; cycleT = season * SEASON_LENGTH;
      if (!built) { built = true; buildT = 99; applyBuild(99); }
    },
    setAuto(on) { auto = on; hold = on ? -1 : Math.floor(cycleT / SEASON_LENGTH) % 4; },
    replay() {
      if (opts.reducedMotion) return;
      buildT = 0; built = false; cycleT = 0; hold = -1; auto = true;
      for (const d of dropped) { d.parent.attach(d.obj); }
      dropped.length = 0;
      applyBuild(0);
    },
    zoom(f) { orbit.tR = Math.min(110, Math.max(26, orbit.tR / f)); orbit.lastInput = time; },
    dispose() {
      disposed = true;
      stop();
      io.disconnect(); ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      el.removeEventListener("pointerdown", onDown); el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp); el.removeEventListener("pointercancel", onUp); el.removeEventListener("wheel", onWheel);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mats = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : [];
        mats.forEach((mt) => mt.dispose());
      });
      Object.values(T).forEach((t) => { t.map.dispose(); t.normal.dispose(); t.rough.dispose(); });
      envRT?.dispose(); pmrem.dispose(); composer.dispose(); draco.dispose(); renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
