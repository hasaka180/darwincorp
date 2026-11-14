"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import VillaScene3D, { VillaPoster } from "./VillaScene3D";

// The opener. A still render of the villa loads with the page; the live 3D
// scene (and its ~17 MB of models) loads only when the visitor presses play.
// Once live, the villa builds itself and cycles through the seasons, and
// scrolling pushes the camera in. Scrolling always fades the copy. Scroll progress is shared with the scene through a ref and written
// to a CSS variable in one rAF loop.
// Staggered entrance for the hero copy (CSS only, so it runs from the first paint).
const delay = (seconds: number) => ({ "--d": `${seconds}s` }) as React.CSSProperties;

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const tick = () => {
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
      progress.current = p;
      el.style.setProperty("--p", p.toFixed(4));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section ref={ref} className="re-hero" data-theme="dark">
      <div className="re-hero__stage">
        {live ? <VillaScene3D progress={progress} /> : <div className="re-villa re-live"><VillaPoster /></div>}
        {!live && (
          <button type="button" className="re-play" onClick={() => setLive(true)}>
            <span className="re-play__icon" aria-hidden="true" />
            <span className="re-play__label">Explore the villa in 3D</span>
          </button>
        )}
        <div className="re-hero__veil" aria-hidden="true" />
        <div className="re-hero__copy">
          <nav className="re-crumbs re-intro" style={delay(0.15)} aria-label="Breadcrumb">
            <Link href="/">Darwin Corp</Link><span>/</span>
            <Link href="/industries">Industries</Link><span>/</span>
            <span aria-current="page">Real Estate</span>
          </nav>
          <h1 className="re-hero__h1 re-intro" style={delay(0.3)}>Real estate website design that goes beyond listings</h1>
          <p className="re-hero__display">
            <span className="re-mask"><span style={delay(0.45)}>Beyond listings.</span></span>{" "}
            <em className="re-mask"><span style={delay(0.62)}>Into living.</span></em>
          </p>
          <p className="re-hero__lead re-intro" style={delay(0.9)}>We design immersive digital experiences for real estate brands that want to be remembered.</p>
          <div className="re-hero__cta">
            <a href="#re-experience" className="re-btn re-btn--light re-intro" style={delay(1.05)}>Explore the experience ↓</a>
            <Link href="/start-a-project" className="re-btn re-btn--line re-intro" style={delay(1.15)}>Start a real estate project ↗</Link>
          </div>
          <a href="#re-services" className="re-skip re-intro" style={delay(1.3)}>Skip the demo, see services</a>
        </div>
      </div>
    </section>
  );
}
