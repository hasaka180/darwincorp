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

        const inner = (
          <>
            <span
              className="cms-card__media"
              style={!cover ? { background: accent ?? "#dcdcd6" } : undefined}
            >
              {cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt={it.title} loading="lazy" />
              )}
            </span>
            <span className="cms-card__body">
              {cat && <span className="cms-card__cat">{cat}</span>}
              <span className="cms-card__title">{it.title}</span>
              {blurb && <span className="cms-card__blurb">{blurb}</span>}
            </span>
          </>
        );

        // Cases/work open a full, shareable page; other items are non-interactive.
        return isCase ? (
          <Link
            key={it.slug}
            href={`/cases/${it.slug}`}
            className="cms-card reveal-up"
            aria-label={it.title}
          >
            {inner}
          </Link>
        ) : (
          <div key={it.slug} className="cms-card reveal-up" aria-label={it.title}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
