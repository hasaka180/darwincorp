"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The hero's villa, rendered in Blender Cycles (scripts/create-villa-scene.py)
// as a 3200×1200 panorama (1920×720 on smaller screens). A construction film plays first; its last frame is
// the first frame of a one-minute time-lapse: four seasons from morning to
// night, with a spring shower, an autumn storm, sailboats, gulls, falling
// coconuts and a frozen winter. Visitors drag to look around the panorama and
// zoom with a pinch, double-click or the +/− buttons. Rain, snow and blown
// leaves are drawn live over the film, in step with its clock. Season buttons
// loop that season's 15 seconds; Auto plays the minute. Reduced motion (or a
// video failure) shows one still per season instead.

const SEASONS = ["Spring", "Summer", "Autumn", "Winter"] as const;
const SEASON_LENGTH = 15;
const CYCLE = SEASON_LENGTH * SEASONS.length;
const SEASON_STILLS = ["spring-morning", "summer-sunset", "autumn-storm", "winter-snowfall"];
const STILL_TIMES = [1, 24, 36, 49];
const ASPECT = 2400 / 900;
const MAX_ZOOM = 1.8;
const asset = (name: string) => `/assets/villa/pano/${name}`;
// Panorama shown at the stage height; phones show it in a band about half the screen tall.
const SIZES = "(max-width: 760px) calc(52vh * 2.67), calc(100vh * 2.67)";
const srcSet = (look: string) => `${asset(`${look}.webp`)} 1920w, ${asset(`${look}-hd.webp`)} 3200w`;

// Mirrors SCHEDULE in scripts/create-villa-scene.py.
const SEGMENTS: [number, string][] = [
  [0, "Morning"], [4.4, "Rain shower"], [8.6, "Sunset"], [12, "Night"],
  [15, "Morning"], [17.4, "Midday"], [22.6, "Golden hour"], [26.6, "Night"],
  [30, "Misty morning"], [33.4, "Storm"], [39.4, "Sunset"], [42.3, "Night"],
  [45, "Frosty morning"], [47, "Snowfall"], [52.2, "Dusk"], [54, "Snowy night"],
];
const labelAt = (t: number) => {
  let label = SEGMENTS[0][1];
  for (const [start, name] of SEGMENTS) if (t >= start) label = name;
  return `${SEASONS[Math.floor(t / SEASON_LENGTH) % 4]} · ${label}`;
};

type Weather = { rain: number; snow: number; leaves: number; wind: number };
const ramp = (a: number, b: number, v: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));
const pulse = (t: number, a: number, b: number, r = 0.8) => ramp(a, a + r, t) * (1 - ramp(b - r, b, t));
const weatherAt = (t: number): Weather => {
  const shower = pulse(t, 4.4, 8.4), storm = pulse(t, 33.4, 39.2);
  return {
    rain: shower * 0.8 + storm,
    wind: 0.15 + shower * 0.25 + storm * 0.85,
    leaves: pulse(t, 30.2, 42, 1) * 0.45 + storm * 0.55,
    snow: pulse(t, 46.8, 52.4, 1) + pulse(t, 52, 58.2, 1) * 0.55,
  };
};
const CALM: Weather = { rain: 0, snow: 0, leaves: 0, wind: 0 };

