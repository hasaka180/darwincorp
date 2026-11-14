/**
 * Enquiry tracking.
 *
 * Events go to the GTM dataLayer, never straight to GA4: GTM only loads once
 * the visitor accepts analytics or marketing cookies (see GoogleTagManager),
 * so without consent these pushes just sit in an array that nothing reads.
 *
 * Events, each mapped to a GA4 event tag in GTM:
 *   generate_lead       a form submission the server accepted (form_source)
 *   whatsapp_click      any wa.me / WhatsApp link
 *   email_click         any mailto: link
 *   phone_click         any tel: link
 *   enquiry_cta_click   any link to /start-a-project or /contact
 * Click events carry link_url, link_text and link_location.
 */

export type TrackEvent =
  | "generate_lead"
  | "whatsapp_click"
  | "email_click"
  | "phone_click"
  | "enquiry_cta_click";

export function track(event: TrackEvent, params: Record<string, string | undefined> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, page_path: window.location.pathname, ...params });
}

/** Which part of the page a link sits in, so footer and page clicks can be compared. */
function linkLocation(a: Element): string {
  const tagged = a.closest<HTMLElement>("[data-track]");
  if (tagged?.dataset.track) return tagged.dataset.track;
  // Not `header`: page sections use <header> for their headings.
  if (a.closest("nav")) return "nav";
  if (a.closest("footer")) return "footer";
  return "content";
}

function classify(href: string): TrackEvent | null {
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|(www\.)?whatsapp\.com)\//i.test(href) || href.startsWith("whatsapp:")) return "whatsapp_click";
  if (href.startsWith("mailto:")) return "email_click";
  if (href.startsWith("tel:")) return "phone_click";
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin === window.location.origin && /^\/(start-a-project|contact)\/?$/.test(url.pathname)) return "enquiry_cta_click";
  } catch {
    /* not a URL we care about */
  }
  return null;
}

/**
 * One delegated listener for the whole site, so every contact link counts,
 * including ones inside CMS case studies and journal posts.
 * Returns the cleanup function.
 */
export function trackContactClicks(): () => void {
  const onClick = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.("a[href]");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    const event = classify(href);
    if (!event) return;
    track(event, {
      link_url: href,
      link_text: (a.textContent || a.getAttribute("aria-label") || "").trim().slice(0, 80),
      link_location: linkLocation(a),
    });
  };
  // Capture phase, so a component that stops propagation can't hide a click.
  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}
