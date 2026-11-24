import type { Metadata } from "next";

/**
 * The one canonical origin for the whole site: canonical tags, og:url, the
 * sitemap, robots.txt and every JSON-LD @id are built from it.
 *
 * It is the apex because that is the host Netlify serves: since the move from
 * Vercel (Nov 2026) www.thedarwin.co 301s to thedarwin.co. The old default was
 * www, which left every canonical and sitemap URL pointing at a redirect.
 * If the primary domain is ever switched back to www in Netlify, set
 * NEXT_PUBLIC_SITE_URL to match rather than editing this line.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://thedarwin.co").replace(/\/$/, "");
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const absoluteUrl = (path: string) => new URL(path, `${SITE_URL}/`).href;

/**
 * Page metadata. Pass `{ absolute }` for a title that already names the brand,
 * so the layout template doesn't append " - Darwin Corp" a second time.
 */
export function pageMetadata(title: string | { absolute: string }, description: string, path: string, image = "/opengraph-image.jpg"): Metadata {
  // Social cards get the same text as <title>: the layout's template adds the
  // brand to plain titles, but it doesn't apply to og:title / twitter:title.
  const text = typeof title === "string" ? `${title} - Darwin Corp` : title.absolute;
  return {
    title, description, alternates: { canonical: path },
    openGraph: { type: "website", siteName: "Darwin Corp", locale: "en_AE", title: text, description, url: path, images: [{ url: image }] },
    twitter: { card: "summary_large_image", title: text, description, images: [image] },
  };
}
export function breadcrumbData(items: { label: string; href: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({
    "@type": "ListItem", position: index + 1, name: item.label, item: absoluteUrl(item.href),
  })) };
}
/** The studio address, shared by the Organization and JobPosting schemas. */
export const STUDIO_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "6th Floor, Al Meydan Road, Nad Al Sheba 1, Nad Al Sheba",
  addressLocality: "Dubai",
  addressRegion: "Dubai",
  addressCountry: "AE",
} as const;

/**
 * How the studio describes itself everywhere: a global studio that is based in
 * Dubai, rather than a Dubai studio that also takes international work. Search
 * Console shows most of our visibility already comes from the US and UK, so
 * the site should stop telling Google we are local-only.
 */
export const SITE_DESCRIPTION =
  "Darwin Corp is a motion-driven creative studio based in Dubai, working with brands worldwide on interactive websites, brand identity and AI creative production.";

/** Profiles that are the same entity as this domain, incl. the Business Profile. */
export const SAME_AS = [
  "https://www.instagram.com/thedarwin_co/",
  "https://www.facebook.com/thedarwincorp",
  "https://www.linkedin.com/company/darwinco/",
  "https://www.behance.net/darwincorp",
  "https://dribbble.com/darwin-corp",
  // Agency directory profiles.
  "https://clutch.co/profile/darwin-corp",
  "https://www.sortlist.com/agency/darwin-corp-llcfz",
  "https://www.goodfirms.co/company/darwin-corp-llcfz",
  "https://www.designrush.com/agency/profile/darwin-corp-llcfz",
  "https://techbehemoths.com/company/darwin-corp-llcfz",
  "https://marketingdubai.ae/agencies/darwin-corp",
  // Verified Google Business Profile (Knowledge Graph id /g/11zwvrt4_b).
  "https://share.google/TFMGbkBayNXfyVpkP",
];

/** Capabilities, so the entity is understood by what it does, not just where. */
export const KNOWS_ABOUT = [
  "Interactive website design",
  "Custom web development",
  "Motion design",
  "Brand identity",
  "UI/UX design",
  "AI creative production",
  "WebGL and 3D web experiences",
];

/*
 * Rendered on every page under the same @id as the homepage's
 * ProfessionalService, so Google merges the two. It used to carry only the
 * address, leaving every page but the homepage with no service area or
 * profiles — two partial definitions of one entity.
 */
export const organizationData = {
  "@context": "https://schema.org", "@type": "Organization", "@id": ORGANIZATION_ID,
  // Raster and square: Google's logo guidelines want a format Google Images
  // indexes, at least 112px. Matches the homepage ProfessionalService.
  name: "Darwin Corp", url: SITE_URL, logo: absoluteUrl("/icon.png"),
  description: SITE_DESCRIPTION,
  email: "hello@thedarwin.co", telephone: "+971555355897",
  address: STUDIO_ADDRESS,
  areaServed: "Worldwide",
  knowsAbout: KNOWS_ABOUT,
  sameAs: SAME_AS,
};
