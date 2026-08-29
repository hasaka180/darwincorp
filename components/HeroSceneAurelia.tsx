"use client";

import { useEffect, useRef } from "react";

/**
 * The procedural jellyfish hero — Aurelia by Holtsetio (MIT), self-hosted at
 * /aurelia and embedded as a click-through iframe.
 *
 * An iframe rather than a port: the demo is built with a Vite-only TSL
 * operator plugin that this app's bundler can't run, and keeping its source
 * untouched keeps the MIT notice intact. The trade-off is that the frame
 * swallows input, so it is pointer-events:none and we forward the cursor in
 * by postMessage, and pause the simulation when the hero scrolls away.
 *
 * Only ever mounted when navigator.gpu exists — the tentacles are a verlet
 * system in compute shaders, which WebGL has no equivalent for. Everyone else
 * gets HeroScene's skybox.
 */
export default function HeroSceneAurelia({ onLoad }: { onLoad: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const post = (msg: Record<string, unknown>) => {
      frameRef.current?.contentWindow?.postMessage(msg, "*");
    };

    // The scene reports when the jellyfish is actually on screen; until then
    // the preloader holds. Its own 9s cap covers a failure to ever arrive.
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "aurelia:ready") onLoad();
    };
    window.addEventListener("message", onMessage);

    const move = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // Coordinates are relative to the frame, which is exactly the hero box.
      post({ type: "aurelia:pointer", x: e.clientX - r.left, y: e.clientY - r.top });
    };
    window.addEventListener("pointermove", move, { passive: true });

    // Don't burn GPU on a simulation nobody can see.
    const io = new IntersectionObserver(
      ([entry]) => post({ type: "aurelia:visible", value: entry.isIntersecting }),
      { threshold: 0 }
    );
    io.observe(wrap);

    const onHidden = () => post({ type: "aurelia:visible", value: !document.hidden });
    document.addEventListener("visibilitychange", onHidden);

    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("visibilitychange", onHidden);
      io.disconnect();
    };
  }, [onLoad]);

  return (
    <div className="hero__canvas" ref={wrapRef}>
      <iframe
        ref={frameRef}
        className="hero__frame-embed"
        src="/aurelia/index.html"
        title="Procedural jellyfish"
        tabIndex={-1}
        aria-hidden="true"
        loading="eager"
        // If the ready message never arrives, still release the preloader.
        onLoad={() => window.setTimeout(onLoad, 4000)}
      />
    </div>
  );
}
