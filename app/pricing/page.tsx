import { ExploreIndex } from "@/components/ExplorePage";
import { PRICING_PAGES } from "@/lib/content/resources";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata('Pricing', 'Explore website and branding scopes, understand what affects cost and request a proposal around the work your business actually needs.', "/pricing");
export default function Page() {
 return <ExploreIndex title={'Pricing'} heading={'Start with a clear scope.'} description={'Explore website and branding scopes, understand what affects cost and request a proposal around the work your business actually needs.'} path="/pricing" links={PRICING_PAGES.map(p => ({ label: p.title, description: p.description, href: `/pricing/${p.slug}` }))} />;
}
