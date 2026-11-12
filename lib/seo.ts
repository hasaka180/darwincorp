import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.thedarwin.co").replace(/\/$/, "");
export const absoluteUrl = (path: string) => new URL(path, `${SITE_URL}/`).href;
export function pageMetadata(title: string, description: string, path: string, image = "/opengraph-image.jpg"): Metadata {
  return {
    title, description, alternates: { canonical: path },
    openGraph: { type: "website", title, description, url: path, images: [{ url: image }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
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
  postalCode: "00000",
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
  "@context": "https://schema.org", "@type": "Organization", "@id": `${SITE_URL}/#organization`,
  name: "Darwin Corp", url: SITE_URL, logo: absoluteUrl("/darwin_black.svg"),
  description: SITE_DESCRIPTION,
  email: "hello@thedarwin.co", telephone: "+971555355897",
  address: STUDIO_ADDRESS,
  areaServed: "Worldwide",
  knowsAbout: KNOWS_ABOUT,
  sameAs: SAME_AS,
};
