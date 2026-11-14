"use client";

import { useEffect, useRef } from "react";

/**
 * Muted loop for a hero card. The poster paints first; the clip only plays
 * when the visitor hasn't asked for reduced motion or reduced data.
 */
export default function HeroVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || saveData) return;
    v.src = src;
    v.play().catch(() => { /* autoplay blocked: the poster stays */ });
  }, [src]);
  return <video ref={ref} poster={poster} muted loop playsInline preload="none" aria-label={label} />;
}
