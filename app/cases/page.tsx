import ContentGrid from "@/components/ContentGrid";
import ContactFooter from "@/components/ContactFooter";
import { getItems, type ContentItem } from "@/lib/cases";

export const metadata = {
  title: "Case Studies",
  description:
    "In-depth case studies on brand identity, website development and AI creative work by Darwin Corp, Dubai.",
  alternates: { canonical: "/cases" },
};
export const dynamic = "force-dynamic";

export default async function CasesPage() {
  let items: ContentItem[] = [];
  try { items = await getItems("case"); } catch { items = []; }
  return (
    <main>
      <section className="subpage" data-theme="light">
        <header className="subpage__head reveal-up">
          <span className="subpage__eyebrow">Case Studies</span>
          <h1 className="subpage__title">Selected work, in depth.</h1>
        </header>
        <ContentGrid items={items} />
      </section>
      <ContactFooter />
    </main>
  );
}
