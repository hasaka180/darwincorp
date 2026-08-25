"use client";

import { useEffect, useRef, useState } from "react";

// Client logos (public/assets/logos). The name is carried through to alt
// text — these are clients, not decoration, so search engines should be able
// to read who we've worked with.
const LOGOS: { src: string; name: string }[] = [
  ["abcapital", "AB Capital"],
  ["ambitionmentors", "Ambition Mentors"],
  ["archihq", "ArchiHQ"],
  ["capitalcreators", "Capital Creators"],
  ["competence", "Competence"],
  ["crafted", "Crafted"],
  ["ds2dio", "DS2DIO"],
  ["emc", "EMC"],
  ["eqwitty", "Eqwitty"],
  ["ferroic", "Ferroic"],
  ["harpyia", "Harpyia"],
  ["lumara-logo", "Lumara"],
  ["naamche", "Naamche"],
  ["nova", "Nova"],
  ["planville", "Planville"],
  ["prentus", "Prentus"],
  ["radwave", "Radwave"],
  ["sadara", "Sadara"],
  ["sequoya", "Sequoya"],
  ["storworks", "Storworks"],
  ["summaforte", "Summa Forte"],
  ["tantivy", "Tantivy"],
  ["tminus", "T-Minus"],
  ["verde-logo", "Verde"],
].map(([n, name]) => ({ src: `/assets/logos/${n}.png`, name }));

function LogoCard({
  src,
  name,
  "aria-hidden": ariaHidden,
}: {
  src: string
  name: string
  "aria-hidden"?: boolean
}) {
  return (
    <div className="logo-card" aria-hidden={ariaHidden || undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="logo-card__img"
        src={src}
        alt={ariaHidden ? "" : `${name} logo`}
        loading="lazy"
      />
    </div>
  );
}

export default function StudioSection() {
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

  // Duplicate the set so the marquee loops seamlessly.
  const loop = [...LOGOS, ...LOGOS];

  return (
    <section
      ref={ref}
      data-theme="light"
      className={`studio ${inView ? "is-in" : ""}`}
    >
      <div className="studio__meta">
        <span className="studio__meta-item reveal" style={{ transitionDelay: "0s" }}>
          <svg className="studio__star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2c.7 4.8 4.5 8.6 9.3 9.3-4.8.7-8.6 4.5-9.3 9.3-.7-4.8-4.5-8.6-9.3-9.3C7.5 10.6 11.3 6.8 12 2Z" />
          </svg>
          Inside The Studio
        </span>
        <span className="studio__meta-item reveal" style={{ transitionDelay: "0.08s" }}>
          (©19-26)
        </span>
        <span className="studio__meta-item reveal" style={{ transitionDelay: "0.16s" }}>
          (25.2048° N, 55.2708° E)
        </span>
      </div>

      <div className="studio__intro">
        <div className="studio__video reveal" style={{ transitionDelay: "0.1s" }}>
          <video autoPlay muted loop playsInline preload="auto" aria-label="Darwin teaser">
            <source src="/assets/teaser.mp4" type="video/mp4" />
          </video>
        </div>

        <h2 className="studio__headline reveal" style={{ transitionDelay: "0.18s" }}>
          Driven by <em>Strategy,</em> fueled by imagination. We craft
          design-first solutions that help brands stand out in the digital age
        </h2>
      </div>

      <div className="studio__marquee reveal" style={{ transitionDelay: "0.3s" }}>
        <div className="studio__track">
          {loop.map((logo, i) => (
            // The set is duplicated for the marquee loop; only the first pass
            // is exposed to assistive tech and crawlers.
            <LogoCard
              key={i}
              src={logo.src}
              name={logo.name}
              aria-hidden={i >= LOGOS.length}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
