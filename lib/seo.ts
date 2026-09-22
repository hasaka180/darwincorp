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
export const organizationData = {
  "@context": "https://schema.org", "@type": "Organization", "@id": `${SITE_URL}/#organization`,
  name: "Darwin Corp", url: SITE_URL, logo: absoluteUrl("/darwin_black.svg"),
  email: "hello@thedarwin.co", telephone: "+971555355897",
  address: { "@type": "PostalAddress", addressLocality: "Dubai", addressCountry: "AE" },
};
