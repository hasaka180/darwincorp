"use client";

import { useEffect, useState } from "react";

/**
 * TEMPORARY diagnostic, reachable only at /?debug=motion.
 *
 * Reports whether the page's real animations are advancing on the device
 * you're holding, rather than on an emulator. Delete once the iOS animation
 * question is settled.
 */

type Row = { label: string; value: string };

const WATCH = [
  [".studio__track", "logo carousel"],
  [".toolbox__track", "toolbox carousel"],
  [".pv-search", "magnifier"],
  [".blur-in", "hero blur-in"],
] as const;

export default function MotionDebug() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("debug") !== "motion") return;

    let frames = 0;
    let raf = 0;
    const t0 = performance.now();
    const count = () => {
      frames++;
      raf = requestAnimationFrame(count);
    };
    raf = requestAnimationFrame(count);

    const snap = (sel: string) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { t: cs.transform, name: cs.animationName, state: cs.animationPlayState };
    };

    const before = new Map(WATCH.map(([sel]) => [sel, snap(sel)]));

    const timer = setTimeout(() => {
      cancelAnimationFrame(raf);
      const secs = (performance.now() - t0) / 1000;
      const out: Row[] = [];

      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      out.push({ label: "prefers-reduced-motion", value: mq.matches ? "REDUCE ⚠️" : "no-preference ✓" });
      out.push({ label: "measured fps", value: (frames / secs).toFixed(1) });
      out.push({ label: "dpr", value: String(window.devicePixelRatio) });
      out.push({ label: "viewport", value: `${window.innerWidth}x${window.innerHeight}` });

      for (const [sel, label] of WATCH) {
        const a = before.get(sel);
        const b = snap(sel);
        if (!a || !b) {
          out.push({ label, value: "element not found" });
          continue;
        }
        const moving = a.t !== b.t;
        out.push({
          label,
          value: `anim=${a.name} state=${a.state} moving=${moving ? "YES ✓" : "NO ⚠️"}`,
        });
      }

      out.push({ label: "ua", value: navigator.userAgent });
      setRows(out);
    }, 2500);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  if (!rows.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: "auto 8px 8px 8px",
        zIndex: 2147483647,
        background: "#0b0b0d",
        color: "#fff",
        font: "12px/1.45 ui-monospace, Menlo, monospace",
        padding: "12px 14px",
        borderRadius: 12,
        maxHeight: "62vh",
        overflow: "auto",
        border: "1px solid #333",
      }}
    >
      <strong style={{ display: "block", marginBottom: 8 }}>motion diagnostic</strong>
      {rows.map((r) => (
        <div key={r.label} style={{ marginBottom: 6, wordBreak: "break-word" }}>
          <span style={{ color: "#8a8a94" }}>{r.label}:</span> {r.value}
        </div>
      ))}
    </div>
  );
}
