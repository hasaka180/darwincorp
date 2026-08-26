"use client";

import Link from "next/link";
import type { ContentItem } from "@/lib/cases";

export default function ContentGrid({ items }: { items: ContentItem[] }) {
  if (!items.length) {
    return (
      <p className="subpage__empty">
        Nothing here yet, add content in the studio.
      </p>
    );
  }

  return (
    <div className="cms-grid">
      {items.map((it) => {
        const isCase = "sections" in it;
        const cover = it.cover;
        const cat = it.category;
        const blurb = isCase ? it.intro : it.excerpt;
        const accent = isCase ? it.accent : undefined;

        // Everything sits inside the image now: category and title always
        // visible bottom-left, the blurb and CTA revealed on hover/focus.
        const inner = (
          <span
            className="cms-card__media"
            style={!cover ? { background: accent ?? "#dcdcd6" } : undefined}
          >
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={it.title} loading="lazy" />
            )}
            <span className="cms-card__scrim" aria-hidden="true" />
            <span className="cms-card__body">
              {cat && <span className="cms-card__cat">{cat}</span>}
              <span className="cms-card__title">{it.title}</span>
              <span className="cms-card__reveal">
                {blurb && <span className="cms-card__blurb">{blurb}</span>}
                <span className="cms-card__cta">
                  {isCase ? "Open case" : "Read post"}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M5 12h13M12 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </span>
            </span>
          </span>
        );

        // Every item opens a full, shareable page — cases under /cases,
        // journal posts under /journal.
        return (
          <Link
            key={it.slug}
            href={isCase ? `/cases/${it.slug}` : `/journal/${it.slug}`}
            className="cms-card reveal-up"
            aria-label={it.title}
          >
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
