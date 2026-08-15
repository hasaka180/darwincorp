"use client";

import { useEffect, useRef } from "react";

const STATS = [
  { num: "40+", label: "Brands Shaped" },
  { num: "15", label: "Countries Served" },
  { num: "98%", label: "Client Retention" },
];

function Globe() {
  // Front-facing wireframe globe with Dubai marked (upper-right ~25°N, 55°E).
  return (
    <svg className="globe" viewBox="0 0 200 200" aria-label="Globe, based in Dubai">
      <circle cx="100" cy="100" r="88" className="globe__edge" />
      {/* latitudes */}
      {[74, 52, 27].map((ry) => (
        <ellipse key={`lat${ry}`} cx="100" cy="100" rx="88" ry={ry} className="globe__line" />
      ))}
      <line x1="12" y1="100" x2="188" y2="100" className="globe__line" />
      {/* longitudes */}
      {[70, 46, 22].map((rx) => (
        <ellipse key={`lon${rx}`} cx="100" cy="100" rx={rx} ry="88" className="globe__line" />
      ))}
      <line x1="100" y1="12" x2="100" y2="188" className="globe__line" />
      {/* Dubai marker */}
      <circle cx="138" cy="74" r="9" className="globe__pin-halo" />
      <circle cx="138" cy="74" r="3.4" className="globe__pin" />
      <line x1="138" y1="74" x2="170" y2="46" className="globe__leader" />
      <text x="172" y="44" className="globe__label">Dubai</text>
    </svg>
  );
}

export default function About() {
  const carouselRef = useRef<HTMLDivElement>(null);

  // Autoplay the mobile card carousel — advance one full card at a time.
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const mq = window.matchMedia("(max-width: 900px)");
    let paused = false;
    const onDown = () => { paused = true; };
    const onUp = () => { setTimeout(() => (paused = false), 5000); };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);

    const id = setInterval(() => {
      if (!mq.matches || paused) return;
      const first = el.firstElementChild as HTMLElement | null;
      const step = first ? first.getBoundingClientRect().width + 16 : el.clientWidth;
      const max = el.scrollWidth - el.clientWidth;
      const next = el.scrollLeft + step > max + 4 ? 0 : el.scrollLeft + step;
      el.scrollTo({ left: next, behavior: "smooth" });
    }, 4200);

    return () => {
      clearInterval(id);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <section className="about" data-theme="light">
      <div className="about__grid">
        <div className="about__stats">
          {STATS.map((s) => (
            <div key={s.label} className="about__stat">
              <span className="about__stat-num">{s.num}</span>
              <span className="about__stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="about__cards" ref={carouselRef}>
        <a
          className="about__card about__brand"
          href="https://dubaiography.com"
          target="_blank"
          rel="noreferrer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="about__brand-img"
            src="/assets/dubaiography.webp"
            alt="Dubaiography"
            loading="lazy"
          />
          <div className="about__brand-overlay">
            <h3>dubaiography.com</h3>
            <span className="about__learn">Visit site →</span>
          </div>
        </a>

        <div className="about__card about__globe-card">
          <div className="about__globe-head">
            <span className="about__loc">Based in Dubai, UAE</span>
            <span className="about__status">
              <i className="about__dot" /> Available Worldwide
            </span>
          </div>
          <Globe />
        </div>

        <div className="about__card about__founder">
          <div className="about__founder-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/hasaka.webp" alt="Hasaka" loading="lazy" />
            <span className="about__founder-name">
              <strong>Hasaka Wijenarayana</strong>
              <span>Founder &amp; Creative Director</span>
            </span>
          </div>
          <div className="about__founder-body">
            <h3>The Founder</h3>
            <p>
              I build things I believe should exist. Darwin Corp is my pursuit of
              work that&apos;s genuinely innovative — products, brands, and
              experiences (like Dubaiography) that move people and leave the world
              a little better than I found it.
            </p>
            <p>
              I hold to the idea Steve Jobs lived by: the people crazy enough to
              think they can change the world are the ones who do. Every project is
              a chance to contribute something that lasts — crafted with intent,
              built with soul, and never settling for ordinary.
            </p>
            <a className="about__learn" href="https://hasaka.io" target="_blank" rel="noreferrer">Learn more →</a>
          </div>
        </div>

        <div className="about__card about__expert">
          <span className="about__brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2c.7 4.8 4.5 8.6 9.3 9.3-4.8.7-8.6 4.5-9.3 9.3-.7-4.8-4.5-8.6-9.3-9.3C7.5 10.6 11.3 6.8 12 2Z" />
            </svg>
          </span>
          <div className="about__card-foot">
            <h3>Spline &amp; Motion Studio</h3>
            <span className="about__learn">Learn More →</span>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
