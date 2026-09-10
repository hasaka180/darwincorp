"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

/**
 * Dotted WebGL globe (COBE) with a marker on Dubai — dark styling to match the
 * founder-section globe card. Auto-rotates; the card crops the lower hemisphere.
 */
export default function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let phi = 3.75; // start with Dubai facing the viewer
    let raf = 0;
    let lastFrame = 0;
    let visible = false;
    let failed = false;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = canvas.offsetWidth;

    let globe: ReturnType<typeof createGlobe>;
    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: ratio,
        width: width * ratio,
        height: width * ratio,
        phi,
        theta: 0.2,
        dark: 0,
        diffuse: 1.1,
        mapSamples: 12000,
        mapBrightness: 3,
        baseColor: [0.52, 0.52, 0.56],
        markerColor: [1, 0.36, 0.22],
        glowColor: [0.92, 0.92, 0.94],
        markerElevation: 0, // flush with the surface, not floating above it
        markers: [{ location: [25.2048, 55.2708], size: 0.04 }],
      });
    } catch {
      // The location text remains available when WebGL is unsupported.
      return;
    }

    const render = () => {
      globe.update({ phi, width: width * ratio, height: width * ratio });
      canvas.style.opacity = "1";
    };
    const tick = (now: number) => {
      raf = 0;
      if (!visible || document.hidden || failed) return;
      if (!lastFrame || now - lastFrame >= 1000 / 30) {
        phi += lastFrame ? Math.min(now - lastFrame, 100) * 0.00018 : 0;
        lastFrame = now;
        render();
      }
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      lastFrame = 0;
    };
    const sync = () => {
      stop();
      if (!visible || document.hidden || failed) return;
      render();
      if (!motion.matches) raf = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(canvas);
    const resize = new ResizeObserver(() => {
      width = canvas.offsetWidth;
      sync();
    });
    resize.observe(canvas);
    const onContextLost = (event: Event) => {
      event.preventDefault();
      failed = true;
      stop();
      canvas.style.opacity = "0";
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);

    return () => {
      stop();
      observer.disconnect();
      resize.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      globe.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="globe-canvas"
      style={{ opacity: 0, transition: "opacity 0.9s ease" }}
    />
  );
}
