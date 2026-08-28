import type { ReactNode } from "react";
import Link from "next/link";
import ContactFooter from "@/components/ContactFooter";
import { LEGAL } from "@/lib/legal";

export type LegalSection = {
  /** Anchor id — also what the table of contents links to. */
  id: string;
  title: string;
  body: ReactNode;
};

/**
 * Shell shared by /privacy, /terms and /cookies: paper background (so the
 * floating nav flips dark via `data-theme="light"`), a sticky contents column
 * on wide screens, and numbered sections.
 */
export default function LegalPage({
  eyebrow,
  title,
  lead,
  sections,
  updated = LEGAL.updated,
}: {
  eyebrow: string;
  title: string;
  lead: ReactNode;
  sections: LegalSection[];
  updated?: string;
}) {
  return (
    <main>
      <section className="legal" data-theme="light">
        <header className="legal__head reveal-up">
          <span className="legal__eyebrow">{eyebrow}</span>
          <h1 className="legal__title">{title}</h1>
          <p className="legal__lead">{lead}</p>
          <p className="legal__updated">Last updated {updated}</p>
        </header>

        <div className="legal__grid">
          <nav className="legal__toc reveal-up" aria-label="On this page">
            <span className="legal__toc-title">Contents</span>
            <ol>
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>
                    <span className="legal__toc-n">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="legal__body">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="legal__section reveal-up">
                <h2 className="legal__h2">
                  <span className="legal__n">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </h2>
                <div className="legal__prose">{s.body}</div>
              </section>
            ))}

            <div className="legal__contact reveal-up">
              <h2 className="legal__h2">Questions?</h2>
              <p>
                Write to{" "}
                <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> or call{" "}
                <a href="https://wa.me/971555355897" target="_blank" rel="noreferrer">
                  {LEGAL.phone}
                </a>
                . {LEGAL.company}, {LEGAL.location}.
              </p>
              <div className="legal__crosslinks">
                <Link href="/privacy">Privacy Policy</Link>
                <Link href="/terms">Terms of Service</Link>
                <Link href="/cookies">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <ContactFooter hideCta />
    </main>
  );
}
