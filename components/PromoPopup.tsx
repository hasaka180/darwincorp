"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import LeadForm from "@/components/LeadForm";
import { onPageRevealed } from "@/lib/pageReveal";
import { lockScroll, unlockScroll } from "@/lib/lenis";

/** Bump the suffix to run a new campaign — everyone sees the popup again. */
const SEEN_KEY = "darwin.promo.seasonal-websites.v1";
const DELAY_MS = 8000;

function alreadySeen() {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    // Private mode / storage blocked: treat as seen so we can't nag on a loop.
    return true;
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* nothing to persist to — the popup still stays shut for this session */
  }
}

/**
 * Seasonal-offer modal: home page only, eight seconds after load, once ever.
 * Dismissing it writes the flag, so it never returns on any later visit.
 */
export default function PromoPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<Element | null>(null);

  const isHome = pathname === "/";

  useEffect(() => {
    if (!isHome || alreadySeen()) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    // The eight seconds run from the moment the page is actually on screen —
    // the preloader can hold the home page for far longer than that.
    const stopWaiting = onPageRevealed(() => {
      timer = setTimeout(() => setOpen(true), DELAY_MS);
    });

    // Leaving the home page before it fires cancels it; the visit doesn't
    // count as "seen", so it can still appear on a later home-page visit.
    return () => {
      clearTimeout(timer);
      stopWaiting();
    };
  }, [isHome]);

  const close = useCallback(() => {
    markSeen();
    setOpen(false);
  }, []);

  // Freeze the page, trap focus, and restore it on the way out.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement;
    lockScroll();
    // Two overlays must never stack. The cookie banner steps aside while this
    // is up and comes back on close — waiting on the visitor to answer it
    // first would strand the popup, since most people never do.
    document.body.classList.add("is-promo-open");
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([tabindex="-1"]), select, textarea'
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("is-promo-open");
      unlockScroll();
      (restoreFocusRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className="promo"
      role="dialog"
      aria-modal="true"
      aria-label="Seasonal website offer"
    >
      <button
        type="button"
        className="promo__backdrop"
        aria-label="Close offer"
        tabIndex={-1}
        onClick={close}
      />

      <div className="promo__panel" ref={panelRef} tabIndex={-1}>
        <button
          type="button"
          className="promo__close"
          aria-label="Close offer"
          onClick={close}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
          </svg>
        </button>

        <div className="promo__art">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/lp/seasonal-offer-popup.jpg"
            alt="Darwin Corp seasonal offer: high performing interactive websites from AED 3,000."
            width={1200}
            height={1282}
          />
        </div>

        <div className="promo__side">
          <LeadForm
            cx="promo"
            source="popup/home-seasonal"
            title="Interactive, fully custom-coded websites tuned for speed, Google rankings and AI search answers."
            sub="Season pricing from AED 3,000 — design, build, launch and on-page SEO included. Leave your details and we'll be in touch within one business day."
            submitLabel="Claim the seasonal rate"
            onDone={markSeen}
          />
          <p className="promo__fine">
            Offer valid this season only · Free 15-min strategy call, no
            obligation
          </p>
        </div>
      </div>
    </div>
  );
}
