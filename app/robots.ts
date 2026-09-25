import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thedarwin.co";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The studio is password-gated and the ad landing pages are for paid
        // traffic, not search; keep both out of the index.
        disallow: ["/studio", "/api/", "/lp/"],
      },
      {
        // Client logos kept surfacing as the homepage's search thumbnail.
        // Their alt text stays readable in the HTML; only image indexing is
        // blocked. A named group replaces "*" for that crawler, so the paths
        // above are repeated here.
        userAgent: "Googlebot-Image",
        allow: "/",
        disallow: ["/studio", "/api/", "/lp/", "/assets/logos/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
