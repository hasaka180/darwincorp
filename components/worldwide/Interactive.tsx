"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A card that tilts toward the pointer in 3D. */
export function TiltCard({ href, className = "", children }: { href: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse" || reduced()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 10}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
  };
  const onLeave = () => {
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  };
  return (
    <Link ref={ref} href={href} className={`ww-card ${className}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </Link>
  );
}

/**
 * Sets --p (0 to 1) on its element as it scrolls through the viewport, so the
 * process timeline can draw its line and light each step in turn.
 */
export function ScrollProgress({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced()) { el.style.setProperty("--p", "1"); return; }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the top enters the lower fifth of the screen, 1 when it reaches the upper third.
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.55)));
      el.style.setProperty("--p", p.toFixed(3));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
}

const SAMPLES = {
  english: { label: "English", lines: [{ text: "Built around your audience.", lang: "en" }] },
  multilingual: {
    label: "Multilingual",
    lines: [
      { text: "Conçu pour votre public.", lang: "fr" },
      { text: "Pensado para tu público.", lang: "es" },
      { text: "Für Ihr Publikum gestaltet.", lang: "de" },
      { text: "Built around your audience.", lang: "en" },
    ],
  },
  rtl: { label: "Right-to-left", lines: [{ text: "مصمم حول جمهورك.", lang: "ar" }] },
} as const;
type Mode = keyof typeof SAMPLES;

/** The three audience chips from the design, made into a working preview. */
export function AudiencePreview() {
  const [mode, setMode] = useState<Mode>("english");
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
    if (mode !== "multilingual" || reduced()) return;
    const t = window.setInterval(() => setI((n) => n + 1), 1600);
    return () => window.clearInterval(t);
  }, [mode]);
  const lines = SAMPLES[mode].lines;
  const line = lines[i % lines.length];
  const rtl = mode === "rtl";
  return (
    <div className="ww-aud">
      <div className="ww-chips" role="group" aria-label="Preview a layout">
        {(Object.keys(SAMPLES) as Mode[]).map((k) => (
          <button key={k} type="button" className="ww-chip" aria-pressed={mode === k} onClick={() => setMode(k)}>
            {SAMPLES[k].label}
          </button>
        ))}
      </div>
      <div className={`ww-aud__card ${rtl ? "is-rtl" : ""}`} dir={rtl ? "rtl" : "ltr"} aria-live="polite">
        <span className="ww-aud__bar" aria-hidden="true"><i /><i /><i /></span>
        <p key={`${mode}-${i}`} lang={line.lang} className="ww-aud__line">{line.text}</p>
        <span className="ww-aud__nav" aria-hidden="true"><i /><i /><i /><b /></span>
      </div>
    </div>
  );
}

/** Live local time for a city, rendered after hydration to avoid a mismatch. */
export function LocalTime({ tz, city, studio = false }: { tz: string; city: string; studio?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(t);
  }, []);
  const time = now ? new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(now) : "--:--";
  const hour = now ? Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(now)) : -1;
  const awake = hour >= 9 && hour < 18;
  return (
    <span className="ww-time">
      <b>{time}</b>
      <span><i className={awake ? "is-on" : ""} aria-hidden="true" />{city} · {studio ? "studio time" : awake ? "working hours" : "after hours"}</span>
    </span>
  );
}
