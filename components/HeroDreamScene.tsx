"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { createDreamParticles } from "@/lib/dreamParticles";
import { addDuneRadiance, createDreamEnvironment, createDreamSky } from "@/lib/dreamLighting";

/** Geometry, materials and camera are exported from artwork/dream/darwin-dream.blend. */
export default function HeroDreamScene({ onLoad, onFail, onReveal }: {
  onLoad: () => void;
  onFail: () => void;
  /** Fires when the dolly reaches the point where the hero copy takes over. */
  onReveal: (revealed: boolean) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const abort = new AbortController();
    const scene = new THREE.Scene();
    const pointer = new THREE.Vector2();
    const easedPointer = new THREE.Vector2();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 180);
    const basePosition = new THREE.Vector3();
    const target = new THREE.Vector3();
    const closePosition = new THREE.Vector3();
    const closeTarget = new THREE.Vector3();
    const cameraTarget = new THREE.Vector3();
    const hero = mount.closest<HTMLElement>(".hero");
    const moon = new THREE.Group();
    scene.add(moon);
    let scrollProgress = 0;
    let scrollTarget = 0;
    const raycaster = new THREE.Raycaster();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const groundHit = new THREE.Vector3();
    let pointerActive = false;
    let renderer: THREE.WebGLRenderer | undefined;
    let moonGlow: THREE.Sprite | undefined;
    let environment: THREE.WebGLRenderTarget | undefined;
    let particles: ReturnType<typeof createDreamParticles> | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let visibilityObserver: IntersectionObserver | undefined;
    let disposed = false;
    let loaded = false;
    let visible = true;
    let raf = 0;
    let lastFrame = 0;
    let elapsed = 0;
    let announced = false;
    let revealed = false;

    const disposeObjects = (root: THREE.Object3D) => {
      const materials = new Set<THREE.Material>();
      const textures = new Set<THREE.Texture>();
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        for (const mat of Array.isArray(object.material) ? object.material : [object.material]) {
          materials.add(mat);
          for (const value of Object.values(mat)) {
            if (value instanceof THREE.Texture) textures.add(value);
          }
        }
      });
      textures.forEach((texture) => {
        if (typeof ImageBitmap !== "undefined" && texture.source.data instanceof ImageBitmap) {
          texture.source.data.close();
        }
        texture.dispose();
      });
      materials.forEach((material) => material.dispose());
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      lastFrame = 0;
    };
    const fail = () => {
      if (disposed) return;
      stop();
      onFail();
    };

    const draw = (now: number) => {
      raf = 0;
      if (disposed || !loaded || !visible || document.hidden) return;
      // Cap background rendering at 30 fps, including high refresh rate screens.
      if (lastFrame && now - lastFrame < 1000 / 30) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.08) : 0;
      lastFrame = now;
      elapsed += delta;
      easedPointer.lerp(pointer, 1 - Math.exp(-delta * 2));
      scrollProgress = announced ? THREE.MathUtils.damp(scrollProgress, scrollTarget, 9, delta) : scrollTarget;
      const travel = THREE.MathUtils.smoothstep(scrollProgress, 0, 0.92);
      camera.position.lerpVectors(basePosition, closePosition, travel);
      const drift = 1 - travel * 0.75;
      camera.position.x += (easedPointer.x * 0.25 + Math.sin(elapsed * 0.15) * 0.08) * drift;
      camera.position.y += easedPointer.y * 0.10 * drift;
      cameraTarget.lerpVectors(target, closeTarget, travel);
      camera.lookAt(cameraTarget);
      // Keep the moon framed in the circular opening as in the close reference.
      moon.position.set(4.6 * travel, -3.1 * travel, 0);
      // The copy and its gradient are keyed off this, arriving only near the end.
      hero?.style.setProperty("--hero-travel", String(travel));
      // Past the pitch's fade-in, so the CTA is legible before it takes clicks.
      // Hysteresis so a scroll resting on the threshold can't flicker the copy.
      const nextRevealed = revealed ? travel > 0.68 : travel > 0.76;
      if (nextRevealed !== revealed) {
        revealed = nextRevealed;
        onReveal(revealed);
      }
      camera.updateMatrixWorld();
      raycaster.setFromCamera(pointer, camera);
      const hit = pointerActive ? raycaster.ray.intersectPlane(groundPlane, groundHit) : null;
      particles?.update(elapsed, delta, hit);
      try {
        renderer?.render(scene, camera);
        if (!announced) {
          announced = true;
          onLoad();
        }
      } catch {
        fail();
        return;
      }
      raf = requestAnimationFrame(draw);
    };
    const resume = () => {
      if (loaded && visible && !document.hidden && !raf && !disposed) {
        raf = requestAnimationFrame(draw);
      }
    };
    const onVisibility = () => { if (document.hidden) stop(); else resume(); };
    const onScroll = () => {
      if (!hero) return;
      const distance = hero.offsetHeight - window.innerHeight;
      scrollTarget = distance > 0 ? THREE.MathUtils.clamp(-hero.getBoundingClientRect().top / distance, 0, 1) : 0;
      resume();
    };
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointerActive = true;
      const rect = mount.getBoundingClientRect();
      pointer.set(
        THREE.MathUtils.clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1),
        THREE.MathUtils.clamp(1 - (event.clientY - rect.top) / rect.height * 2, -1, 1),
      );
    };
    const onPointerLeave = () => { pointerActive = false; pointer.set(0, 0); };
    const onContextLost = (event: Event) => { event.preventDefault(); fail(); };

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.10;
      renderer.setClearColor(0x07091d);
      mount.appendChild(renderer.domElement);
      renderer.domElement.addEventListener("webglcontextlost", onContextLost);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const reflection = createDreamEnvironment();
      environment = pmrem.fromScene(reflection.scene, 0.035);
      scene.environment = environment.texture;
      scene.environmentIntensity = 0.85;
      reflection.dispose();
      pmrem.dispose();
      scene.add(createDreamSky());

      RectAreaLightUniformsLib.init();
      const area = (color: number, intensity: number, width: number, height: number,
        position: [number, number, number], aim: [number, number, number]) => {
        const light = new THREE.RectAreaLight(color, intensity * 0.22, width, height);
        light.position.set(...position);
        light.lookAt(...aim);
        scene.add(light);
      };
      area(0xc4a5cf, 6, 5, 5, [-3, 7, -4], [0, 1, 0]);
      area(0x9867b3, 12, 3.5, 7, [-5, 4, 1], [0, 2, -2]);
      area(0xe6c9db, 18, 0.7, 5, [3.15, 4, -1.8], [0, 2, -2]);
      area(0xc64f65, 9, 9, 2, [-3, 5, -10], [0, 0.4, -9]);
      area(0x875478, 8, 15, 10, [-6, 10, -16], [0, 0, -16]);
      area(0xa577bc, 12, 2.5, 6, [6.2, 6, 2], [4.5, 3, -3]);
      area(0xcf7466, 16, 8, 2, [-8, 7, 3], [-5, 0, -10]);
      area(0xc0a1b9, 7, 12, 8, [0, 7, 9], [0, 0, 5]);
      area(0xcf6b73, 16, 7, 5, [7, 3, -1], [3, 0, 3]);
      scene.add(new THREE.HemisphereLight(0xb491b8, 0x2b1326, 0.20));

      // Glow only around the moon: broad screen bloom washed out portrait copy.
      const glowCanvas = document.createElement("canvas");
      glowCanvas.width = glowCanvas.height = 128;
      const glowContext = glowCanvas.getContext("2d");
      if (glowContext) {
        const gradient = glowContext.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, "rgba(219,185,223,0.65)");
        gradient.addColorStop(0.4, "rgba(170,114,181,0.32)");
        gradient.addColorStop(1, "rgba(126,72,149,0)");
        glowContext.fillStyle = gradient;
        glowContext.fillRect(0, 0, 128, 128);
        const texture = new THREE.CanvasTexture(glowCanvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({
          map: texture, transparent: true, depthWrite: false,
          blending: THREE.AdditiveBlending, toneMapped: false,
        }));
        moonGlow.position.set(-7.5, 8.0, -10);
        moonGlow.scale.set(5.2, 5.2, 1);
        moon.add(moonGlow);
      }

      const resize = () => {
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        if (!width || !height) return;
        camera.aspect = width / height;
        const portrait = camera.aspect < 1;
        basePosition.set(portrait ? 4.5 : 10, portrait ? 8.5 : 9, portrait ? 28 : 23);
        target.set(portrait ? -1.5 : 0.5, portrait ? 3.2 : 2.6, -3);
        closePosition.set(portrait ? 1.8 : 2.8, portrait ? 3.8 : 3.9, portrait ? 7.2 : 7.8);
        closeTarget.set(portrait ? 0.3 : 0.5, 2.8, -3.2);
        camera.fov = portrait ? 40 : 28.6845;
        camera.updateProjectionMatrix();
        renderer?.setSize(width, height, false);
        onScroll();
        resume();
      };
      resize();
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      if (hero) resizeObserver.observe(hero);
      visibilityObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) resume(); else stop();
      });
      visibilityObserver.observe(mount);
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("scroll", onScroll, { passive: true });
      mount.parentElement?.parentElement?.addEventListener("pointermove", onPointer, { passive: true });
      mount.parentElement?.parentElement?.addEventListener("pointerleave", onPointerLeave);

      void (async () => {
        try {
          const response = await fetch("/assets/dream/dream-scene.glb?v=mars-dolly-3", { signal: abort.signal });
          if (!response.ok) throw new Error("Dream scene unavailable");
          const data = await response.arrayBuffer();
          if (disposed) return;
          const gltf = await new GLTFLoader().parseAsync(data, "/assets/dream/");
          if (disposed) { disposeObjects(gltf.scene); return; }
          const moonParts: THREE.Object3D[] = [];
          gltf.scene.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return;
            const material = object.material as THREE.MeshStandardMaterial;
            if (material.isMeshStandardMaterial) {
              if (material.name.startsWith("Architecture")) {
                material.color.setRGB(0.55, 0.57, 0.61);
                material.metalness = 0.72;
                material.roughness = 0.23;
                material.envMapIntensity = 0.45;
              }
              if (material.name.startsWith("Curtain")) material.envMapIntensity = 0.40;
              if (material.name.startsWith("Chrome")) {
                material.color.setRGB(0.42, 0.45, 0.53);
                material.envMapIntensity = 1.2;
              }
              if (material.name.startsWith("Dunes")) addDuneRadiance(material);
              if (material.name.startsWith("Moon")) moonParts.push(object);
            }
            if (material.name.startsWith("Floor") || material.name.startsWith("Sky")) object.visible = false;
          });
          scene.add(gltf.scene);
          gltf.scene.updateMatrixWorld(true);
          moonParts.forEach((part) => moon.attach(part));

          // The floor is an instanced field, so thousands of cubes share one draw.
          particles = createDreamParticles(window.matchMedia("(max-width: 768px)").matches);
          scene.add(particles.group);
          loaded = true;
          resume();
        } catch {
          if (!disposed) fail();
        }
      })();
    } catch {
      fail();
    }

    return () => {
      disposed = true;
      abort.abort();
      stop();
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onScroll);
      hero?.style.removeProperty("--hero-travel");
      mount.parentElement?.parentElement?.removeEventListener("pointermove", onPointer);
      mount.parentElement?.parentElement?.removeEventListener("pointerleave", onPointerLeave);
      renderer?.domElement.removeEventListener("webglcontextlost", onContextLost);
      if (particles) { scene.remove(particles.group); particles.dispose(); }
      disposeObjects(scene);
      environment?.dispose();
      if (moonGlow) {
        moonGlow.material.map?.dispose();
        moonGlow.material.dispose();
      }
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, [onLoad, onFail, onReveal]);

  return <div ref={mountRef} className="hero__canvas" aria-hidden="true" />;
}
