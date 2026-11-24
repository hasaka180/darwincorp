/**
 * Where an enquiry came from: the first page of the visit, the site that sent
 * the visitor and any campaign tags. Kept in sessionStorage, so it lasts for
 * one visit, is never sent anywhere on its own, and only reaches us inside an
 * enquiry the visitor chooses to submit. It is never pushed to analytics.
 *
 * Search Console can say which pages get clicks, but not which of those
 * visits became enquiries; this closes that gap in the lead email.
 */

const LANDING_KEY = "darwin.landing.v1";
/** The footer's email box hands its address to the brief form through this. */
export const BRIEF_EMAIL_KEY = "darwin.brief.email";

export type Landing = {
  landing_page: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
};

/** Record the first page of the visit. Later calls in the same visit do nothing. */
export function captureLanding() {
  try {
    if (window.sessionStorage.getItem(LANDING_KEY)) return;
    const url = new URL(window.location.href);
    const data: Landing = { landing_page: url.pathname };
    // Host only: a full referrer URL can carry another site's query string.
    if (document.referrer) {
      const ref = new URL(document.referrer);
      if (ref.host !== url.host) data.referrer = ref.host;
    }
    for (const key of ["utm_source", "utm_medium", "utm_campaign"] as const) {
      const value = url.searchParams.get(key);
      if (value) data[key] = value.slice(0, 100);
    }
    window.sessionStorage.setItem(LANDING_KEY, JSON.stringify(data));
  } catch {
    /* storage blocked or a malformed referrer: no attribution, nothing breaks */
  }
}

export function landingSummary(): Landing | undefined {
  try {
    const raw = window.sessionStorage.getItem(LANDING_KEY);
    return raw ? (JSON.parse(raw) as Landing) : undefined;
  } catch {
    return undefined;
  }
}
