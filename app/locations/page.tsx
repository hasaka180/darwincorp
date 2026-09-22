import { ExploreIndex } from "@/components/ExplorePage";
import { LOCATION_PAGES } from "@/lib/content/locations";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata('Locations', 'Explore how Darwin works with businesses in the UAE and international teams through a clear remote design and development process.', "/locations");
export default function Page() {
 return <ExploreIndex title={'Locations'} heading={'Based in Dubai. Working worldwide.'} description={'Explore how Darwin works with businesses in the UAE and international teams through a clear remote design and development process.'} path="/locations" links={LOCATION_PAGES.map(p => ({ label: p.title, description: p.description, href: `/locations/${p.slug}` }))} />;
}
