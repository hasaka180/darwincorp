import ContentGrid from "@/components/ContentGrid";
import ContactFooter from "@/components/ContactFooter";
import { getItems, type ContentItem } from "@/lib/cases";

export const metadata = {
  title: "Journal",
  description:
    "Notes on brand, motion and craft from the Darwin Corp studio in Dubai.",
  alternates: { canonical: "/journal" },
};
export const dynamic = "force-dynamic";

export default async function JournalPage() {
  let items: ContentItem[] = [];
  try { items = await getItems("journal"); } catch { items = []; }
  return (
    <main>
      <section className="subpage" data-theme="light">
        <header className="subpage__head reveal-up">
          <span className="subpage__eyebrow">Journal</span>
          <h1 className="subpage__title">Notes on brand, motion &amp; craft.</h1>
        </header>
        <ContentGrid items={items} />
      </section>
      <ContactFooter />
    </main>
  );
}
