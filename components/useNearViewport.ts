"use client";

import { useEffect, useState, type RefObject } from "react";

/** Defer decorative scene imports and setup until their section approaches. */
export default function useNearViewport(ref: RefObject<HTMLElement | null>) {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setNear(true);
      observer.disconnect();
    }, { rootMargin: "300px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return near;
}
