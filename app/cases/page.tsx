import { getPublishedItems as getItems } from "@/lib/published-content";
import ContentGrid from "@/components/ContentGrid";
import ContactFooter from "@/components/ContactFooter";
import { type ContentItem } from "@/lib/cases";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Case Studies", "In-depth case studies on brand identity, website development and AI creative work by Darwin Corp, Dubai.", "/cases");
export const revalidate = 86400; // studio saves refresh it immediately

export default async function CasesPage() {
  const items: ContentItem[] = await getItems("case");

  return (
    <main>
      <section className="subpage" data-theme="light">
        <header className="subpage__head reveal-up">
          <span className="subpage__eyebrow">Case Studies</span>
          <h1 className="subpage__title">Brands and ideas, in depth.</h1>
          <p>Independent analysis of the strategy, design and technology shaping modern brands.</p>
        </header>
        <ContentGrid items={items} />
      </section>
      <ContactFooter />
    </main>
  );
}
