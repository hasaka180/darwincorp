import { notFound } from "next/navigation";
import ExplorePage from "@/components/ExplorePage";
import { PRICING_PAGES } from "@/lib/content/resources";
import { pageMetadata } from "@/lib/seo";
export const dynamicParams = false;
export function generateStaticParams() { return PRICING_PAGES.map(p => ({ slug: p.slug })); }
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
 const { slug } = await params;
 const page = PRICING_PAGES.find(p => p.slug === slug);
 if (!page) notFound();
 return pageMetadata(page.title, page.description, `/pricing/${slug}`, page.image);
}
export default async function Page({ params }: Props) {
 const { slug } = await params;
 const page = PRICING_PAGES.find(p => p.slug === slug);
 if (!page) notFound();
 return <ExplorePage page={page} path={`/pricing/${slug}`} parent={{ label: "Pricing", href: "/pricing" }}  />;
}
