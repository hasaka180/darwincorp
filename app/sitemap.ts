import { getPublishedItems as getItems } from "@/lib/published-content";
import type { MetadataRoute } from "next";
import { itemType, type JournalPost } from "@/lib/cases";
import { SERVICES } from "@/lib/services";
import { SERVICE_PAGES } from "@/lib/content/services";
import { INDUSTRY_PAGES } from "@/lib/content/industries";
import { LOCATION_PAGES } from "@/lib/content/locations";
import { PRICING_PAGES, RESOURCE_PAGES } from "@/lib/content/resources";
import { JOURNAL_CATEGORIES } from "@/lib/content/journal";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thedarwin.co";

// Re-read content hourly so new cases and journal posts appear without a deploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/work`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/cases`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/journal`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${SITE_URL}/careers`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/links`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = [...SERVICES, ...SERVICE_PAGES].map((s) => ({
    url: `${SITE_URL}/services/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  // Content is in Appwrite; if it's unreachable the sitemap should still build
  // with the static routes rather than failing the whole page.
  let contentRoutes: MetadataRoute.Sitemap = [];
  try {
    const items = await getItems();
    contentRoutes = items.map((item) => {
      const isJournal = itemType(item) === "journal";
      const date = isJournal ? (item as JournalPost).date : undefined;
      return {
        url: `${SITE_URL}/${isJournal ? "journal" : "cases"}/${item.slug}`,
        lastModified: date ? new Date(date) : now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      };
    });
  } catch {
    contentRoutes = [];
  }

  const newPaths = ["/industries", "/locations", "/pricing", "/start-a-project",
    ...RESOURCE_PAGES.map(p => `/${p.slug}`),
    ...INDUSTRY_PAGES.map(p => `/industries/${p.slug}`),
    ...LOCATION_PAGES.map(p => `/locations/${p.slug}`),
    ...PRICING_PAGES.map(p => `/pricing/${p.slug}`),
    ...JOURNAL_CATEGORIES.map(p => `/journal/category/${p.slug}`),
  ];
  const addedRoutes: MetadataRoute.Sitemap = newPaths.map(path => ({ url: `${SITE_URL}${path}`, changeFrequency: "monthly", priority: 0.7 }));
  return [...new Map([...staticRoutes, ...serviceRoutes, ...addedRoutes, ...contentRoutes].map(route => [route.url, route])).values()];
}
