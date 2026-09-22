import { getPublishedItems as getItems } from "@/lib/published-content";
import ContentGrid from "@/components/ContentGrid";
import ContactFooter from "@/components/ContactFooter";
import { type ContentItem } from "@/lib/cases";
import Link from "next/link";
import { JOURNAL_CATEGORIES } from "@/lib/content/journal";
import styles from "@/components/ExplorePage.module.css";

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
          <h1 className="subpage__title">Ideas worth exploring.</h1>
          <p>Perspectives on design, technology, brands and the digital world.</p>
        </header>
        <nav aria-label="Journal categories" className={styles.actions} style={{ marginBottom: 40 }}>
          {JOURNAL_CATEGORIES.map(c => <Link className={styles.textLink} key={c.slug} href={`/journal/category/${c.slug}`}>{c.title}</Link>)}
        </nav>
        <ContentGrid items={items} />
      </section>
      <ContactFooter />
    </main>
  );
}
