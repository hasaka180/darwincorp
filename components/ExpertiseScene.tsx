"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { createDreamEnvironment } from "@/lib/dreamLighting";
import styles from "./ExpertiseCards.module.css";

// All cards share one renderer and reflection map. Only visible cards are drawn.
export default function ExpertiseScene({ gridRef }: { gridRef: RefObject<HTMLDivElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const grid = gridRef.current, canvas = canvasRef.current;
    if (!grid || !canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    } catch { return; }
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 30);
    camera.position.set(2.8, 1.8, 5.6);
    camera.zoom = 1.35;
    camera.lookAt(0, 0, 0);
    const source = createDreamEnvironment();
    // Broad, low-saturation studio reflections give flat faces a polished finish.
    const softboxes = [
      { position: [-3, 2, 7], size: [3, 7], color: 0xf1eaf5 },
      { position: [5, 1, 5], size: [2, 6], color: 0xc4c5dc },
      { position: [0, 6, 3], size: [7, 1], color: 0xf4e6ed },
    ].map(({ position, size, color }) => {
      const light = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
      light.position.set(position[0], position[1], position[2]); light.lookAt(0, 0, 0); source.scene.add(light);
      return light;
    });
    const generator = new THREE.PMREMGenerator(renderer);
    const environment = generator.fromScene(source.scene, 0.025);
    scene.environment = environment.texture;
    scene.environmentIntensity = 1.05;
    softboxes.forEach(light => { light.geometry.dispose(); light.material.dispose(); });
    source.dispose(); generator.dispose();
    scene.add(new THREE.HemisphereLight(0xf4dff4, 0x392139, 1.6));
    const key = new THREE.DirectionalLight(0xffedf9, 4);
    key.position.set(-3, 5, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0xf0a9d7, 3.35);
    rim.position.set(5, 1, -3); scene.add(rim);
    const silver = new THREE.MeshStandardMaterial({ color: 0xd2cbd8, metalness: .86, roughness: .18, envMapIntensity: 1.05 });
    const pearl = new THREE.MeshStandardMaterial({ color: 0x9c95a5, metalness: .85, roughness: .14, envMapIntensity: 1.2 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x31243d, metalness: .72, roughness: .28 });
    const glow = new THREE.MeshStandardMaterial({ color: 0xf4d9ed, metalness: .55, roughness: .22, emissive: 0xb46d9f, emissiveIntensity: .25 });
    const glass = new THREE.MeshPhysicalMaterial({ color: 0xc5c1ce, metalness: .55, roughness: .09, transparent: true, opacity: .25, depthWrite: false, side: THREE.DoubleSide, clearcoat: 1 });
    const edge = new THREE.LineBasicMaterial({ color: 0xe8dfea, transparent: true, opacity: .75 });
    const materials: THREE.Material[] = [silver, pearl, dark, glow, glass, edge];
    const textures: THREE.Texture[] = [];
    const geometries: THREE.BufferGeometry[] = [];
    const mesh = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) => {
      geometries.push(geometry);
      const object = new THREE.Mesh(geometry, material);
      object.position.set(x, y, z); parent.add(object); return object;
    };
    const box = (parent: THREE.Object3D, w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0) =>
      mesh(parent, new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * .25), material, x, y, z);
    const torus = (parent: THREE.Object3D, radius: number, tube: number, material: THREE.Material) =>
      mesh(parent, new THREE.TorusGeometry(radius, tube, 16, 80), material);
    const sphere = (parent: THREE.Object3D, radius: number, material: THREE.Material, x = 0, y = 0, z = 0) =>
      mesh(parent, new THREE.SphereGeometry(radius, 32, 20), material, x, y, z);
    const outlined = (object: THREE.Mesh) => {
      const geometry = new THREE.EdgesGeometry(object.geometry, 28);
      geometries.push(geometry);
      object.add(new THREE.LineSegments(geometry, edge));
      return object;
    };
    const panel = (parent: THREE.Object3D, x: number, y: number, z: number, front = false) => {
      const group = new THREE.Group(); parent.add(group); group.position.set(x, y, z);
      outlined(box(group, 1.62, 1.18, .065, front ? pearl : glass));
      box(group, 1.55, .018, .075, silver, 0, .58);
      box(group, 1.55, .018, .075, silver, 0, -.58);
      box(group, .018, 1.1, .075, silver, -.8);
      box(group, .018, 1.1, .075, silver, .8);
      return group;
    };
    const extrude = (parent: THREE.Object3D, points: number[][], material = silver) => {
      const shape = new THREE.Shape();
      points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
      shape.closePath();
      return outlined(mesh(parent, new THREE.ExtrudeGeometry(shape, { depth: .13, bevelEnabled: true, bevelSegments: 3, bevelSize: .045, bevelThickness: .045 }), material));
    };
    const stages = Array.from(grid.querySelectorAll<HTMLElement>("[data-expertise-stage]"));
    const models = stages.map(stage => {
      const group = new THREE.Group(); scene.add(group); group.visible = false;
      const type = stage.dataset.expertiseStage;
      if (["layers", "refresh", "interface", "tiles"].includes(type || "")) {
        for (let i = 0; i < 4; i++) {
          const plate = panel(group, (i - 1.5) * .12, (1.5 - i) * .09, (i - 1.5) * .29, i === 3);
          if (i !== 3) continue;
          if (type === "layers") {
            box(plate, 1.48, .035, .02, silver, 0, .36, .055);
            for (let j = 0; j < 3; j++) sphere(plate, .03, silver, -.6 + j * .12, .47, .055);
          }
          if (type === "refresh") {
            for (let j = 0; j < 2; j++) {
              const arrow = new THREE.Group(); plate.add(arrow); arrow.rotation.z = j * Math.PI; arrow.position.z = .08;
              mesh(arrow, new THREE.TorusGeometry(.32, .035, 12, 48, Math.PI * .76), silver);
              extrude(arrow, [[-.35,.2],[-.42,.38],[-.21,.34]]).scale.setScalar(.8);
            }
          }
          if (type === "interface") {
            const labelCanvas = document.createElement("canvas"); labelCanvas.width = 512; labelCanvas.height = 256;
            const context = labelCanvas.getContext("2d");
            if (context) {
              context.font = "italic 106px Arial"; context.textAlign = "center"; context.textBaseline = "middle"; context.fillStyle = "#f3edf5"; context.fillText("UI/UX", 256, 132);
              const texture = new THREE.CanvasTexture(labelCanvas); texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture);
              const label = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }); materials.push(label);
              mesh(plate, new THREE.PlaneGeometry(1.3, .65), label, 0, 0, .06);
            }
          }
          if (type === "tiles") {
            const head = mesh(plate, new THREE.CylinderGeometry(.13, .13, .05, 32), silver, 0, .19, .08); head.rotation.x = Math.PI / 2;
            const shape = new THREE.Shape(); shape.moveTo(-.3,-.28); shape.bezierCurveTo(-.3,.16,.3,.16,.3,-.28); shape.closePath();
            mesh(plate, new THREE.ExtrudeGeometry(shape, { depth: .06, bevelEnabled: true, bevelSize: .018, bevelThickness: .015, bevelSegments: 3 }), silver, 0, -.08, .07);
          }
        }
        group.rotation.y = -.2;
      } else if (type === "cursor") {
        extrude(group, [[-.65,.95],[-.55,-.8],[-.12,-.36],[.19,-.85],[.48,-.7],[.16,-.21],[.76,-.12]], glass);
        group.rotation.z = .15;
      } else if (type === "spark") {
        const shape = new THREE.Shape(); shape.moveTo(0, .98);
        shape.bezierCurveTo(.18,.24,.24,.18,.98,0); shape.bezierCurveTo(.24,-.18,.18,-.24,0,-.98);
        shape.bezierCurveTo(-.18,-.24,-.24,-.18,-.98,0); shape.bezierCurveTo(-.24,.18,-.18,.24,0,.98);
        outlined(mesh(group, new THREE.ExtrudeGeometry(shape, { depth: .17, bevelEnabled: true, bevelSegments: 5, bevelSize: .075, bevelThickness: .07, curveSegments: 24 }), glass));
        group.rotation.z = -.12;
      } else if (type === "identity") {
        const left = mesh(group, new THREE.CylinderGeometry(.61,.61,.16,64,1,false,0,Math.PI), silver, .13, .06, 0);
        left.rotation.set(Math.PI / 2, 0, 0);
        const right = mesh(group, new THREE.CylinderGeometry(.61,.61,.16,64,1,false,Math.PI,Math.PI), silver, -.13, -.06, .08);
        right.rotation.set(Math.PI / 2, 0, 0);
        group.rotation.z = -.3;
        group.scale.setScalar(1.18);
      } else if (type === "motion") {
        for (let i=0;i<4;i++) {
          const disc = outlined(mesh(group,new THREE.CylinderGeometry(.68,.68,.065,64), i===3?pearl:glass,0,0,(i-1.5)*.27));
          disc.rotation.x=Math.PI/2;
        }
        const play=extrude(group,[[-.16,.28],[-.16,-.28],[.31,0]]); play.position.z=.47;
      } else if (type === "cluster") {
        for(let x=0;x<2;x++) for(let y=0;y<2;y++) for(let z=0;z<2;z++) {
          outlined(box(group,.61,.61,.61,glass,(x-.5)*.69,(y-.5)*.69,(z-.5)*.69));
        }
        group.rotation.y = -.25;
      }
      return { group, base: group.rotation.clone(), tilt: new THREE.Vector2() };
    });

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, visible = false, failed = false, lastTime = 0, active = -1;
    let width = 1, height = 1;
    let boxes: { x: number; y: number; width: number; height: number }[] = [];
    const pointer = new THREE.Vector2();
    const neutral = new THREE.Vector2();
    const draw = (time: number) => {
      if (failed || !visible || document.hidden) return;
      renderer.setScissorTest(false); renderer.clear(); renderer.setScissorTest(true);
      const gridTop = grid.getBoundingClientRect().top;
      boxes.forEach((rect, index) => {
        const top = gridTop + rect.y;
        if (top + rect.height < 0 || top > window.innerHeight) return;
        const { group, base, tilt } = models[index];
        const phase = time * .00055 + index * .9;
        tilt.lerp(index === active ? pointer : neutral, .065);
        group.rotation.set(base.x + (motion.matches ? 0 : Math.sin(phase) * .08 + tilt.y * .16), base.y + (motion.matches ? 0 : Math.sin(phase * .8) * .23 + tilt.x * .3), base.z);
        group.position.y = motion.matches ? 0 : Math.sin(phase) * .06;
        group.visible = true;
        camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix();
        renderer.setViewport(rect.x, height - rect.y - rect.height, rect.width, rect.height);
        renderer.setScissor(rect.x, height - rect.y - rect.height, rect.width, rect.height);
        renderer.clearDepth(); renderer.render(scene, camera); group.visible = false;
      });
      grid.dataset.sceneReady = "true";
    };
    const tick = (now: number) => {
      frame = 0;
      if (!visible || document.hidden || failed) return;
      if (now - lastTime >= 1000 / 30) { draw(now); lastTime = now; }
      if (!motion.matches) frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame); frame = 0;
      if (visible && !document.hidden && !failed) { draw(performance.now()); if (!motion.matches) frame = requestAnimationFrame(tick); }
    };
    const resize = () => {
      const bounds = grid.getBoundingClientRect(); width = bounds.width; height = bounds.height;
      if (!width || !height) return;
      const maxTexture = renderer.capabilities.maxTextureSize;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(2_000_000 / (width * height)), maxTexture / height));
      renderer.setSize(width, height, false);
      boxes = stages.map(stage => { const rect = stage.getBoundingClientRect(); return { x: rect.left - bounds.left, y: rect.top - bounds.top, width: rect.width, height: rect.height }; });
      sync();
    };
    const move = (event: PointerEvent) => {
      const card = (event.target as Element).closest<HTMLElement>("[data-expertise-card]");
      if (!card || event.pointerType === "touch") return;
      active = Number(card.dataset.expertiseCard);
      const rect = card.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width - .5, (event.clientY - rect.top) / rect.height - .5);
    };
    const leave = () => { active = -1; };
    const scroll = () => { if (motion.matches && !frame && visible) frame = requestAnimationFrame(tick); };
    const lost = (event: Event) => { event.preventDefault(); failed = true; delete grid.dataset.sceneReady; cancelAnimationFrame(frame); };
    const restored = () => { failed = false; resize(); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    const resizeObserver = new ResizeObserver(resize);
    observer.observe(grid); resizeObserver.observe(grid);
    grid.addEventListener("pointermove", move); grid.addEventListener("pointerleave", leave);
    window.addEventListener("scroll", scroll, { passive: true });
    document.addEventListener("visibilitychange", sync); motion.addEventListener("change", sync);
    canvas.addEventListener("webglcontextlost", lost); canvas.addEventListener("webglcontextrestored", restored);
    resize();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); resizeObserver.disconnect();
      grid.removeEventListener("pointermove", move); grid.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", scroll); document.removeEventListener("visibilitychange", sync); motion.removeEventListener("change", sync);
      canvas.removeEventListener("webglcontextlost", lost); canvas.removeEventListener("webglcontextrestored", restored);
      // React Strict Mode reuses this canvas for the next effect setup. Disposing
      // resources is safe; forcing context loss would also kill that new renderer.
      geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); textures.forEach(texture => texture.dispose()); environment.dispose(); renderer.dispose();
      delete grid.dataset.sceneReady;
    };
  }, [gridRef]);
  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
