"use client";

import { useEffect, useState } from "react";

// True when the fixed top bar (around y = probeY) currently sits over a section
// flagged `data-theme="light"` (an #E9E9E9 background). Used to flip the
// floating logo / nav / clock to black for contrast as the page scrolls.
export function useOnLightBg(probeY = 42) {
  const [onLight, setOnLight] = useState(false);

  useEffect(() => {
    const compute = () => {
      const lights = document.querySelectorAll<HTMLElement>(
        '[data-theme="light"]'
      );
      let hit = false;
      lights.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= probeY && r.bottom >= probeY) hit = true;
      });
      setOnLight(hit);
    };

    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [probeY]);

  return onLight;
}
