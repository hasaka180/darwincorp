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
    const gl = (canvas.getContext("webgl2") ||
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    // Release the probe's context so it doesn't count against the limit.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

// The shader itself is tiny, but three.js is not. Lazy-loading the canvas lets
// the heading, stats and CTA paint and hydrate first, with the light arriving
// behind them a moment later.
const HeroLightLeak = dynamic(() => import("@/components/HeroLightLeak"), {
  ssr: false,
  loading: () => null,
});

export default function Hero() {
  const [loading, setLoading] = useState(true);
  // null = not probed yet, so nothing renders during the first pass
  const [canRender3D, setCanRender3D] = useState<boolean | null>(null);

  // Give up on the 3D permanently: stop the spinner and let the preloader go.
  const skipScene = useCallback(() => {
    setCanRender3D(false);
    setLoading(false);
    markHeroReady();
  }, []);

  useEffect(() => {
    if (hasWebGL()) setCanRender3D(true);
    else skipScene();
  }, [skipScene]);

  // Stable identity: the scene keys its whole WebGL setup on this, so a new
  // function every render would tear the context down and rebuild it.
  const onLoad = useCallback(() => {
    setLoading(false);
    // Releases the preloader — it holds until the scene is actually in.
    markHeroReady();
  }, []);

  return (
    <section className="hero">
      <div className="hero__frame">
      <div
        className={`hero__stage${canRender3D === false ? " hero__stage--flat" : ""}`}
      >
        {canRender3D && (
          <SceneBoundary onFail={skipScene}>
            <HeroLightLeak onLoad={onLoad} />
          </SceneBoundary>
        )}
      </div>

      <div className="hero__scrim" aria-hidden="true" />

      {loading && (
        <div className="hero__loader">
          <div className="ring" />
        </div>
      )}

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
              <Counter value={100} suffix="+" delay={700} />
            </span>
            <span className="stat__label">Projects</span>
          </div>
          <div className="stat">
            <span className="stat__num">
              <Counter value={8} suffix="+Y" delay={850} />
            </span>
            <span className="stat__label">Experience</span>
          </div>
          <div className="stat">
            <span className="stat__num">
              <Counter value={1000} suffix="+" duration={1900} delay={1000} />
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
    </section>
  );
}
