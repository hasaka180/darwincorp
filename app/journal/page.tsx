import Link from "next/link";
import ContentGrid from "@/components/ContentGrid";
import ContactFooter from "@/components/ContactFooter";
import type { JournalPost } from "@/lib/cases";
import { getPublishedItems } from "@/lib/published-content";
import { byPostedDate, JOURNAL_CATEGORIES } from "@/lib/content/journal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Journal", "Blogs from Darwin Corp on brands, design, technology and the digital world.", "/journal");
export const revalidate = 86400; // studio saves refresh it immediately

export default async function JournalPage() {
  // Studio posts plus the bundled guides (website and branding costs, how to
  // choose an agency...). Listing only the studio's posts left those guides,
  // the ones closest to what clients search for, linked from almost nowhere.
  const items = (await getPublishedItems("journal")) as JournalPost[];
  items.sort(byPostedDate);

  return (
    <main>
      <section className="subpage" data-theme="light">
        <header className="subpage__head reveal-up">
          <span className="subpage__eyebrow">Journal</span>
          <h1 className="subpage__title">The Darwin Journal.</h1>
          <p>Blogs on brands, design, technology and the digital world.</p>
          <nav className="subpage__topics" aria-label="Journal topics">
            {JOURNAL_CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/journal/category/${c.slug}`}>{c.title}</Link>
            ))}
          </nav>
        </header>
        <ContentGrid items={items} />
      </section>
      <ContactFooter />
    </main>
  );
}
