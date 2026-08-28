import type { MetadataRoute } from "next";
import { getItems, itemType, type JournalPost } from "@/lib/cases";
import { SERVICES } from "@/lib/services";

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
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = SERVICES.map((s) => ({
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

  return [...staticRoutes, ...serviceRoutes, ...contentRoutes];
}
