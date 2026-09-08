"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { createDreamEnvironment } from "@/lib/dreamLighting";
import { createProcessCity } from "@/lib/processCity";

/** City, plinth and six transforming objects share one camera and lighting rig. */
export default function ProcessStageScene({ progressRef, anchorRef }: { progressRef: RefObject<number>; anchorRef: RefObject<HTMLDivElement | null> }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let renderer: THREE.WebGLRenderer | undefined;
    let environment: THREE.WebGLRenderTarget | undefined;
    let frame = 0;
    let visible = false;
    let failed = false;
    let lastProgress = -1;
    let lastTime = 0;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x654056, 0.014);
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 300);
    const cameraTarget = new THREE.Vector3(0, 0.2, 0);
    const horizonPoint = new THREE.Vector3();
    camera.position.set(7, 4.8, 12);
    camera.lookAt(cameraTarget);
    const city = createProcessCity();
    scene.add(city.group);
    const assembly = new THREE.Group();
    scene.add(assembly);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const material = (options: THREE.MeshStandardMaterialParameters) => {
      const value = new THREE.MeshStandardMaterial(options);
      materials.add(value);
      return value;
    };
    const pearl = material({ color: 0xc7b5cc, metalness: 0.72, roughness: 0.26 });
    const silver = material({ color: 0x8e7294, metalness: 0.8, roughness: 0.3 });
    const charcoal = material({ color: 0x29212f, metalness: 0.5, roughness: 0.26 });
    const accent = material({ color: 0xf0c3dd, emissive: 0x904a7c, emissiveIntensity: 0.25, metalness: 0.55, roughness: 0.22 });
    const mesh = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => {
      geometries.add(geometry);
      const object = new THREE.Mesh(geometry, mat);
      object.position.set(x, y, z);
      object.castShadow = true;
      object.receiveShadow = true;
      parent.add(object);
      return object;
    };
    const box = (parent: THREE.Object3D, w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) =>
      mesh(parent, new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.22), mat, x, y, z);
    const ring = (parent: THREE.Object3D, radius: number, tube: number, mat: THREE.Material, x = 0, y = 0, z = 0) => {
      const object = mesh(parent, new THREE.TorusGeometry(radius, tube, 12, 64), mat, x, y, z);
      object.rotation.x = -Math.PI / 2;
      return object;
    };
    const rod = (parent: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3, radius: number, mat: THREE.Material) => {
      const direction = to.clone().sub(from);
      const object = mesh(parent, new THREE.CylinderGeometry(radius, radius, direction.length(), 16), mat);
      object.position.copy(from).add(to).multiplyScalar(0.5);
      object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      return object;
    };
    const plates = [0, 1, 2].map(index => {
      const group = new THREE.Group();
      assembly.add(group);
      box(group, 2.65, index === 0 ? 0.16 : 0.085, 2.65, index === 0 ? charcoal : pearl);
      box(group, 2.58, 0.018, 2.58, silver, 0, -0.045, 0);
      for (const x of [-1.27, 1.27]) for (const z of [-1.27, 1.27]) {
        box(group, 0.065, 0.025, 0.065, charcoal, x, 0.057, z);
      }
      return group;
    });
    // A few inset components remain on the lower layers as the top symbol changes.
    for (let i = 0; i < 3; i++) {
      box(plates[1], 0.44, 0.09, 0.64, charcoal, (i - 1) * 0.6, 0.09, 0);
      box(plates[0], 0.52, 0.05, 0.12, accent, (i - 1) * 0.64, 0.12, 0.75);
    }
    const guides = new THREE.BufferGeometry();
    const guidePositions = new Float32Array(24);
    guides.setAttribute("position", new THREE.BufferAttribute(guidePositions, 3));
    geometries.add(guides);
    const guideMaterial = new THREE.LineDashedMaterial({ color: 0xe9efff, transparent: true, opacity: 0.16, dashSize: 0.035, gapSize: 0.05 });
    materials.add(guideMaterial);
    const guideLines = new THREE.LineSegments(guides, guideMaterial);
    assembly.add(guideLines);

    const symbols = Array.from({ length: 6 }, () => {
      const group = new THREE.Group();
      assembly.add(group);
      return group;
    });
    // Research: an actual lens, handle and scattered data points.
    ring(symbols[0], 0.45, 0.075, charcoal, -0.16, 0.12, -0.12);
    const glass = material({ color: 0xd4b2eb, transparent: true, opacity: 0.48, metalness: 0.3, roughness: 0.12, depthWrite: false });
    mesh(symbols[0], new THREE.CylinderGeometry(0.38, 0.38, 0.025, 48), glass, -0.16, 0.12, -0.12);
    rod(symbols[0], new THREE.Vector3(0.15, 0.12, 0.19), new THREE.Vector3(0.68, 0.12, 0.72), 0.085, charcoal);
    for (const [x, z] of [[-0.7, 0.55], [0.6, -0.6], [-0.7, -0.7]]) mesh(symbols[0], new THREE.SphereGeometry(0.06, 16, 12), accent, x, 0.1, z);
    // Strategy: concentric targets with a directional marker.
    [0.65, 0.43, 0.2].forEach(r => ring(symbols[1], r, 0.035, charcoal, 0, 0.1, 0));
    mesh(symbols[1], new THREE.CylinderGeometry(0.09, 0.09, 0.08, 24), accent, 0, 0.1, 0);
    rod(symbols[1], new THREE.Vector3(0, 0.2, 0), new THREE.Vector3(0.65, 0.8, -0.3), 0.028, charcoal);
    const arrowhead = mesh(symbols[1], new THREE.ConeGeometry(0.12, 0.26, 4), charcoal, 0.05, 0.25, -0.025);
    arrowhead.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-0.65, -0.6, 0.3).normalize());
    // Concept: a faceted idea above a machined socket.
    mesh(symbols[2], new THREE.CylinderGeometry(0.2, 0.25, 0.15, 32), charcoal, 0, 0.12, 0);
    mesh(symbols[2], new THREE.IcosahedronGeometry(0.43, 1), pearl, 0, 0.62, 0);
    ring(symbols[2], 0.65, 0.018, accent, 0, 0.6, 0);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2;
      rod(symbols[2], new THREE.Vector3(Math.cos(a) * 0.55, 0.85, Math.sin(a) * 0.55), new THREE.Vector3(Math.cos(a) * 0.72, 1.01, Math.sin(a) * 0.72), 0.02, charcoal);
    }
    // Design: an editable Bezier curve and a solid pen nib.
    const curve = new THREE.CubicBezierCurve3(new THREE.Vector3(-0.8, 0.11, 0.4), new THREE.Vector3(-0.4, 0.11, -0.9), new THREE.Vector3(0.35, 0.11, 0.8), new THREE.Vector3(0.8, 0.11, -0.4));
    mesh(symbols[3], new THREE.TubeGeometry(curve, 48, 0.025, 8, false), charcoal);
    for (const point of [curve.v0, curve.v3]) box(symbols[3], 0.13, 0.06, 0.13, accent, point.x, point.y, point.z);
    const nib = mesh(symbols[3], new THREE.ConeGeometry(0.24, 0.7, 4), charcoal, 0.2, 0.5, 0.05);
    nib.rotation.z = Math.PI - 0.4;
    mesh(symbols[3], new THREE.SphereGeometry(0.045, 16, 12), accent, 0.23, 0.48, 0.22);
    // Build: modular blocks form a small architectural assembly.
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3 - y; x++) {
      box(symbols[4], 0.39, 0.25, 0.42, y === 2 ? accent : charcoal, (x - (2 - y) / 2) * 0.46, 0.19 + y * 0.29, 0);
    }
    // Launch: an ascending arrow, with three exhaust / trajectory marks.
    const launch = new THREE.Group();
    symbols[5].add(launch);
    launch.rotation.z = -0.3;
    mesh(launch, new THREE.CylinderGeometry(0.1, 0.1, 0.58, 24), charcoal, 0, 0.5, 0);
    mesh(launch, new THREE.ConeGeometry(0.33, 0.43, 4), pearl, 0, 1, 0);
    for (let i = -1; i <= 1; i++) box(symbols[5], 0.035, 0.25 + (i === 0 ? 0.16 : 0), 0.035, accent, i * 0.19, 0.18, 0.15);

    scene.add(new THREE.HemisphereLight(0xb491b8, 0x2b1326, 0.65));
    const key = new THREE.DirectionalLight(0xe5c2df, 3.8);
    key.position.set(-5, 10, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = key.shadow.camera.bottom = -9;
    key.shadow.camera.right = key.shadow.camera.top = 9;
    key.shadow.normalBias = 0.025;
    key.shadow.bias = -0.0002;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xdc795f, 2.8);
    rim.position.set(-7, 4, -8);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xb69acf, 1.8);
    fill.position.set(6, 5, 3);
    scene.add(fill);

    const separations = [0.7, 0.48, 0.88, 0.64, 0.34, 0.94];
    const rotations = [-0.2, 0.08, 0.4, 0.1, -0.25, 0.18];
    const pose = () => {
      const raw = THREE.MathUtils.clamp(progressRef.current, 0, 5);
      const progress = motion.matches ? Math.round(raw) : raw;
      // A subtle dolly moves the city and the assembly together.
      camera.position.set(7 + Math.sin(progress * 0.45) * 0.35, 4.8, 12 - progress * 0.06);
      camera.lookAt(cameraTarget);
      camera.updateMatrixWorld();
      horizonPoint.set(-700, -1.32, -1200).project(camera);
      city.setHorizon(THREE.MathUtils.clamp(horizonPoint.y * 0.5 + 0.5, 0.15, 0.98));
      const a = Math.floor(progress), b = Math.min(5, a + 1);
      const t = THREE.MathUtils.smoothstep(progress - a, 0, 1);
      const gap = THREE.MathUtils.lerp(separations[a], separations[b], t);
      assembly.rotation.y = THREE.MathUtils.lerp(rotations[a], rotations[b], t);
      plates.forEach((plate, index) => { plate.position.y = -0.8 + index * gap; });
      symbols.forEach((symbol, index) => {
        const distance = Math.abs(progress - index);
        symbol.visible = distance < 0.7;
        symbol.scale.setScalar(Math.max(0.001, 1 - THREE.MathUtils.smoothstep(distance, 0.05, 0.7)));
        symbol.position.y = plates[2].position.y + 0.055;
        symbol.rotation.y = (progress - index) * 0.5;
      });
      let offset = 0;
      for (const x of [-1.27, 1.27]) for (const z of [-1.27, 1.27]) {
        guidePositions.set([x, plates[0].position.y, z, x, plates[2].position.y, z], offset);
        offset += 6;
      }
      guides.attributes.position.needsUpdate = true;
      guideLines.computeLineDistances();
      return progress;
    };
    const render = () => {
      if (!renderer || failed) return;
      lastProgress = pose();
      renderer.render(scene, camera);
    };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; lastTime = 0; };
    const draw = (now: number) => {
      frame = 0;
      if (!visible || document.hidden || failed) return;
      const next = motion.matches ? Math.round(progressRef.current) : progressRef.current;
      if (next !== lastProgress && now - lastTime >= 1000 / 30) { render(); lastTime = now; }
      frame = requestAnimationFrame(draw);
    };
    const sync = () => {
      stop();
      if (!visible || document.hidden || !renderer || failed) return;
      render();
      frame = requestAnimationFrame(draw);
    };
    const resize = () => {
      if (!renderer) return;
      const w = Math.max(1, mount.clientWidth), h = Math.max(1, mount.clientHeight);
      const viewport = mount.getBoundingClientRect();
      const anchor = anchorRef.current?.getBoundingClientRect();
      if (!anchor) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(2_000_000 / (w * h))));
      renderer.setSize(w, h, false);
      const span = Math.max(1, Math.min(anchor.width, anchor.height));
      const halfHeight = 4.3 * h / span;
      camera.aspect = w / h;
      camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(halfHeight / camera.position.distanceTo(cameraTarget)));
      // Off-axis framing places the physical assembly in the content's right-hand slot.
      const centerX = anchor.left - viewport.left + anchor.width / 2;
      const centerY = anchor.top - viewport.top + anchor.height / 2;
      camera.setViewOffset(w, h, w / 2 - centerX, h / 2 - centerY, w, h);
      camera.updateProjectionMatrix();
      if (visible && !document.hidden) render();
    };
    const lost = (event: Event) => { event.preventDefault(); failed = true; stop(); setReady(false); if (renderer) renderer.domElement.style.visibility = "hidden"; };
    const restored = () => { failed = false; resize(); sync(); setReady(true); if (renderer) renderer.domElement.style.visibility = "visible"; };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !renderer && !failed) {
        try {
          renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true, powerPreference: "low-power" });
          renderer.setClearColor(0x170d26);
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1.1;
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
          const generator = new THREE.PMREMGenerator(renderer);
          const reflection = createDreamEnvironment();
          environment = generator.fromScene(reflection.scene, 0.035);
          scene.environment = environment.texture;
          scene.environmentIntensity = 0.9;
          reflection.dispose();
          generator.dispose();
          renderer.domElement.addEventListener("webglcontextlost", lost);
          renderer.domElement.addEventListener("webglcontextrestored", restored);
          mount.appendChild(renderer.domElement);
          resize();
          setReady(true);
        } catch {
          failed = true;
          renderer?.dispose();
          renderer?.domElement.remove();
          setReady(false);
        }
      }
      sync();
    });
    observer.observe(mount);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    if (anchorRef.current) resizeObserver.observe(anchorRef.current);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    return () => {
      stop(); observer.disconnect(); resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("resize", resize);
      motion.removeEventListener("change", sync);
      renderer?.domElement.removeEventListener("webglcontextlost", lost);
      renderer?.domElement.removeEventListener("webglcontextrestored", restored);
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      key.shadow.dispose();
      city.dispose();
      environment?.dispose();
      renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove();
    };
  }, [progressRef, anchorRef]);

  return <div ref={mountRef} className={`proc__stage-scene${ready ? " is-ready" : ""}`} aria-hidden="true" />;
}
