"use client";

import { useEffect, useRef, useState } from "react";
import type { VillaWorld } from "@/lib/villa3d/world";
import { SEASONS } from "@/lib/villa3d/timeline";

// The hero's live 3D villa (lib/villa3d). The Blender-rendered poster shows
// until the scene is ready, and stays if WebGL is unavailable. Drag to orbit;
// pinch, ctrl+wheel or the +/− buttons to zoom. Season buttons hold a season;
// Auto runs the one-minute cycle; ↺ replays the construction.
export default function VillaScene3D({ progress }: { progress: { current: number } }) {
  const mount = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const world = useRef<VillaWorld | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(0);
  const [season, setSeason] = useState(0);
  const [label, setLabel] = useState("Loading the villa");
  const [building, setBuilding] = useState(true);
  const [auto, setAuto] = useState(true);
  const [explored, setExplored] = useState(false);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    let cancelled = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) setAuto(false);
    import("@/lib/villa3d/world").then(({ createVillaWorld }) => createVillaWorld(el, {
      progress,
      reducedMotion,
      onLoad: (f) => { if (!cancelled) setLoading(f); },
      onReady: () => { if (!cancelled) setReady(true); },
      onFail: () => { if (!cancelled) setFailed(true); },
      onStatus: (s, l, b) => { if (!cancelled) { setSeason(s); setLabel(l); setBuilding(b); } },
      onProgress: (f) => { if (bar.current) bar.current.style.transform = `scaleX(${f.toFixed(4)})`; },
      onInteract: () => setExplored(true),
    })).then((w) => {
      if (cancelled) w.dispose();
      else world.current = w;
    }).catch(() => setFailed(true));
    return () => { cancelled = true; world.current?.dispose(); world.current = null; };
  }, [progress]);

  const jump = (s: number) => { setAuto(false); setSeason(s); world.current?.jump(s); };
  const toggleAuto = () => { const next = !auto; setAuto(next); world.current?.setAuto(next); };

  return (
    <div className={`re-villa re-live ${ready && !failed ? "is-ready" : ""}`}>
      <picture className="re-live__poster">
        <source media="(max-aspect-ratio: 9/10)" srcSet="/assets/villa/pano/spring-morning.webp" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/villa/pano/spring-morning.webp" srcSet="/assets/villa/pano/spring-morning.webp 1920w, /assets/villa/pano/spring-morning-hd.webp 3200w"
          sizes="100vw" alt="" fetchPriority="high" />
      </picture>
      <div ref={mount} className="re-live__canvas" role="img" aria-label="Live 3D model of the villa. Drag to orbit; use the zoom buttons to zoom." />
      {!failed && (
        <div className="re-villa__ui" role="group" aria-label="Villa scene controls">
          <p className="re-villa__status" aria-live="polite">
            <span className="re-villa__dot" aria-hidden="true" />
            {ready ? label : `Loading the villa · ${Math.round(loading * 100)}%`}
            {ready && !explored && (
              <span className="re-villa__hint">
                <span className="re-villa__hint-desk">· Drag to orbit</span>
                <span className="re-villa__hint-touch">· Swipe to orbit</span>
              </span>
            )}
          </p>
          <div className="re-villa__row">
            <div className="re-villa__seasons">
              {SEASONS.map((s, i) => (
                <button key={s} type="button" className={!building && season === i ? "is-current" : ""} aria-pressed={!auto && season === i} onClick={() => jump(i)} disabled={!ready}>
                  {s}
                </button>
              ))}
              <span className="re-villa__sep" aria-hidden="true" />
              <button type="button" className="re-villa__auto" aria-pressed={auto} onClick={toggleAuto} disabled={!ready}>Auto</button>
              <button type="button" className="re-villa__replay" aria-label="Replay the build" title="Replay the build" onClick={() => { setAuto(true); world.current?.replay(); }} disabled={!ready}>↺</button>
            </div>
            <div className="re-villa__seasons re-villa__zoom">
              <button type="button" aria-label="Zoom out" onClick={() => world.current?.zoom(1 / 1.25)} disabled={!ready}>−</button>
              <button type="button" aria-label="Zoom in" onClick={() => world.current?.zoom(1.25)} disabled={!ready}>+</button>
            </div>
          </div>
          <div className="re-villa__track" aria-hidden="true">
            <span ref={bar} className="re-villa__bar" />
            <i /><i /><i />
          </div>
        </div>
      )}
    </div>
  );
}
