"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// A continuous displaced sheet: the broad diagonal fold and finer ripples
// share the same field, so highlights follow the surface as it moves.
const surface = /* glsl */ `
  uniform float uTime;
  float seam(vec2 p) {
    return 0.78 - 0.62 * p.x
      + 0.105 * sin(p.x * 5.2 + uTime * 0.22)
      + 0.035 * sin(p.x * 10.0 - uTime * 0.17);
  }
  float heightAt(vec2 p) {
    float d = p.y - seam(p);
    float fold = exp(-pow(d * 5.6, 2.0));
    float ripples = sin(d * 35.0 + p.x * 6.0 - uTime * 0.32);
    return 0.65 * fold
      + 0.105 * ripples * exp(-pow(d * 4.0, 2.0))
      + 0.13 * sin(p.x * 5.0 + p.y * 3.0 + uTime * 0.19)
      + 0.055 * sin(p.x * 12.0 - p.y * 7.0 - uTime * 0.15);
  }
`;

const vertexShader = /* glsl */ `
  ${surface}
  uniform float uAspect;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying float vHeight;
  void main() {
    vUv = uv;
    float h = heightAt(uv);
    float e = 0.002;
    float dx = (heightAt(uv + vec2(e, 0.0)) - heightAt(uv - vec2(e, 0.0))) / (2.0 * e);
    float dy = (heightAt(uv + vec2(0.0, e)) - heightAt(uv - vec2(0.0, e))) / (2.0 * e);
    vNormal = normalize(vec3(-dx / (2.0 * uAspect), -dy / 2.0, 1.0));
    vHeight = h;
    vec3 p = position;
    p.x *= uAspect;
    p.z = h;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  ${surface}
  varying vec2 vUv;
  varying vec3 vNormal;
  varying float vHeight;
  void main() {
    vec2 p = vUv;
    vec3 n = normalize(vNormal);
    float d = p.y - seam(p);
    vec3 coral = vec3(1.0, 0.22, 0.26);
    vec3 orange = vec3(1.0, 0.40, 0.12);
    vec3 pink = vec3(0.97, 0.19, 0.48);
    vec3 blue = vec3(0.025, 0.48, 0.65);
    vec3 teal = vec3(0.002, 0.075, 0.08);
    vec3 color = mix(orange, pink, smoothstep(0.12, 0.72, p.x));
    color = mix(color, blue, smoothstep(0.42, 0.98, p.x) * smoothstep(-0.1, 0.34, d));
    color = mix(color, coral, (1.0 - p.y) * 0.32);
    float shadow = (1.0 - smoothstep(-0.30, 0.02, d)) * (1.0 - smoothstep(0.05, 0.65, p.x));
    color = mix(color, teal, shadow * 0.98);

    // Soft colored studio reflections and a narrow cyan grazing highlight.
    float facing = max(dot(n, normalize(vec3(-0.45, 0.6, 1.0))), 0.0);
    color *= 0.52 + 0.48 * facing;
    float silk = exp(-pow(d * 8.0, 2.0));
    float sheen = pow(1.0 - abs(n.z), 1.5) * silk;
    color = mix(color, vec3(0.27, 0.77, 0.87), sheen * 0.78);
    float reflection = pow(max(dot(n, normalize(vec3(0.25, -0.7, 0.9))), 0.0), 18.0);
    color += vec3(0.20, 0.66, 0.72) * reflection * silk * 0.75;
    float rim = exp(-pow((d - 0.065) * 65.0, 2.0));
    color = mix(color, vec3(0.48, 0.91, 0.94), rim * 0.58);
    color += vec3(0.16, 0.09, 0.16) * max(vHeight, 0.0) * silk;
    float vignette = 1.0 - smoothstep(0.22, 0.9, distance(p, vec2(0.52, 0.52)));
    color *= 0.82 + 0.18 * vignette;
    // The art-directed palette above is already in display (sRGB) space.
    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function ProcessSilkScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
    camera.position.z = 5;
    const uniforms = { uTime: { value: 0 }, uAspect: { value: 1 } };
    let renderer: THREE.WebGLRenderer | undefined;
    let geometry: THREE.PlaneGeometry | undefined;
    let material: THREE.ShaderMaterial | undefined;
    let visible = false;
    let failed = false;
    let frame = 0;
    let lastTime = 0;

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    };

    const render = () => renderer?.render(scene, camera);
    const draw = (now: number) => {
      frame = 0;
      if (!visible || document.hidden || failed || reducedMotion.matches) return;
      if (!lastTime || now - lastTime >= 1000 / 30) {
        uniforms.uTime.value += lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 0;
        lastTime = now;
        render();
      }
      frame = requestAnimationFrame(draw);
    };

    const sync = () => {
      stop();
      if (!renderer || !visible || document.hidden || failed) return;
      render();
      if (!reducedMotion.matches) frame = requestAnimationFrame(draw);
    };

    const resize = () => {
      if (!renderer) return;
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      const aspect = width / height;
      // Also cap total pixels for the tall, stacked mobile section.
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(2_000_000 / (width * height)));
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      camera.left = -aspect;
      camera.right = aspect;
      camera.updateProjectionMatrix();
      uniforms.uAspect.value = aspect;
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
          geometry = new THREE.PlaneGeometry(2, 2, 180, 120);
          material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthTest: false, depthWrite: false });
          const sheet = new THREE.Mesh(geometry, material);
          sheet.frustumCulled = false;
          scene.add(sheet);
          renderer.domElement.addEventListener("webglcontextlost", contextLost);
          renderer.domElement.addEventListener("webglcontextrestored", contextRestored);
          resize();
          mount.appendChild(renderer.domElement);
        } catch {
          failed = true;
          renderer?.dispose();
          renderer?.domElement.remove();
        }
      }
      sync();
    });
    observer.observe(mount);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    reducedMotion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      reducedMotion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      renderer?.domElement.removeEventListener("webglcontextlost", contextLost);
      renderer?.domElement.removeEventListener("webglcontextrestored", contextRestored);
      geometry?.dispose();
      material?.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer?.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="proc__silk-scene" aria-hidden="true" />;
}
