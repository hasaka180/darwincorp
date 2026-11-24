import { getPublishedItems as getItems } from "@/lib/published-content";
import ContentGrid from "@/components/ContentGrid";
import ContactFooter from "@/components/ContactFooter";
import { type ContentItem } from "@/lib/cases";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Work", "Selected branding, web and AI creative projects by Darwin Corp, a creative studio based in Dubai and working worldwide.", "/work");
export const revalidate = 86400; // studio saves refresh it immediately

export default async function WorkPage() {
  const items: ContentItem[] = await getItems("work");
  return (
    <main>
      <section className="subpage" data-theme="light">
        <header className="subpage__head reveal-up">
          <span className="subpage__eyebrow">Work</span>
          <h1 className="subpage__title">Selected projects.</h1>
        </header>
        <ContentGrid items={items} />
      </section>
      <ContactFooter />
    </main>
  );
}
