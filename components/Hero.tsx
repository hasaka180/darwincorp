"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Counter from "@/components/Counter";
import SceneBoundary from "@/components/SceneBoundary";
import { markHeroReady } from "@/lib/heroLoad";

/**
 * Can this device actually give us a WebGL context?
 *
 * Probing first means a device that can't run the scene never downloads the
 * runtime or the scene file at all, and never hits the throw that used to
 * take the whole page down.
 */
function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    // Release the probe's context so it doesn't count against the limit.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

// The Blender render paints first; the live scene arrives behind the content.
const HeroDreamScene = dynamic(() => import("@/components/HeroDreamScene"), {
  ssr: false,
  loading: () => null,
});

export default function Hero() {
  const [sceneReady, setSceneReady] = useState(false);
  // null = not probed yet, so nothing renders during the first pass
  const [canRender3D, setCanRender3D] = useState<boolean | null>(null);
  // The dolly hands over to the copy near the end of the sticky scroll.
  const [revealed, setRevealed] = useState(false);

  // Keep the Blender poster visible if the live scene cannot run.
  const skipScene = useCallback(() => {
    setCanRender3D(false);
    setSceneReady(false);
    setRevealed(false);
    markHeroReady();
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

  // Stable identity: the scene keys its whole WebGL setup on this, so a new
  // function every render would tear the context down and rebuild it.
  const onLoad = useCallback(() => {
    setSceneReady(true);
    // Also releases the preloader if the poster hasn't finished loading yet.
    markHeroReady();
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
          <source media="(orientation: portrait)" srcSet="/assets/dream/dream-poster-mobile.webp?v=mars-dolly-3" />
          {/* Already compressed locally; picture selects the matching Blender camera. */}
          <img
            className="hero__poster"
            src="/assets/dream/dream-poster.webp?v=mars-dolly-3"
            alt=""
            width={1920}
            height={1200}
            fetchPriority="high"
            onLoad={markHeroReady}
            onError={markHeroReady}
          />
        </picture>
        {canRender3D && (
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
