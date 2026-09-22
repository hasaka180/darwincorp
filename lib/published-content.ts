import { cache } from "react";
import { getItems, getItem, itemType, type ContentItem, type ContentType, type CaseStudy } from "./cases";
import portfolio from "./content/portfolio.json";
import { EDITORIAL_POSTS } from "./content/journal";

// Public content only. Bundled guides are not seeded into or written to the CMS.
// Existing CMS records take precedence over a bundled item with the same slug.
const bundled: ContentItem[] = [...portfolio as CaseStudy[], ...EDITORIAL_POSTS];
export const getPublishedItems = cache(async (type?: ContentType): Promise<ContentItem[]> => {
  const remote = await getItems();
  const merged = new Map(remote.map(item => [item.slug, item]));
  for (const item of bundled) {
    if (!merged.has(item.slug)) merged.set(item.slug, item);
  }
  return [...merged.values()].filter(item => !type || itemType(item) === type);
});
export const getPublishedItem = cache(async (slug: string): Promise<ContentItem | null> =>
  await getItem(slug) || bundled.find(item => item.slug === slug) || null
);
