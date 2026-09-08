"use client";

import { Fragment, useEffect, useRef, useState } from "react";

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

// The brand mark keeps the Handjet lockup the hero uses; the rest of the line
// is the serif.
const BRAND_WORDS = new Set(["Darwin", "Corp,"]);

// Broken by hand so the copy sets as three tapering lines on desktop; the
// breaks are dropped below 900px, where the line wraps on its own.
const BURN_LINES = [
  "From fire to electricity, every breakthrough",
  "began as an idea. At Darwin Corp,",
  "we design what comes next.",
];

// The line burns on word by word as the sticky panel is scrolled through.
const BURN_WORDS = BURN_LINES.flatMap((line, li) =>
  line.split(" ").map((word, wi, words) => ({
    word,
    brand: BRAND_WORDS.has(word),
    br: wi === words.length - 1 && li < BURN_LINES.length - 1,
  }))
);

// Words alight at once, so the flame front is a soft band rather than a
// single word flicking on.
const FLAME_WIDTH = 3.2;

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

/** t = how far this word has burnt in, e = how hot its ember is right now. */
function paintWord(el: HTMLElement, t: number, e: number) {
  el.style.setProperty("--t", t.toFixed(3));
  el.style.setProperty("--e", e.toFixed(3));
}

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
  const burnRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
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

  // Scroll drives the burn: the sticky panel holds the line still while the
  // flame front sweeps across it.
  useEffect(() => {
    const wrap = burnRef.current;
    if (!wrap) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    const update = () => {
      raf = 0;
      const words = wordRefs.current;

      // Nothing to burn through if motion is off — hand over the settled line.
      if (reduce.matches) {
        wrap.style.setProperty("--reveal", "1");
        words.forEach((w) => w && paintWord(w, 1, 0));
        return;
      }

      const rect = wrap.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? clamp01(-rect.top / total) : 0;
      // Finish early so the whole line sits lit and readable before the
      // section scrolls away.
      const burn = clamp01(p / 0.72);
      // The carousel arrives once the line is a little over half lit.
      wrap.style.setProperty("--reveal", clamp01((burn - 0.55) * 3).toFixed(3));

      const front = burn * (words.length + FLAME_WIDTH);
      words.forEach((w, i) => {
        if (!w) return;
        const t = clamp01((front - i) / FLAME_WIDTH);
        // The ember peaks halfway through a word's ignition, then cools to ink.
        paintWord(w, t, 1 - Math.abs(t * 2 - 1));
      });
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // iOS resizes the visual viewport as the URL bar collapses without always
    // firing resize, which would leave the burn stuck a frame behind.
    window.visualViewport?.addEventListener("resize", onScroll);
    window.addEventListener("orientationchange", onScroll);
    reduce.addEventListener("change", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.visualViewport?.removeEventListener("resize", onScroll);
      window.removeEventListener("orientationchange", onScroll);
      reduce.removeEventListener("change", update);
      if (raf) cancelAnimationFrame(raf);
    };
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

      <div ref={burnRef} className="studio__burn">
        <div className="studio__burn-sticky">
          <h2 className="studio__burn-text">
            {BURN_WORDS.map(({ word, brand, br }, i) => (
              <Fragment key={i}>
                <span
                  className={`burn-w${brand ? " burn-w--brand" : ""}`}
                  ref={(el) => {
                    wordRefs.current[i] = el;
                  }}
                >
                  {word}
                </span>{" "}
                {br && <br className="burn-br" />}
              </Fragment>
            ))}
          </h2>

          {/* Rides in under the line once it has caught, so the pinned panel
              is not half empty while the burn plays. */}
          <div className="studio__marquee">
            <div className="studio__track">
              {loop.map((logo, i) => (
                // The set is duplicated for the marquee loop; only the first
                // pass is exposed to assistive tech and crawlers.
                <LogoCard
                  key={i}
                  src={logo.src}
                  name={logo.name}
                  aria-hidden={i >= LOGOS.length}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
