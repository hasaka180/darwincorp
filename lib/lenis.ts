import type Lenis from "lenis";

/**
 * Handle on the page's Lenis instance.
 *
 * Lenis drives the real document scroll, so `overflow: hidden` alone does not
 * stop it — anything that needs to freeze the page (the promo modal) has to
 * tell Lenis to stand down too.
 */
let instance: Lenis | null = null;
let locks = 0;

export function setLenis(l: Lenis | null) {
  instance = l;
}

/** Freezes page scrolling. Nestable — the page unfreezes on the last release. */
export function lockScroll() {
  if (++locks > 1) return;
  instance?.stop();
  const bar = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = "hidden";
  // Replace the scrollbar's width so the layout behind doesn't jump.
  if (bar > 0) document.body.style.paddingRight = `${bar}px`;
}

export function unlockScroll() {
  if (locks === 0) return;
  if (--locks > 0) return;
  instance?.start();
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
}
