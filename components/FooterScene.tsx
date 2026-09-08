"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * The footer's backdrop: a field of extruded blocks rolling to a horizon.
 *
 * The pointer is the point of it — moving across the footer lifts and lights
 * the blocks under the cursor, so the surface reacts rather than just plays.
 * Instanced, so the whole field is one draw call; the per-frame work is
 * writing matrices, which is why the grid is sized down on small screens.
 */

const DEEP = new THREE.Color("#2b0f30");
const MID = new THREE.Color("#7a2358");
const HOT = new THREE.Color("#ff6fa8");
const SKY = new THREE.Color("#150819");

// World units between block centres.
const STEP = 0.62;
// How far the cursor's influence reaches, and how high it lifts.
const REACH = 3.4;
const LIFT = 2.1;

export default function FooterScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");

    // Fewer blocks where the GPU is likely weaker and there is no cursor to
    // reward the density anyway.
    const small = window.innerWidth < 900;
    const COLS = small ? 46 : 76;
    const ROWS = small ? 30 : 44;
    const COUNT = COLS * ROWS;

    const scene = new THREE.Scene();
    scene.background = SKY;
    scene.fog = new THREE.Fog(SKY, 9, 30);

    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 60);
    camera.position.set(0, 3.15, 9.4);
    camera.lookAt(0, 0.15, -2.4);

    scene.add(new THREE.HemisphereLight(0xd08cc0, 0x1a0a20, 1.15));
    const key = new THREE.DirectionalLight(0xffc4dd, 2.4);
    key.position.set(-6, 9, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xff5d8f, 1.5);
    rim.position.set(7, 3, -7);
    scene.add(rim);

    // Pivot at the base, so scaling y grows the block upward off the ground.
    const geometry = new THREE.BoxGeometry(STEP * 0.78, 1, STEP * 0.78);
    geometry.translate(0, 0.5, 0);
    const material = new THREE.MeshLambertMaterial({ vertexColors: true });
    const blocks = new THREE.InstancedMesh(geometry, material, COUNT);
    blocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    blocks.frustumCulled = false;
    scene.add(blocks);

    const stars = (() => {
      const positions = new Float32Array(220 * 3);
      for (let i = 0; i < 220; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 60;
        positions[i * 3 + 1] = 4 + Math.random() * 14;
        positions[i * 3 + 2] = -30 + Math.random() * 26;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const m = new THREE.PointsMaterial({ color: 0xffd9ec, size: 0.07, sizeAttenuation: true, transparent: true, opacity: 0.75, fog: false });
      const points = new THREE.Points(g, m);
      scene.add(points);
      return { g, m };
    })();

    // Grid coordinates, precomputed: only the height changes per frame.
    const gx = new Float32Array(COUNT);
    const gz = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const col = i % COLS;
      const row = (i / COLS) | 0;
      gx[i] = (col - (COLS - 1) / 2) * STEP;
      gz[i] = (row - (ROWS - 1) / 2) * STEP - 4;
    }

    const matrix = new THREE.Matrix4();
    const colour = new THREE.Color();
    // Where the cursor is, and where it is heading — the gap between them is
    // what makes the bump trail the pointer instead of snapping to it.
    const pointer = new THREE.Vector2(0, -999);
    const pointerTarget = new THREE.Vector2(0, -999);
    let strength = 0;
    let strengthTarget = 0;

    const ndc = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();

    const onPointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      ndc.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      // The cursor lands where its ray meets the ground the blocks stand on.
      if (raycaster.ray.intersectPlane(ground, hit)) {
        pointerTarget.set(hit.x, hit.z);
        strengthTarget = 1;
        if (pointer.y < -900) pointer.copy(pointerTarget);
      }
    };
    const onPointerLeave = () => {
      strengthTarget = 0;
    };

    let renderer: THREE.WebGLRenderer | undefined;
    let visible = false;
    let failed = false;
    let frame = 0;
    let lastTime = 0;
    let time = 0;

    const write = () => {
      pointer.lerp(pointerTarget, 0.12);
      strength += (strengthTarget - strength) * 0.08;

      for (let i = 0; i < COUNT; i++) {
        const x = gx[i];
        const z = gz[i];
        // Two crossed swells at different rates, so the field never repeats
        // in a way the eye can lock onto.
        // Base tall enough that most blocks stand: with the swells at ±0.67 a
        // lower base flattens half the field onto the floor.
        let h =
          0.82 +
          0.3 * Math.sin(x * 0.34 + time * 0.42) +
          0.24 * Math.sin(z * 0.29 - time * 0.31) +
          0.13 * Math.sin((x + z) * 0.21 + time * 0.24);

        if (strength > 0.002) {
          const dx = x - pointer.x;
          const dz = z - pointer.y;
          const fall = Math.exp(-(dx * dx + dz * dz) / (REACH * REACH));
          h += fall * LIFT * strength;
        }

        h = Math.max(h, 0.06);
        matrix.makeScale(1, h, 1);
        matrix.setPosition(x, 0, z);
        blocks.setMatrixAt(i, matrix);

        // Colour follows height, so a lifted block lights up as it rises.
        const t = Math.min(h / 2.1, 1);
        colour.copy(DEEP).lerp(MID, Math.min(t * 1.7, 1));
        if (t > 0.5) colour.lerp(HOT, (t - 0.5) * 1.7);
        blocks.setColorAt(i, colour);
      }
      blocks.instanceMatrix.needsUpdate = true;
      if (blocks.instanceColor) blocks.instanceColor.needsUpdate = true;
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    };

    const render = () => renderer?.render(scene, camera);

    const draw = (now: number) => {
      frame = 0;
      if (!visible || document.hidden || failed) return;
      if (!lastTime || now - lastTime >= 1000 / 30) {
        const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 0;
        // Reduced motion keeps the pointer response but stops the drift, so
        // nothing moves unless the visitor moves it.
        if (!reducedMotion.matches) time += delta;
        lastTime = now;
        write();
        render();
      }
      frame = requestAnimationFrame(draw);
    };

    const sync = () => {
      stop();
      if (!renderer || !visible || document.hidden || failed) return;
      write();
      render();
      frame = requestAnimationFrame(draw);
    };

    const resize = () => {
      if (!renderer) return;
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(1_800_000 / (width * height)));
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (visible && !failed && !document.hidden) render();
    };

    const contextLost = (event: Event) => {
      event.preventDefault();
      failed = true;
      stop();
      if (renderer) renderer.domElement.style.visibility = "hidden";
    };
    const contextRestored = () => {
      failed = false;
      resize();
      sync();
      if (renderer) renderer.domElement.style.visibility = "visible";
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !renderer && !failed) {
        try {
          renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "low-power" });
          renderer.outputColorSpace = THREE.SRGBColorSpace;
          renderer.domElement.addEventListener("webglcontextlost", contextLost);
          renderer.domElement.addEventListener("webglcontextrestored", contextRestored);
          resize();
          mount.appendChild(renderer.domElement);
        } catch {
          failed = true;
          renderer?.dispose();
          renderer?.domElement.remove();
          renderer = undefined;
        }
      }
      sync();
    });
    observer.observe(mount);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    document.addEventListener("visibilitychange", sync);
    // The scene sits under the footer's content, so it would never see a
    // pointer event of its own — the section listens on its behalf.
    const surface = mount.parentElement ?? mount;
    // Nothing hovers on a touch screen, so the listeners are pure overhead.
    if (!coarse.matches) {
      surface.addEventListener("pointermove", onPointerMove);
      surface.addEventListener("pointerleave", onPointerLeave);
    }

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      surface.removeEventListener("pointermove", onPointerMove);
      surface.removeEventListener("pointerleave", onPointerLeave);
      renderer?.domElement.removeEventListener("webglcontextlost", contextLost);
      renderer?.domElement.removeEventListener("webglcontextrestored", contextRestored);
      geometry.dispose();
      material.dispose();
      stars.g.dispose();
      stars.m.dispose();
      blocks.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer?.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="contact__scene" aria-hidden="true" />;
}
