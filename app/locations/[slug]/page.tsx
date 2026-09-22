import { notFound } from "next/navigation";
import ExplorePage from "@/components/ExplorePage";
import { LOCATION_PAGES } from "@/lib/content/locations";
import { pageMetadata } from "@/lib/seo";
export const dynamicParams = false;
export function generateStaticParams() { return LOCATION_PAGES.map(p => ({ slug: p.slug })); }
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
 const { slug } = await params;
 const page = LOCATION_PAGES.find(p => p.slug === slug);
 if (!page) notFound();
 return pageMetadata(page.title, page.description, `/locations/${slug}`, page.image);
}
export default async function Page({ params }: Props) {
 const { slug } = await params;
 const page = LOCATION_PAGES.find(p => p.slug === slug);
 if (!page) notFound();
 return <ExplorePage page={page} path={`/locations/${slug}`} parent={{ label: "Locations", href: "/locations" }} service />;
}
