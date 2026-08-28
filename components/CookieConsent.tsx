"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONSENT_OPEN_EVENT, readConsent, writeConsent } from "@/lib/consent";
import { onPageRevealed } from "@/lib/pageReveal";

type Optional = { analytics: boolean; marketing: boolean };

const ALL: Optional = { analytics: true, marketing: true };
const NONE: Optional = { analytics: false, marketing: false };

const CATEGORIES: {
  key: keyof Optional | "necessary";
  title: string;
  body: string;
}[] = [
  {
    key: "necessary",
    title: "Strictly necessary",
    body: "Keeps the site secure and remembers this choice. Always on.",
  },
  {
    key: "analytics",
    title: "Analytics",
    body: "Aggregate page views, so we can see which work and services people look for.",
  },
  {
    key: "marketing",
    title: "Marketing",
    body: "Measures whether a campaign led to an enquiry. Never used to sell your data.",
  },
];

export default function CookieConsent() {
  const pathname = usePathname();
  // Closed until the stored choice has been read on the client, so the server
  // render stays static and there is no flash of the banner for people who
  // have already answered.
  const [open, setOpen] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [optional, setOptional] = useState<Optional>({
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const stored = readConsent();
    let stopWaiting = () => {};
    if (stored) {
      setOptional({ analytics: stored.analytics, marketing: stored.marketing });
    } else {
      // Hold until the home-page preloader has cleared, or the banner would
      // sit invisible behind it.
      stopWaiting = onPageRevealed(() => setOpen(true));
    }

    const reopen = () => {
      const current = readConsent();
      setOptional({
        analytics: current?.analytics ?? false,
        marketing: current?.marketing ?? false,
      });
      setShowPrefs(true);
      setOpen(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => {
      stopWaiting();
      window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
    };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setShowPrefs(false);
  }, []);

  const decide = useCallback(
    (choice: Optional) => {
      writeConsent({ necessary: true, ...choice });
      setOptional(choice);
      close();
    },
    [close]
  );

  // Escape dismisses the preferences view back to the banner; it never counts
  // as a decision, so the banner stays until a button is pressed.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showPrefs) setShowPrefs(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, showPrefs]);

  // The studio is our own password-gated admin area, not a public page.
  if (pathname?.startsWith("/studio")) return null;
  if (!open) return null;

  return (
    <div
      className={`cc ${showPrefs ? "cc--prefs" : ""}`}
      role="dialog"
      aria-labelledby="cc-title"
    >
      <div className="cc__panel">
        {!showPrefs ? (
          <>
            <div className="cc__text">
              <h2 className="cc__title" id="cc-title">
                We use cookies
              </h2>
              <p className="cc__body">
                Strictly necessary ones keep the site running. Anything
                optional, like analytics, only loads if you allow it. Read the{" "}
                <Link href="/cookies">Cookie Policy</Link> or the{" "}
                <Link href="/privacy">Privacy Policy</Link>.
              </p>
            </div>
            <div className="cc__actions">
              <button
                type="button"
                className="cc__btn cc__btn--ghost"
                onClick={() => setShowPrefs(true)}
              >
                Preferences
              </button>
              <button
                type="button"
                className="cc__btn cc__btn--ghost"
                onClick={() => decide(NONE)}
              >
                Reject optional
              </button>
              <button
                type="button"
                className="cc__btn cc__btn--solid"
                onClick={() => decide(ALL)}
              >
                Accept all
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="cc__text">
              <h2 className="cc__title" id="cc-title">
                Cookie preferences
              </h2>
              <p className="cc__body">
                Choose what we may load. You can change this any time from the
                footer.
              </p>
            </div>

            <ul className="cc__cats">
              {CATEGORIES.map((c) => {
                const locked = c.key === "necessary";
                const checked = locked || optional[c.key as keyof Optional];
                return (
                  <li key={c.key} className="cc__cat">
                    <label className="cc__cat-row">
                      <input
                        type="checkbox"
                        className="cc__check"
                        checked={checked}
                        disabled={locked}
                        onChange={(e) =>
                          setOptional((o) => ({
                            ...o,
                            [c.key as keyof Optional]: e.target.checked,
                          }))
                        }
                      />
                      <span className="cc__switch" aria-hidden="true" />
                      <span className="cc__cat-text">
                        <strong>{c.title}</strong>
                        <span>{c.body}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            <div className="cc__actions">
              <button
                type="button"
                className="cc__btn cc__btn--ghost"
                onClick={() => decide(NONE)}
              >
                Reject optional
              </button>
              <button
                type="button"
                className="cc__btn cc__btn--ghost"
                onClick={() => decide(optional)}
              >
                Save choices
              </button>
              <button
                type="button"
                className="cc__btn cc__btn--solid"
                onClick={() => decide(ALL)}
              >
                Accept all
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
