import ExplorePage from "@/components/ExplorePage";
import { RESOURCE_PAGES } from "@/lib/content/resources";
import { pageMetadata } from "@/lib/seo";
const page = RESOURCE_PAGES.find(p => p.slug === "about")!;
export const metadata = pageMetadata(page.title, page.description, "/about", page.image);
export default function Page() { return <ExplorePage page={page} path="/about" parent={{ label: "Darwin Corp", href: "/" }} />; }
