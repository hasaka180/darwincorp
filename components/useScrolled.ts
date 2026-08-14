"use client";

import { useEffect, useState } from "react";

// True once the page has scrolled past `threshold` px from the top. Used to
// hide the floating logo / clock while keeping the nav pill visible.
export function useScrolled(threshold = 60) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}
