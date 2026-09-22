import { notFound } from "next/navigation";
import { ExploreIndex } from "@/components/ExplorePage";
import { JOURNAL_CATEGORIES } from "@/lib/content/journal";
import { getPublishedItems } from "@/lib/published-content";
import { pageMetadata } from "@/lib/seo";
import type { JournalPost } from "@/lib/cases";

export const revalidate = 600;
export const dynamicParams = false;
export function generateStaticParams() { return JOURNAL_CATEGORIES.map(c => ({ slug: c.slug })); }
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const category = JOURNAL_CATEGORIES.find(c => c.slug === slug);
  if (!category) notFound();
  return pageMetadata(`${category.title} Journal`, category.description, `/journal/category/${slug}`);
}
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const category = JOURNAL_CATEGORIES.find(c => c.slug === slug);
  if (!category) notFound();
  const items = (await getPublishedItems("journal") as JournalPost[]).filter(p => p.category?.toLowerCase() === category.title.toLowerCase());
  return <ExploreIndex title={category.title} heading={category.title} description={category.description} path={`/journal/category/${slug}`}
    links={items.map(p => ({ label: p.title, description: p.excerpt, href: `/journal/${p.slug}` }))} />;
}
