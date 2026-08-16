"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type FeaturedItem = {
  title: string;
  slug: string;
  tags: string[];
  cover?: string;
  accent?: string;
};

type Size = "wide" | "narrow" | "full" | "third";
// Bento layout pattern for up to 6 cards. The "full" (index 2) is the hero row.
const SIZES: Size[] = ["wide", "narrow", "full", "third", "third", "third"];

export default function FeaturedWork({ items }: { items: FeaturedItem[] }) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -12% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!items.length) return null;

  const cards = items.slice(0, 6);

  return (
    <section
      ref={ref}
      data-theme="light"
      className={`featured ${inView ? "is-in" : ""}`}
    >
      <header className="featured__head">
        <h2 className="featured__title">
          Featured Work
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 16.5 5.5 10l1.4-1.4L12 13.7l5.1-5.1L18.5 10 12 16.5Z" />
          </svg>
        </h2>
        <Link className="featured__all" href="/work">
          All Work
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h13M12 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </header>

      <div className="featured__grid">
        {cards.map((w, i) => {
          const size = SIZES[i] ?? "third";
          return (
            <Link
              key={w.slug}
              className={`work work--${size} reveal`}
              href={`/cases/${w.slug}`}
              style={{ transitionDelay: `${i * 0.09}s` }}
            >
              {w.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={w.cover} alt={w.title} loading="lazy" />
              ) : (
                <span
                  className="work__fill"
                  style={{ background: w.accent ?? "#1a1a1a" }}
                />
              )}

              {size === "full" && (
                <span className="work__cta">
                  See Project
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h13M12 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}

              <div className="work__overlay">
                <h3 className="work__title">{w.title}</h3>
                <div className="work__tags">
                  {w.tags.slice(0, 3).map((t) => (
                    <span key={t} className="work__tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
