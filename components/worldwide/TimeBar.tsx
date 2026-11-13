"use client";

import { useEffect, useState } from "react";
import { MARKETS, STUDIO, tzOffset as offset } from "./markets";

const PLACES = [STUDIO, ...MARKETS];

/**
 * A 24-hour ruler in Dubai time. Each row is one market's 09:00–18:00 working
 * day mapped onto it, so the overlap with the studio's day is visible at a
 * glance. Rendered after mount: it depends on the visitor's clock.
 */
export default function TimeBar() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(t);
  }, []);

  const dubaiOff = now ? offset(STUDIO.tz, now) : 240;
  const nowMin = now ? ((now.getUTCHours() * 60 + now.getUTCMinutes() + dubaiOff) % 1440 + 1440) % 1440 : 0;

  return (
    <div className="ww-tz">
      <div className="ww-tz__head">
        <span>Working hours, in Dubai time</span>
        <span className="ww-tz__legend"><i /> Overlap with our studio</span>
      </div>
      <div className="ww-tz__body">
        <div className="ww-tz__scale" aria-hidden="true">
          {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => (
            <span key={h} style={{ ["--x" as string]: h / 24 }}>{String(h).padStart(2, "0")}</span>
          ))}
        </div>
        <ul>
          {PLACES.map((p, i) => {
            const shift = now ? (dubaiOff - offset(p.tz, now)) / 60 : 0;
            // Their 09–18 expressed in Dubai hours, possibly wrapping midnight.
            const start = (((9 + shift) % 24) + 24) % 24;
            const segs: [number, number][] = start + 9 <= 24 ? [[start, start + 9]] : [[start, 24], [0, start + 9 - 24]];
            const overlap = segs.map(([a, b]) => [Math.max(a, 9), Math.min(b, 18)] as [number, number]).filter(([a, b]) => b > a);
            const hours = overlap.reduce((n, [a, b]) => n + b - a, 0);
            return (
              <li key={p.city} className={i === 0 ? "is-home" : ""}>
                <span className="ww-tz__city">{p.city}</span>
                <span className="ww-tz__track">
                  {now && segs.map(([a, b]) => <i key={a} className="ww-tz__day" style={{ left: `${(a / 24) * 100}%`, width: `${((b - a) / 24) * 100}%` }} />)}
                  {now && i > 0 && overlap.map(([a, b]) => <i key={`o${a}`} className="ww-tz__ov" style={{ left: `${(a / 24) * 100}%`, width: `${((b - a) / 24) * 100}%` }} />)}
                </span>
                <span className="ww-tz__hrs">{now ? (i === 0 ? "Studio" : `${Math.round(hours)}h shared`) : ""}</span>
              </li>
            );
          })}
        </ul>
        {now && <span className="ww-tz__now" style={{ ["--x" as string]: nowMin / 1440 }} aria-hidden="true"><b>Now</b></span>}
      </div>
    </div>
  );
}
