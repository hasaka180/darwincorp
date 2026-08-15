"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Global blur-in reveal. Any element with the class `reveal-up` fades + un-blurs
 * as it scrolls into view. Re-scans on route change so CMS/subpages animate too.
 */
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    let io: IntersectionObserver | null = null;
    const t = setTimeout(() => {
      const els = Array.from(
        document.querySelectorAll<HTMLElement>(".reveal-up:not(.is-in)")
      );
      if (!els.length) return;

      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("is-in");
              io?.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );

      els.forEach((el, i) => {
        // subtle stagger for grouped elements
        el.style.transitionDelay = `${(i % 8) * 0.06}s`;
        io!.observe(el);
      });
    }, 60);

    return () => {
      clearTimeout(t);
      io?.disconnect();
    };
  }, [pathname]);

  return null;
}
