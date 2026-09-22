import { notFound } from "next/navigation";
import ExplorePage from "@/components/ExplorePage";
import { INDUSTRY_PAGES } from "@/lib/content/industries";
import { pageMetadata } from "@/lib/seo";
export const dynamicParams = false;
export function generateStaticParams() { return INDUSTRY_PAGES.map(p => ({ slug: p.slug })); }
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
 const { slug } = await params;
 const page = INDUSTRY_PAGES.find(p => p.slug === slug);
 if (!page) notFound();
 return pageMetadata(page.title, page.description, `/industries/${slug}`, page.image);
}
export default async function Page({ params }: Props) {
 const { slug } = await params;
 const page = INDUSTRY_PAGES.find(p => p.slug === slug);
 if (!page) notFound();
 return <ExplorePage page={page} path={`/industries/${slug}`} parent={{ label: "Industries", href: "/industries" }} service />;
}
