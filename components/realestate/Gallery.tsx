"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Photo from "./Photo";

const SCENES = [
  { line: "A home that brings the outside in.", src: "life-terrace", alt: "Villa terrace opening onto a pool and garden at golden hour" },
  { line: "A new perspective on city living.", src: "life-penthouse", alt: "Penthouse living room with a view of the Dubai skyline at dusk" },
  { line: "Architecture designed around the way you live.", src: "life-courtyard", alt: "Courtyard house with a shaded inner garden and reflecting pool" },
  { line: "Light, shaped by the day.", src: "life-light", alt: "Sunlit interior with long late-afternoon shadows" },
];

const DURATION = 5000;

// A simple cross-fading slideshow. Autoplay runs only while the slideshow is
// on screen, pauses on hover or focus, and never starts for reduced motion.
export default function Gallery() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [still, setStill] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  const go = useCallback((i: number) => setActive((i + SCENES.length) % SCENES.length), []);

  useEffect(() => {
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const playing = inView && !paused && !still;
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => go(active + 1), DURATION);
    return () => clearTimeout(t);
  }, [playing, active, go]);

  return (
    <div
      ref={ref}
      className="re-slides"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="re-slides__frame"
        onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
      >
        {SCENES.map((s, i) => (
          <div key={s.src} className={`re-slides__slide ${i === active ? "is-active" : ""}`} aria-hidden={i !== active}>
            <Photo src={s.src} alt={s.alt} tone="sand" eager={i === 0} />
          </div>
        ))}
      </div>
      <div className="re-slides__foot">
        <div className="re-slides__caption" aria-live="polite">
          <span className="re-slides__count">0{active + 1} / 0{SCENES.length}</span>
          <p className="re-slides__line">{SCENES[active].line}</p>
        </div>
        <div className="re-slides__nav">
          <div className="re-slides__dots">
            {SCENES.map((s, i) => (
              <button key={s.src} type="button" aria-label={`Scene ${i + 1}: ${s.line}`} aria-current={i === active} onClick={() => go(i)} />
            ))}
          </div>
          <button type="button" className="re-slides__arrow" aria-label="Previous scene" onClick={() => go(active - 1)}>←</button>
          <button type="button" className="re-slides__arrow" aria-label="Next scene" onClick={() => go(active + 1)}>→</button>
        </div>
      </div>
    </div>
  );
}
