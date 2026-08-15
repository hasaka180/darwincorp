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

    let width = 0;
    const onResize = () => {
      if (canvas) width = canvas.offsetWidth;
    };
    window.addEventListener("resize", onResize);
    onResize();

    let phi = 4.2; // rotate so the Middle East / Dubai faces the viewer
    let raf = 0;
    let shown = false;

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.2,
      dark: 0,
      diffuse: 1.1,
      mapSamples: 18000,
      mapBrightness: 3,
      baseColor: [0.52, 0.52, 0.56],
      markerColor: [1, 0.36, 0.22],
      glowColor: [0.92, 0.92, 0.94],
      markers: [{ location: [25.2048, 55.2708], size: 0.04 }],
    });

    const tick = () => {
      phi += 0.0035;
      globe.update({ phi, width: width * 2, height: width * 2 });
      if (!shown) {
        shown = true;
        canvas.style.opacity = "1";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      globe.destroy();
      window.removeEventListener("resize", onResize);
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
