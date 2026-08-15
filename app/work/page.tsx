import ContentGrid from "@/components/ContentGrid";
import ContactFooter from "@/components/ContactFooter";
import { getItems, type ContentItem } from "@/lib/cases";

export const metadata = { title: "Work - Darwin Corp" };
export const dynamic = "force-dynamic";

export default async function WorkPage() {
  let items: ContentItem[] = [];
  try { items = await getItems("work"); } catch { items = []; }
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
