import ContactFooter from "@/components/ContactFooter";
import { getItems } from "@/lib/cases";

export const metadata = { title: "Cases — Darwin Corp" };
export const dynamic = "force-dynamic";

export default async function CasesPage() {
  let items: { slug: string; title: string }[] = [];
  try {
    items = (await getItems("case")) as typeof items;
  } catch {
    items = [];
  }

  return (
    <main>
      <section className="subpage" data-theme="light">
        <header className="subpage__head">
          <span className="subpage__eyebrow">Case Studies</span>
          <h1 className="subpage__title">Selected work, in depth.</h1>
        </header>
        {items.length === 0 ? (
          <p className="subpage__empty">
            Case studies are coming soon — add them in the studio.
          </p>
        ) : (
          <ul className="subpage__list">
            {items.map((it) => (
              <li key={it.slug}>{it.title}</li>
            ))}
          </ul>
        )}
      </section>
      <ContactFooter />
    </main>
  );
}
