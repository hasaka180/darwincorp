"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import SceneBoundary from "@/components/SceneBoundary";
import { MARKETS, STUDIO, tzOffset } from "./markets";

const WorldScene = dynamic(() => import("./WorldScene"), { ssr: false, loading: () => null });

const clock = (tz: string, d: Date, seconds = false) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", ...(seconds ? { second: "2-digit" } : {}) }).format(d);

/**
 * Framed hero card, like the home hero: a still of the map paints first, then
 * the live WebGL scene fades in over it. The copy is passed in from the server
 * component so it is always in the HTML.
 */
export default function WorldHero({ children }: { children: ReactNode }) {
  const [canRender, setCanRender] = useState(false);
  const [ready, setReady] = useState(false);
  const [focus, setFocus] = useState("Dubai");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (typeof window.WebGL2RenderingContext !== "undefined" && !saveData) {
      const id = requestAnimationFrame(() => setCanRender(true));
      return () => cancelAnimationFrame(id);
    }
  }, []);

  useEffect(() => {
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const onReady = useCallback(() => setReady(true), []);
  const onFail = useCallback(() => { setCanRender(false); setReady(false); }, []);
  const onFocus = useCallback((city: string) => setFocus(city), []);

  const dubaiOff = now ? tzOffset(STUDIO.tz, now) : 240;

  return (
    <section className="ww-hero">
      <div className={`ww-hero__frame ${ready ? "is-live" : ""}`}>
        <picture>
          <source media="(orientation: portrait)" srcSet="/assets/worldwide/map-poster-mobile.webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ww-hero__poster" src="/assets/worldwide/map-poster.webp" alt="" width={2100} height={1290} fetchPriority="high" decoding="async" />
        </picture>
        {canRender && (
          <SceneBoundary onFail={onFail}>
            <WorldScene onReady={onReady} onFail={onFail} onFocus={onFocus} />
          </SceneBoundary>
        )}
        <div className="ww-hero__scrim" aria-hidden="true" />

        {/* Decorative: the same times are in the market cards further down. */}
        <div className="ww-hud ww-hud--tr" aria-hidden="true">
          <span className="ww-hud__city">Dubai</span>
          <span className="ww-hud__live"><i />Studio · GST</span>
          <span className="ww-hud__clock">{now ? clock(STUDIO.tz, now, true) : "--:--:--"}</span>
          <span className="ww-hud__coords">25.2048° N, 55.2708° E</span>
          <span className="ww-hud__rule" />
          <span className="ww-hud__cap">Local time · vs studio</span>
          <span className="ww-hud__table">
            {MARKETS.map((m) => {
              const diff = now ? (tzOffset(m.tz, now) - dubaiOff) / 60 : 0;
              return (
                <span key={m.city} className={focus === m.city ? "is-focus" : ""}>
                  <b>{m.city}</b>
                  <i>{now ? clock(m.tz, now) : "--:--"}</i>
                  <em>{now ? `${diff > 0 ? "+" : diff < 0 ? "−" : "±"}${Math.abs(diff)}h` : ""}</em>
                </span>
              );
            })}
          </span>
        </div>
        <div className="ww-hud ww-hud--br" aria-hidden="true">
          {ready && <span className="ww-hud__link" key={focus}>Route: Dubai → {focus === "Dubai" ? "Worldwide" : focus}</span>}
          <span>{ready ? "Drag to turn the map ⟲" : "Based in Dubai. Working worldwide."}</span>
        </div>

        <div className="ww-hero__copy">{children}</div>
      </div>
    </section>
  );
}
