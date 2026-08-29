"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * The 3D hero: a 360° starfield the camera sits inside, drifting slowly and
 * leaning toward the cursor.
 *
 * Isolated in its own module so it can be code-split out of the homepage —
 * three.js and the loader stay out of the first-load bundle and stream in
 * behind the heading.
 *
 * The skybox is a single emissive sphere, so it needs no lights: the texture
 * *is* the image. Its texture is 4096x1024 (4:1, not the usual 2:1
 * equirectangular), so it only covers a band around the horizon — the camera
 * has to stay near level or the poles stretch. Hence the tight PITCH limit.
 */

const MODEL = "/assets/deep_space_skybox.glb";

/** How far the cursor can swing the camera, in radians. */
const YAW = 0.16;
const PITCH = 0.05;
/** Constant drift, so the sky is alive with the pointer off-screen. */
const DRIFT = 0.0055; // radians per second
/** Higher = snappier cursor tracking. */
const EASE = 2.4;

export default function HeroScene({ onLoad }: { onLoad: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  // Held in a ref so the render loop never re-subscribes on pointer moves.
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 1000);
    // The camera sits at the centre of the sphere, looking out.
    camera.position.set(0, 0, 0);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let sky: THREE.Object3D | null = null;
    let disposed = false;

    new GLTFLoader().load(
      MODEL,
      (gltf) => {
        if (disposed) {
          return;
        }
        sky = gltf.scene;
        // Inside-out: flipping X makes the sphere's faces point at the camera
        // without depending on the material being double-sided.
        sky.scale.set(-1, 1, 1);
        scene.add(sky);
        onLoad();
      },
      undefined,
      (err) => {
        console.warn("[hero] skybox failed to load:", err);
        // Release the preloader anyway — it must never hang on a missing asset.
        onLoad();
      }
    );

    const move = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // -1..1 from the centre of the stage.
      pointer.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.current.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    };
    if (!reduce) window.addEventListener("pointermove", move, { passive: true });

    let raf = 0;
    let last = performance.now();
    let drift = 0;
    // Current eased rotation, chasing the pointer target.
    let yaw = 0;
    let pitch = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (!reduce) drift += DRIFT * dt;

      const k = 1 - Math.exp(-EASE * dt); // frame-rate independent easing
      yaw += (-pointer.current.x * YAW - yaw) * k;
      pitch += (-pointer.current.y * PITCH - pitch) * k;

      camera.rotation.set(pitch, drift + yaw, 0, "YXZ");
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      ro.disconnect();
      // Release the GPU memory; a leaked context breaks later scenes.
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material;
        if (Array.isArray(mat)) mat.forEach(disposeMaterial);
        else if (mat) disposeMaterial(mat);
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onLoad]);

  return <div className="hero__canvas" ref={mountRef} />;
}

function disposeMaterial(mat: THREE.Material) {
  for (const value of Object.values(mat)) {
    if (value instanceof THREE.Texture) value.dispose();
  }
  mat.dispose();
}
