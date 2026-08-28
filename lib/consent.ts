/**
 * Cookie consent state.
 *
 * The site itself only sets strictly necessary cookies today, but the banner
 * records a choice for the optional categories so anything added later
 * (analytics, ad pixels on /lp) can gate itself on `hasConsent("analytics")`
 * instead of firing on load.
 *
 * The record lives in localStorage rather than a cookie: nothing server-side
 * reads it, and keeping it out of the request keeps pages cacheable.
 */

export const CONSENT_KEY = "darwin.cookie-consent";
export const CONSENT_VERSION = 1;

/** Fired on window whenever the stored choice changes. */
export const CONSENT_EVENT = "darwin:consent";
/** Fired on window to re-open the preferences panel (footer "Cookie settings"). */
export const CONSENT_OPEN_EVENT = "darwin:consent-open";

export type ConsentCategory = "necessary" | "analytics" | "marketing";

export type Consent = {
  version: number;
  /** ISO timestamp of the decision, so a policy change can expire old records. */
  date: string;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Consent>;
    // A bumped version means the categories changed; ask again.
    if (parsed.version !== CONSENT_VERSION) return null;
    return {
      version: CONSENT_VERSION,
      date: typeof parsed.date === "string" ? parsed.date : new Date().toISOString(),
      necessary: true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
    };
  } catch {
    // Private mode / disabled storage: behave as if no choice was made.
    return null;
  }
}

export function writeConsent(choice: Omit<Consent, "version" | "date">): Consent {
  const record: Consent = {
    ...choice,
    necessary: true,
    version: CONSENT_VERSION,
    date: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
  } catch {
    /* storage unavailable — the choice still applies for this page view */
  }
  window.dispatchEvent(new CustomEvent<Consent>(CONSENT_EVENT, { detail: record }));
  return record;
}

/** True once the visitor has opted into a category. Safe to call anywhere. */
export function hasConsent(category: ConsentCategory): boolean {
  if (category === "necessary") return true;
  return readConsent()?.[category] === true;
}

/** Re-opens the preferences panel from anywhere on the page. */
export function openCookieSettings() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}
