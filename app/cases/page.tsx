import { getPublishedItems as getItems } from "@/lib/published-content";
import ContentGrid from "@/components/ContentGrid";
import ContactFooter from "@/components/ContactFooter";
import { itemType, type ContentItem } from "@/lib/cases";

export const metadata = {
  title: "Case Studies",
  description:
    "In-depth case studies on brand identity, website development and AI creative work by Darwin Corp, Dubai.",
  alternates: { canonical: "/cases" },
};
export const dynamic = "force-dynamic";

export default async function CasesPage() {
  let items: ContentItem[] = [];
  try { items = await getItems(); } catch { items = []; }
  const work = items.filter(item => itemType(item) === "work");
  const analysis = items.filter(item => itemType(item) === "case");
  return (
    <main>
      <section className="subpage" data-theme="light">
        <header className="subpage__head reveal-up">
          <span className="subpage__eyebrow">Case Studies</span>
          <h1 className="subpage__title">Selected work, in depth.</h1>
        </header>
        <ContentGrid items={work} />
        {analysis.length > 0 && <section style={{ marginTop: 70 }}>
          <h2>Independent brand analysis</h2>
          <p style={{ margin: "16px 0 30px" }}>Editorial perspectives on other brands and studios. These are not Darwin client projects.</p>
          <ContentGrid items={analysis} />
        </section>}
      </section>
      <ContactFooter />
    </main>
  );
}
