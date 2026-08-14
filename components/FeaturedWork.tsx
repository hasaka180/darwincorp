"use client";

import { useEffect, useRef, useState } from "react";

type Size = "wide" | "narrow" | "full" | "third";
type Work = {
  title: string;
  tags: string[];
  img: string;
  size: Size;
  featured?: boolean;
};

// Seeded placeholder imagery — swap `img` for real project shots when ready.
const shot = (seed: string) => `https://picsum.photos/seed/${seed}/1100/760`;

const WORK: Work[] = [
  {
    title: "Broadway Venture Partners",
    tags: ["Web Design & Development"],
    img: shot("dar-broadway"),
    size: "wide",
  },
  {
    title: "We Scale It",
    tags: ["Brand Identity", "Web Design & Development"],
    img: shot("dar-wescale"),
    size: "narrow",
  },
  {
    title: "Major Media Agency",
    tags: ["Web Design & Development"],
    img: shot("dar-major"),
    size: "full",
    featured: true,
  },
  {
    title: "Enzo Drew Cycling Company",
    tags: ["Web Design & Development"],
    img: shot("dar-enzo"),
    size: "third",
  },
  {
    title: "7 Phases of Madness",
    tags: ["Brand Identity", "Motion & 3D"],
    img: shot("dar-7phases"),
    size: "third",
  },
  {
    title: "Kastle AI",
    tags: ["Motion & 3D", "Web Design & Development"],
    img: shot("dar-kastle"),
    size: "third",
  },
];

export default function FeaturedWork() {
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
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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
        <a className="featured__all" href="#">
          All Work
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h13M12 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </header>

      <div className="featured__grid">
        {WORK.map((w, i) => (
          <a
            key={w.title}
            className={`work work--${w.size} reveal`}
            href="#"
            style={{ transitionDelay: `${i * 0.09}s` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={w.img} alt={w.title} loading="lazy" />

            {w.featured && (
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
                {w.tags.map((t) => (
                  <span key={t} className="work__tag">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
