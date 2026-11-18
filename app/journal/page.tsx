import ContentGrid from "@/components/ContentGrid";
import ContactFooter from "@/components/ContactFooter";
import { getItems, type JournalPost } from "@/lib/cases";
import { byPostedDate } from "@/lib/content/journal";

export const metadata = {
  title: "Journal",
  description:
    "Blogs from Darwin Corp on brands, design, technology and the digital world.",
  alternates: { canonical: "/journal" },
};
export const dynamic = "force-dynamic";

export default async function JournalPage() {
  let items: JournalPost[] = [];
  try {
    items = (await getItems("journal")) as JournalPost[];
    items.sort(byPostedDate);
  } catch {
    items = [];
  }

  return (
    <main>
      <section className="subpage" data-theme="light">
        <header className="subpage__head reveal-up">
          <span className="subpage__eyebrow">Journal</span>
          <h1 className="subpage__title">The Darwin Journal.</h1>
          <p>Blogs on brands, design, technology and the digital world.</p>
        </header>
        <ContentGrid items={items} />
      </section>
      <ContactFooter />
    </main>
  );
}
