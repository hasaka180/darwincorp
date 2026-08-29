"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Prismatic light leak — soft blobs of sunlight with rainbow fringing, drifting
 * and shimmering, as if light were coming through a window onto a dark wall.
 *
 * One fullscreen quad and a fragment shader: no geometry, no lights, no
 * textures, nothing to download. The fringing is real dispersion rather than
 * coloured overlays — the same light field is sampled three times along a
 * per-pixel offset, once per channel, so red lands on one edge of a blob and
 * blue on the other exactly as a prism splits it.
 *
 * The shader paints its own ground, so it is the whole hero rather than a
 * layer over something else.
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uRes;
  uniform float uSolo;
  uniform vec2 uPointer;

  // Sampled from the reference: the ground is not black but a cold charcoal,
  // lifted by a broad ambient haze where light bounces off the wall.
  const vec3 INK  = vec3(0.038, 0.045, 0.058);
  const vec3 HAZE = vec3(0.150, 0.180, 0.223);
  // Prism basis. Summed at equal intensity these land on white, so pool cores
  // blow out to white while the dispersed edges stay amber and blue.
  const vec3 WARM = vec3(1.00, 0.50, 0.15);
  const vec3 MID  = vec3(0.44, 0.50, 0.53);
  const vec3 COOL = vec3(0.14, 0.44, 1.00);

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }

  // A pool of light: a tight hot core inside a wide soft halo, which is what
  // gives the reference its blown-out centres rather than flat blobs.
  float pool(vec2 uv, vec2 c, vec2 scale, float rot, float t, float seed) {
    vec2 d = uv - c;
    float s = sin(rot), co = cos(rot);
    d = vec2(d.x * co - d.y * s, d.x * s + d.y * co) / scale;
    // Edges breathe, so the pools shimmer instead of sitting still.
    d *= 1.0 + fbm(d * 1.3 + t * 0.16 + seed) * 0.34 - 0.17;
    float r = dot(d, d);
    return exp(-r * 1.45) * 0.70 + exp(-r * 4.6) * 0.32 + exp(-r * 15.0) * 0.42;
  }

  float field(vec2 uv, float t) {
    float v = 0.0;
    // Weighted to the upper half: the hero's headline and stats sit low, and a
    // blown-out core under white type is unreadable.
    v += pool(uv, vec2(0.72 + sin(t * 0.07) * 0.03, 0.80 + cos(t * 0.05) * 0.02),
              vec2(0.32, 0.19), 0.55, t, 0.0) * 1.05;
    v += pool(uv, vec2(0.50 + cos(t * 0.06) * 0.03, 0.66 + sin(t * 0.08) * 0.03),
              vec2(0.22, 0.13), -0.45, t, 1.7) * 0.66;
    v += pool(uv, vec2(0.88 + sin(t * 0.09) * 0.02, 0.52 + cos(t * 0.06) * 0.03),
              vec2(0.17, 0.11), 0.20, t, 3.1) * 0.58;
    v += pool(uv, vec2(0.30 + cos(t * 0.05) * 0.03, 0.88),
              vec2(0.17, 0.08), 0.35, t, 4.6) * 0.55;
    // Two low, dim ones so the bottom isn't dead — kept well under the type.
    v += pool(uv, vec2(0.14 + sin(t * 0.045) * 0.02, 0.30),
              vec2(0.16, 0.07), 0.30, t, 6.2) * 0.30;
    v += pool(uv, vec2(0.62, 0.16 + cos(t * 0.07) * 0.02),
              vec2(0.13, 0.06), -0.25, t, 7.9) * 0.22;
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uRes.x / max(uRes.y, 1.0);
    vec2 auv = vec2((uv.x - 0.5) * aspect + 0.5, uv.y);
    float t = uTime;
    auv += uPointer * 0.016;
    // Warp the whole field so the pools are organic blobs, not tidy ovals.
    auv += (vec2(fbm(auv * 1.7 + t * 0.05), fbm(auv * 1.7 + 4.3 - t * 0.04)) - 0.5) * 0.085;

    // Dispersion: sample the field once per channel along a radial offset, the
    // way a prism splits light — this is what makes the fringes, not tinting.
    vec2 dir = normalize(auv - vec2(0.62, 0.78) + 1e-5);
    float sep = 0.034 + 0.022 * fbm(auv * 2.0 + t * 0.05);
    float r = field(auv + dir * sep, t);
    float g = field(auv, t);
    float b = field(auv - dir * sep, t);

    vec3 col = (r * WARM + g * MID + b * COOL) / 1.58;

    // Ambient bounce: a broad, soft wash rather than a flat background.
    float haze = fbm(auv * 1.15 + vec2(t * 0.012, 0.0));
    haze *= smoothstep(1.25, -0.15, auv.y + auv.x * 0.35);
    haze += smoothstep(0.9, 0.1, distance(auv, vec2(0.30, 0.34))) * 0.30;
    vec3 ground = INK + HAZE * haze * 1.30;

    // Corners fall away, keeping the frame from feeling like a flat panel.
    float vig = smoothstep(1.35, 0.25, distance(uv, vec2(0.5)) * 1.6);
    ground *= 0.55 + 0.45 * vig;

    col = mix(col, ground + col, uSolo);
    // Roll highlights off rather than clipping: a clipped pool goes pure white
    // and throws away the dispersion that makes the effect read.
    col = vec3(1.0) - exp(-col * 1.58);

    // Matte surface grain — the reference is light on a wall, not on glass.
    float grain = (hash(gl_FragCoord.xy + fract(t) * 91.7) - 0.5) * 0.055;
    col += grain * (0.55 + col.g);

    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;

export default function HeroLightLeak({ onLoad }: { onLoad?: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const uniforms = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uSolo: { value: 1 },
      uPointer: { value: new THREE.Vector2(0, 0) },
    };
    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms })
    );
    scene.add(quad);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const move = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      if (!r.width || !r.height) return;
      pointer.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.current.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    };
    if (!reduce) window.addEventListener("pointermove", move, { passive: true });

    let raf = 0;
    const clock = new THREE.Clock();
    let ex = 0;
    let ey = 0;
    let announced = false;

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      // Reduced motion still renders, it just doesn't drift.
      uniforms.uTime.value += reduce ? 0 : dt;
      const k = 1 - Math.exp(-2.0 * dt);
      ex += (pointer.current.x - ex) * k;
      ey += (pointer.current.y - ey) * k;
      uniforms.uPointer.value.set(ex, ey);
      renderer.render(scene, camera);
      if (!announced) {
        announced = true;
        onLoad?.();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      ro.disconnect();
      quad.geometry.dispose();
      (quad.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onLoad]);

  return (
    <div className="hero__canvas hero__leak" ref={mountRef} aria-hidden="true" />
  );
}
