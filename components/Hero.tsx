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

// three.js plus the glTF loader is a lot of JS, and the skybox it fetches is
// ~2 MB on top. Loading it eagerly put all of that in the homepage's
// first-load bundle and delayed hydration of the heading, stats and CTA.
// Lazy-loading the canvas lets the text paint and become interactive first,
// while the 3D streams in behind it.
const HeroScene = dynamic(() => import("@/components/HeroScene"), {
  ssr: false,
  loading: () => null,
});

// The jellyfish needs WebGPU, so it can never be the only hero. Everyone
// without it falls back to HeroScene's skybox.
const HeroSceneAurelia = dynamic(() => import("@/components/HeroSceneAurelia"), {
  ssr: false,
  loading: () => null,
});

type Variant = "aurelia" | "sky";

export default function Hero() {
  const [loading, setLoading] = useState(true);
  // null until the GPU probe settles, so we never mount one scene and then
  // swap to the other (which would download both).
  const [variant, setVariant] = useState<Variant | null>(null);
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

  // Read from the URL directly rather than useSearchParams, which would opt
  // the whole homepage out of static rendering.
  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("hero");
    if (forced === "sky" || forced === "aurelia") {
      setVariant(forced);
      return;
    }

    // `navigator.gpu` existing is NOT enough — headless Chrome and machines
    // with a blocklisted GPU expose the object but hand back a null adapter,
    // which would drop the visitor into the embed's own error screen. Only a
    // real adapter earns the jellyfish.
    const gpu = (navigator as Navigator & {
      gpu?: { requestAdapter: () => Promise<unknown | null> };
    }).gpu;

    if (!gpu) {
      setVariant("sky");
      return;
    }

    let settled = false;
    const decide = (v: Variant) => {
      if (settled) return;
      settled = true;
      setVariant(v);
    };
    // Don't let a hanging probe leave the hero empty behind the preloader.
    const t = setTimeout(() => decide("sky"), 2500);

    gpu
      .requestAdapter()
      .then((adapter) => decide(adapter ? "aurelia" : "sky"))
      .catch(() => decide("sky"))
      .finally(() => clearTimeout(t));

    return () => {
      settled = true;
      clearTimeout(t);
    };
  }, []);

  // Stable identity: HeroScene keys its whole WebGL setup on this, so a new
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
        {canRender3D && variant && (
          <SceneBoundary onFail={skipScene}>
            {variant === "aurelia" ? (
              <HeroSceneAurelia onLoad={onLoad} />
            ) : (
              <HeroScene onLoad={onLoad} />
            )}
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
