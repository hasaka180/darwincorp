import { ExploreIndex } from "@/components/ExplorePage";
import { INDUSTRY_PAGES } from "@/lib/content/industries";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata('Industries', 'Website design and branding shaped around the way your industry works. Explore the content, journeys and capabilities relevant to your business.', "/industries");
export default function Page() {
 return <ExploreIndex title={'Industries'} heading={'Different businesses. Considered experiences.'} description={'Website design and branding shaped around the way your industry works. Explore the content, journeys and capabilities relevant to your business.'} path="/industries" links={INDUSTRY_PAGES.map(p => ({ label: p.title, description: p.description, href: `/industries/${p.slug}` }))} />;
}
