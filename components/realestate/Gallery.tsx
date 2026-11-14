"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Placeholder from "./Placeholder";

const SCENES = [
  { line: "A home that brings the outside in.", label: "Villa terrace opening onto a pool and garden", tone: "sand" as const },
  { line: "A new perspective on city living.", label: "Penthouse living room with skyline view", tone: "night" as const },
  { line: "Architecture designed around the way you live.", label: "Courtyard house with shaded inner garden", tone: "stone" as const },
  { line: "Light, shaped by the day.", label: "Sunlit interior, late afternoon shadows", tone: "sea" as const },
];

const DURATION = 6000;

// Auto-playing floating carousel. The active scene sits centred and large,
// its neighbours hang behind it at an angle, and every card gently bobs.
// The progress bars double as navigation. Autoplay pauses on hover, on
// focus, when off screen, and never starts for reduced-motion visitors.
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
      className={`re-carousel ${playing ? "is-playing" : ""}`}
      style={{ "--re-dur": `${DURATION}ms` } as React.CSSProperties}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
      aria-roledescription="carousel"
    >
      <div className="re-carousel__stage">
        {SCENES.map((s, i) => {
          // Signed distance from the active card, wrapped so the row loops.
          let o = i - active;
          if (o > SCENES.length / 2) o -= SCENES.length;
          if (o < -SCENES.length / 2) o += SCENES.length;
          return (
            <figure
              key={s.line}
              className={`re-carousel__slide ${o === 0 ? "is-active" : ""} ${Math.abs(o) > 1 ? "is-far" : ""}`}
              style={{ "--o": o, "--abs": Math.abs(o), zIndex: 10 - Math.abs(o) } as React.CSSProperties}
              aria-hidden={o !== 0}
              onClick={() => o !== 0 && go(i)}
            >
              <div className="re-carousel__float" style={{ animationDelay: `${i * -1.3}s` }}>
                <Placeholder label={s.label} tone={s.tone} />
              </div>
            </figure>
          );
        })}
      </div>
      <div className="re-carousel__foot">
        <div className="re-carousel__caption" aria-live="polite">
          <span className="re-carousel__count">0{active + 1} / 0{SCENES.length}</span>
          <div className="re-carousel__lines">
            {SCENES.map((s, i) => (
              <p key={s.line} className={i === active ? "is-active" : ""} aria-hidden={i !== active}>{s.line}</p>
            ))}
          </div>
        </div>
        <div className="re-carousel__arrows">
          <button type="button" aria-label="Previous scene" onClick={() => go(active - 1)}>←</button>
          <button type="button" aria-label="Next scene" onClick={() => go(active + 1)}>→</button>
        </div>
      </div>
      <div className="re-carousel__bars">
        {SCENES.map((s, i) => (
          <button
            key={s.line}
            type="button"
            className={i === active ? "is-active" : i < active ? "is-done" : ""}
            aria-label={`Scene ${i + 1}: ${s.line}`}
            aria-current={i === active}
            onClick={() => go(i)}
          >
            <span className="re-carousel__fill" />
            <span className="re-carousel__bar-label">{s.line}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
