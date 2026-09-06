"use client";

import { useEffect, useState } from "react";

type Props = {
  value: number;
  suffix?: string;
  duration?: number; // ms
  delay?: number; // ms
  /** Hold at zero until the number is actually on screen. */
  start?: boolean;
};

export default function Counter({
  value,
  suffix = "",
  duration = 1600,
  delay = 0,
  start = true,
}: Props) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!start) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(value);
      return;
    }

    let raf = 0;
    let began: number | null = null;

    const timer = setTimeout(() => {
      const step = (t: number) => {
        if (began === null) began = t;
        const p = Math.min((t - began) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        setN(Math.round(eased * value));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [value, duration, delay, start]);

  return (
    <>
      {n}
      {suffix}
    </>
  );
}
