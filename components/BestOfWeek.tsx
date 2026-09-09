import Link from "next/link";
import type { JournalPost } from "@/lib/cases";

/** "Sep 06, 2022" — falls back to whatever was stored if it will not parse. */
function formatDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function BestOfWeek({ posts }: { posts: JournalPost[] }) {
  // Nothing published yet: an empty frame reads as a broken section, so the
  // whole thing sits out.
  if (!posts.length) return null;

  const [feature, second] = posts;
  // With one post published the tile still needs artwork; it borrows the
  // feature's rather than leaving a hole in the grid.
  const pick = second ?? feature;
  const date = formatDate(feature.date);

  return (
    <section className="botw" id="journal" data-theme="light">
      <header className="botw__head reveal-up">
        <h2 className="botw__title">
          Best of the week{" "}
          <Link className="botw__title-link" href="/journal">
            See all posts →
          </Link>
        </h2>
      </header>

      <div className="botw__grid">
        <Link className="botw__feature reveal-up" href={`/journal/${feature.slug}`}>
          {feature.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={feature.cover} alt="" loading="lazy" />
          )}
          {date && <span className="botw__date">{date}</span>}
          {feature.category && <span className="botw__cat">{feature.category}</span>}
          <div className="botw__overlay">
            <h3>{feature.title}</h3>
          </div>
          <span className="botw__arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </Link>

        <div className="botw__side">
          <div className="botw__ad reveal-up">
            <div className="botw__ad-top">
              <span className="botw__ad-tag">• ADS</span>
              <span className="botw__ad-plus" aria-hidden="true">+</span>
            </div>
            <span className="botw__ad-kicker">Become a Broadcast Member</span>
            <h4>Real talk in a corporate world</h4>
            <a className="botw__ad-link" href="#">Learn more</a>
          </div>

          {/* The index tile: the artwork is the next post, but the badge counts
              everything published and the card goes to the journal itself. */}
          <Link className="botw__pick reveal-up" href="/journal">
            {pick.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pick.cover} alt="" loading="lazy" />
            )}
            <span className="botw__badge">{posts.length}</span>
            <span className="botw__pill">See all posts →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