export default function VillaFilm() {
  const stage = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const build = useRef<HTMLVideoElement>(null);
  const cycle = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const state = useRef({ hold: -1, auto: true, visible: true, stillT: 0, cycleFailed: false, weather: { ...CALM } });
  // Pan (top-left offset in px) and zoom of the panorama inside the stage.
  const cam = useRef({ x: 0, y: 0, z: 1, vx: 0, vy: 0 });
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"build" | "cycle" | "stills">("build");
  const [cycleOn, setCycleOn] = useState(false);
  const [season, setSeason] = useState(0);
  const [label, setLabel] = useState("Building the villa");
  const [auto, setAuto] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [explored, setExplored] = useState(false);
  // Full 3200×1200 films on large or high-density screens; 1920×720 elsewhere or with data saver on.
  const [hd, setHd] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      setAuto(false);
      setMode("stills");
      state.current.auto = false;
      setLabel(labelAt(STILL_TIMES[0]));
    }
    const saver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    setHd(!saver && window.screen.width * (window.devicePixelRatio || 1) >= 2200);
    setReady(true);
  }, []);

  // ---- Pan & zoom ---------------------------------------------------------
  const layout = useCallback((focus?: { fx: number; fy: number }) => {
    const st = stage.current, v = view.current, c = cam.current;
    if (!st || !v) return;
    const cw = st.clientWidth, ch = st.clientHeight;
    const baseH = Math.max(ch, cw / ASPECT);
    const w = baseH * ASPECT * c.z, h = baseH * c.z;
    if (focus) { c.x = cw / 2 - focus.fx * w; c.y = ch / 2 - focus.fy * h; }
    c.x = Math.min(0, Math.max(cw - w, c.x));
    c.y = Math.min(0, Math.max(ch - h, c.y));
    v.style.width = `${w}px`;
    v.style.height = `${h}px`;
    v.style.transform = `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, 0)`;
  }, []);

  const zoomTo = useCallback((z: number, mx?: number, my?: number) => {
    const st = stage.current, c = cam.current;
    if (!st) return;
    const nz = Math.min(MAX_ZOOM, Math.max(1, z));
    const px = mx ?? st.clientWidth / 2, py = my ?? st.clientHeight / 2;
    const k = nz / c.z;
    c.x = px - (px - c.x) * k;
    c.y = py - (py - c.y) * k;
    c.z = nz;
    layout();
    setExplored(true);
  }, [layout]);

  useEffect(() => {
    const st = stage.current;
    if (!st || !ready) return;
    const phone = () => window.matchMedia("(max-width: 760px)").matches;
    // Open on the villa: right of centre on desktop (clear of the copy), centred on phones.
    cam.current.z = 1;
    layout(phone() ? { fx: 0.655, fy: 0.5 } : { fx: 0.56, fy: 0.5 });
    const ro = new ResizeObserver(() => layout());
    ro.observe(st);

    let drag: { id: number; x: number; y: number; t: number } | null = null;
    let raf = 0;
    const glide = () => {
      const c = cam.current;
      c.vx *= 0.92; c.vy *= 0.92;
      c.x += c.vx; c.y += c.vy;
      layout();
      if (Math.abs(c.vx) + Math.abs(c.vy) > 0.3) raf = requestAnimationFrame(glide);
    };
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest("button, a")) return;
      cancelAnimationFrame(raf);
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
      st.setPointerCapture(e.pointerId);
      st.classList.add("is-dragging");
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const c = cam.current, now = performance.now();
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      c.x += dx; c.y += dy;
      const dt = Math.max(1, now - drag.t);
      c.vx = (dx / dt) * 16; c.vy = (dy / dt) * 16;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: now };
      layout();
      if (Math.abs(dx) > 2) setExplored(true);
    };
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      st.classList.remove("is-dragging");
      raf = requestAnimationFrame(glide);
    };
    // Trackpad pinch arrives as ctrl+wheel; plain wheel keeps scrolling the page.
    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const r = st.getBoundingClientRect();
      zoomTo(cam.current.z * Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
    };
    const dbl = (e: MouseEvent) => {
      const r = st.getBoundingClientRect();
      zoomTo(cam.current.z > 1.2 ? 1 : 1.6, e.clientX - r.left, e.clientY - r.top);
    };
    st.addEventListener("pointerdown", down);
    st.addEventListener("pointermove", move);
    st.addEventListener("pointerup", up);
    st.addEventListener("pointercancel", up);
    st.addEventListener("wheel", wheel, { passive: false });
    st.addEventListener("dblclick", dbl);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      st.removeEventListener("pointerdown", down);
      st.removeEventListener("pointermove", move);
      st.removeEventListener("pointerup", up);
      st.removeEventListener("pointercancel", up);
      st.removeEventListener("wheel", wheel);
      st.removeEventListener("dblclick", dbl);
    };
  }, [ready, layout, zoomTo]);

  // ---- Films ----------------------------------------------------------------
  // Construction film -> time-lapse. The build film holds its last frame
  // (identical to the time-lapse's first) until the time-lapse can play.
  const startCycle = useCallback(() => {
    const v = cycle.current;
    if (!v || state.current.cycleFailed || v.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) { setMode("stills"); return; }
    setMode("cycle");
    // A slow connection gets 8 s after the build film before falling back to stills.
    const fallback = window.setTimeout(() => { if (v.readyState < 3) setMode("stills"); }, 8000);
    const go = () => {
      window.clearTimeout(fallback);
      v.currentTime = Math.max(0, state.current.hold) * SEASON_LENGTH;
      v.play().then(() => setCycleOn(true)).catch(() => setMode("stills"));
    };
    if (v.readyState >= 3) go();
    else v.addEventListener("canplay", go, { once: true });
  }, []);

  useEffect(() => {
    const v = build.current;
    if (mode !== "build" || !v) return;
    setCycleOn(false);
    setLabel("Building the villa");
    v.currentTime = 0;
    v.play().catch(startCycle);
  }, [mode, ready, startCycle]);

  // One loop for season holds, the label, progress and the weather overlay.
  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx || !ready) return;
    let raf = 0, last = 0, w = 0, h = 0, dpr = 1, shownLabel = "", shownSeason = -1, dirty = true;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const rain = Array.from({ length: 520 }, () => ({ x: Math.random(), y: Math.random(), l: rnd(14, 30), v: rnd(1.3, 1.9) }));
    const snow = Array.from({ length: 300 }, () => ({ x: Math.random(), y: Math.random(), r: rnd(0.8, 2.6), v: rnd(0.05, 0.11), p: rnd(0, 6.28) }));
    const leaves = Array.from({ length: 44 }, () => ({
      x: Math.random(), y: Math.random(), s: rnd(3, 6), v: rnd(0.07, 0.13), p: rnd(0, 6.28),
      c: ["#c8661f", "#9c3b12", "#d9a13a", "#7a4a1c"][Math.floor(Math.random() * 4)],
    }));
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.25); // soft particles don't need retina density
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      dirty = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    // Pause the films while the hero is off screen.
    const io = new IntersectionObserver(([e]) => {
      state.current.visible = e.isIntersecting;
      const active = mode === "build" ? build.current : mode === "cycle" && cycleOn ? cycle.current : null;
      if (!active) return;
      if (e.isIntersecting) active.play().catch(() => {});
      else active.pause();
    });
    io.observe(cv);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const s = state.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      if (!s.visible || document.hidden) return;

      let target = CALM;
      let progress = 0;
      if (mode === "build" && build.current) {
        const v = build.current;
        progress = v.duration ? v.currentTime / v.duration : 0;
      } else if (mode === "cycle" && cycle.current && cycleOn) {
        const v = cycle.current;
        const start = s.hold * SEASON_LENGTH;
        if (s.hold >= 0 && (v.currentTime >= start + SEASON_LENGTH - 0.05 || v.currentTime < start)) v.currentTime = start;
        const t = v.currentTime;
        progress = t / CYCLE;
        target = weatherAt(t);
        const text = labelAt(t);
        if (text !== shownLabel) { shownLabel = text; setLabel(text); }
        const sn = Math.floor(t / SEASON_LENGTH) % 4;
        if (sn !== shownSeason) { shownSeason = sn; setSeason(sn); }
      } else if (mode === "stills") {
        if (s.auto) s.stillT = (s.stillT + dt) % CYCLE;
        const sn = s.hold >= 0 ? s.hold : Math.floor(s.stillT / SEASON_LENGTH);
        if (sn !== shownSeason) { shownSeason = sn; setSeason(sn); setLabel(labelAt(STILL_TIMES[sn])); }
        progress = s.hold >= 0 ? (s.hold + 0.5) / 4 : s.stillT / CYCLE;
        if (!reduced) target = weatherAt(STILL_TIMES[sn]);
      }
      if (bar.current) bar.current.style.transform = `scaleX(${progress.toFixed(4)})`;

      const a = s.weather, k = 1 - Math.exp(-dt * 2);
      a.rain += (target.rain - a.rain) * k;
      a.snow += (target.snow - a.snow) * k;
      a.leaves += (target.leaves - a.leaves) * k;
      a.wind += (target.wind - a.wind) * k;
      // Nothing falling: clear once, then skip drawing entirely.
      const active = !reduced && (a.rain > 0.01 || a.snow > 0.01 || a.leaves > 0.01);
      if (!active && !dirty) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      dirty = active;
      if (!active) return;
      if (a.rain > 0.01) {
        const slant = 0.1 + a.wind * 0.45;
        ctx.strokeStyle = `rgba(210,220,232,${0.3 * Math.min(1, a.rain)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const n = Math.floor(rain.length * Math.min(1, a.rain));
        for (let i = 0; i < n; i++) {
          const d = rain[i];
          d.y += d.v * dt;
          d.x += slant * d.v * dt * (h / w);
          if (d.y > 1.05 || d.x > 1.05) { d.y = -0.05; d.x = Math.random() * 1.1 - 0.1; }
          const x = d.x * w, y = d.y * h;
          ctx.moveTo(x, y);
          ctx.lineTo(x - d.l * slant, y - d.l);
        }
        ctx.stroke();
      }
      if (a.snow > 0.01) {
        ctx.fillStyle = `rgba(255,255,255,${0.85 * Math.min(1, a.snow)})`;
        const n = Math.floor(snow.length * Math.min(1, a.snow));
        for (let i = 0; i < n; i++) {
          const f = snow[i];
          f.y += f.v * dt; f.p += dt;
          f.x += Math.sin(f.p) * 0.012 * dt + 0.006 * dt;
          if (f.y > 1.03) { f.y = -0.03; f.x = Math.random(); }
          ctx.beginPath(); ctx.arc(f.x * w, f.y * h, f.r, 0, 6.283); ctx.fill();
        }
      }
      if (a.leaves > 0.01) {
        ctx.globalAlpha = Math.min(1, a.leaves);
        const n = Math.floor(leaves.length * Math.min(1, a.leaves));
        for (let i = 0; i < n; i++) {
          const l = leaves[i];
          l.y += l.v * dt * (1 + a.wind);
          l.p += dt * (2.2 + a.wind * 4);
          l.x += (Math.sin(l.p * 0.7) * 0.04 + 0.03 + a.wind * 0.35) * dt;
          if (l.y > 1.05 || l.x > 1.05) { l.y = Math.random() * 0.6 - 0.1; l.x = -0.05; }
          ctx.save();
          ctx.translate(l.x * w, l.y * h); ctx.rotate(l.p); ctx.scale(1, Math.abs(Math.cos(l.p)) * 0.8 + 0.2);
          ctx.fillStyle = l.c; ctx.beginPath(); ctx.ellipse(0, 0, l.s, l.s * 0.45, 0, 0, 6.283); ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, [ready, mode, cycleOn, reduced]);

  const jump = (s: number) => {
    const st = state.current;
    st.hold = s;
    st.auto = false;
    setAuto(false);
    setSeason(s);
    if (mode === "build") { build.current?.pause(); startCycle(); return; }
    if (mode === "cycle" && cycle.current) cycle.current.currentTime = s * SEASON_LENGTH;
    if (mode === "stills") setLabel(labelAt(STILL_TIMES[s]));
  };
  const toggleAuto = () => {
    const st = state.current, next = !auto;
    st.auto = next;
    st.hold = next ? -1 : season;
    setAuto(next);
  };
  const replay = () => {
    if (reduced || mode === "stills") return;
    cycle.current?.pause();
    state.current.hold = -1;
    state.current.auto = true;
    setAuto(true);
    setMode("build");
  };

  const buildVisible = mode === "build" || (mode === "cycle" && !cycleOn);

  return (
    <div className="re-villa is-ready re-film">
      <div ref={stage} className="re-film__stack" aria-label="Rendered villa scene. Drag to look around; use the zoom buttons to zoom." role="img">
        <div ref={view} className="re-film__view">
          {/* Server-rendered first frame, so the hero has its image before any script runs. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("spring-morning.webp")} srcSet={srcSet("spring-morning")} sizes={SIZES} alt="" className="re-film__look re-film__base" fetchPriority="high" draggable={false} />
          {ready && mode === "stills" && SEASON_STILLS.map((look, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={look} src={asset(`${look}.webp`)} srcSet={srcSet(look)} sizes={SIZES} alt="" decoding="async" draggable={false} className={`re-film__look ${i === season ? "is-current" : ""}`} />
          ))}
          {ready && !reduced && (
            <>
              <video ref={cycle} className={`re-film__cycle ${mode === "cycle" && cycleOn ? "is-playing" : ""}`}
                muted playsInline loop preload="auto">
                <source src={asset(`cycle${hd ? "-hd" : ""}.webm`)} type="video/webm" />
                {/* When no source loads, the error fires on the last <source>, not the <video>. */}
                <source src={asset(`cycle${hd ? "-hd" : ""}.mp4`)} type="video/mp4" onError={() => {
                  // Let the build film finish; fall back to stills only when the time-lapse is due.
                  state.current.cycleFailed = true;
                  if (mode === "cycle") setMode("stills");
                }} />
              </video>
              <video ref={build} className={`re-film__build ${buildVisible ? "is-playing" : ""}`}
                muted playsInline preload="auto" poster={asset(`spring-morning${hd ? "-hd" : ""}.webp`)} onEnded={startCycle}>
                <source src={asset(`build${hd ? "-hd" : ""}.webm`)} type="video/webm" />
                <source src={asset(`build${hd ? "-hd" : ""}.mp4`)} type="video/mp4" onError={startCycle} />
              </video>
            </>
          )}
        </div>
      </div>
      <canvas ref={canvas} className="re-film__weather" aria-hidden="true" />
      <div className="re-villa__ui" role="group" aria-label="Villa scene controls">
        <p className="re-villa__status" aria-live="polite">
          <span className="re-villa__dot" aria-hidden="true" />{label}
          {!explored && (
            <span className="re-villa__hint">
              <span className="re-villa__hint-desk">· Drag to look around</span>
              <span className="re-villa__hint-touch">· Swipe to explore</span>
            </span>
          )}
        </p>
        <div className="re-villa__row">
          <div className="re-villa__seasons">
            {SEASONS.map((s, i) => (
              <button key={s} type="button" className={mode !== "build" && season === i ? "is-current" : ""} aria-pressed={!auto && season === i} onClick={() => jump(i)}>
                {s}
              </button>
            ))}
            <span className="re-villa__sep" aria-hidden="true" />
            <button type="button" className="re-villa__auto" aria-pressed={auto} onClick={toggleAuto}>Auto</button>
            <button type="button" className="re-villa__replay" aria-label="Replay the build" title="Replay the build" onClick={replay}>↺</button>
          </div>
          <div className="re-villa__seasons re-villa__zoom">
            <button type="button" aria-label="Zoom out" onClick={() => zoomTo(cam.current.z / 1.3)}>−</button>
            <button type="button" aria-label="Zoom in" onClick={() => zoomTo(cam.current.z * 1.3)}>+</button>
          </div>
        </div>
        <div className="re-villa__track" aria-hidden="true">
          <span ref={bar} className="re-villa__bar" />
          <i /><i /><i />
        </div>
      </div>
    </div>
  );
}
