"use client";

import { useState } from "react";
import CaseStudyModal from "./CaseStudyModal";
import type { ContentItem } from "@/lib/cases";

export default function ContentGrid({ items }: { items: ContentItem[] }) {
  const [slug, setSlug] = useState<string | null>(null);

  if (!items.length) {
    return (
      <p className="subpage__empty">
        Nothing here yet, add content in the studio.
      </p>
    );
  }

  return (
    <>
      <div className="cms-grid">
        {items.map((it) => {
          const isCase = "sections" in it;
          const cover = it.cover;
          const cat = it.category;
          const blurb = isCase ? it.intro : it.excerpt;
          const accent = isCase ? it.accent : undefined;

          return (
            <button
              key={it.slug}
              type="button"
              className="cms-card reveal-up"
              onClick={() => isCase && setSlug(it.slug)}
              aria-label={it.title}
            >
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
            </button>
          );
        })}
      </div>

      <CaseStudyModal slug={slug} onClose={() => setSlug(null)} />
    </>
  );
}
