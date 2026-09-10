"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Counter from "@/components/Counter";
import SceneBoundary from "@/components/SceneBoundary";

/** Feature check only: creating a throwaway context stalls GPU startup twice.
 * The renderer checks actual context availability and uses onFail for fallback.
 */
function hasWebGL(): boolean {
  return typeof window.WebGL2RenderingContext !== "undefined";
}

// The Blender render paints first; the live scene arrives behind the content.
const HeroDreamScene = dynamic(() => import("@/components/HeroDreamScene"), {
  ssr: false,
  loading: () => null,
});

export default function Hero() {
  const [sceneReady, setSceneReady] = useState(false);
  const [startScene, setStartScene] = useState(false);
  const [posterReady, setPosterReady] = useState(false);
  // null = not probed yet, so nothing renders during the first pass
  const [canRender3D, setCanRender3D] = useState<boolean | null>(null);
  // The dolly hands over to the copy near the end of the sticky scroll.
  const [revealed, setRevealed] = useState(false);

  // Keep the Blender poster visible if the live scene cannot run.
  const skipScene = useCallback(() => {
    setCanRender3D(false);
    setSceneReady(false);
    setRevealed(false);
  }, []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const update = () => {
      if (!motion.matches && !connection?.saveData && hasWebGL()) setCanRender3D(true);
      else skipScene();
    };
    update();
    motion.addEventListener("change", update);
    return () => motion.removeEventListener("change", update);
  }, [skipScene]);

  useEffect(() => {
    if (!canRender3D || !posterReady) return;
    // Paint the lightweight poster before importing and compiling the scene.
    // This is automatic for every visitor with hardware WebGL support.
    let idle = 0;
    let frame = 0;
    let timer: ReturnType<typeof setTimeout>;
    const firstFrame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if ("requestIdleCallback" in window) {
          idle = window.requestIdleCallback(() => setStartScene(true), { timeout: 1500 });
        } else {
          timer = setTimeout(() => setStartScene(true), 100);
        }
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(frame);
      if (idle) window.cancelIdleCallback(idle);
      clearTimeout(timer);
    };
  }, [canRender3D, posterReady]);

  useEffect(() => {
    if (!canRender3D || sceneReady) return;
    // A stalled scene download must leave a usable poster, heading and CTA.
    const timeout = setTimeout(skipScene, 8000);
    return () => clearTimeout(timeout);
  }, [canRender3D, sceneReady, skipScene]);

  // Stable identity: the scene keys its whole WebGL setup on this, so a new
  // function every render would tear the context down and rebuild it.
  const onLoad = useCallback(() => {
    setSceneReady(true);
  }, []);

  // Scroll drives the whole hero once WebGL is in play, so the tall sticky
  // section is set up from the capability probe rather than from first paint of
  // the scene — otherwise the copy would show and then blink away.
  const scrollDriven = canRender3D === true;
  // Counting up behind a hidden layer would waste the effect entirely.
  const counting = !scrollDriven || revealed;

  return (
    <section
      className={`hero${scrollDriven ? " hero--interactive" : ""}`}
      data-hero-revealed={scrollDriven && revealed ? "true" : undefined}
    >
      <div className="hero__sticky">
      <div className="hero__frame">
      <div
        className={`hero__stage${sceneReady ? " hero__stage--ready" : ""}`}
      >
        <picture>
          <source media="(orientation: portrait)" type="image/avif" srcSet="/assets/dream/dream-poster-mobile.avif" />
          <source media="(orientation: portrait)" srcSet="/assets/dream/dream-poster-mobile.webp?v=mars-dolly-3" />
          <source type="image/avif" srcSet="/assets/dream/dream-poster.avif" />
          {/* Already compressed locally; picture selects the matching Blender camera. */}
          <img
            className="hero__poster"
            src="/assets/dream/dream-poster.webp?v=mars-dolly-3"
            alt=""
            width={1920}
            height={1200}
            fetchPriority="high"
            decoding="async"
            ref={(image) => { if (image?.complete) setPosterReady(true); }}
            onLoad={() => setPosterReady(true)}
            onError={() => setPosterReady(true)}
          />
        </picture>
        {canRender3D && startScene && (
          <SceneBoundary onFail={skipScene}>
            <HeroDreamScene onLoad={onLoad} onFail={skipScene} onReveal={setRevealed} />
          </SceneBoundary>
        )}
      </div>

      <div className="hero__scrim" aria-hidden="true" />

      <div className="hero__copy">
      {/* The page's main heading. It was a plain div, which left the
          homepage with no h1 at all. */}
      <h1 className="hero__heading">
        <span className="line-serif blur-in">THE MIRROR OF</span>
        <span className="line-display blur-in">IMAGINATION</span>
      </h1>

      <div className="hero__pitch blur-in">
        <p className="hero__pitch-text">
          Creating brands, digital experiences, and stories designed to evolve
          with people, culture, and technology.
        </p>

        <div className="hero__stats">
          <div className="stat">
            <span className="stat__num">
              <Counter value={100} suffix="+" delay={700} start={counting} />
            </span>
            <span className="stat__label">Projects</span>
          </div>
          <div className="stat">
            <span className="stat__num">
              <Counter value={8} suffix="+Y" delay={850} start={counting} />
            </span>
            <span className="stat__label">Experience</span>
          </div>
          <div className="stat">
            <span className="stat__num">
              <Counter value={1000} suffix="+" duration={1900} delay={1000} start={counting} />
            </span>
            <span className="stat__label">Deliverables</span>
          </div>
        </div>

        <Link className="cta-btn" href="/contact">
          <span className="cta-btn__fluid" aria-hidden="true" />
          <span className="cta-btn__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h13M12 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="cta-btn__text">Get Started</span>
        </Link>
      </div>
      </div>
      {sceneReady && <div className="hero__scroll-hint" aria-hidden="true">Scroll to step inside <span>↓</span></div>}
      </div>
      </div>
    </section>
  );
}
