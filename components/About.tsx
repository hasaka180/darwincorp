"use client";

import Globe from "@/components/Globe";

const STATS = [
  { num: "40+", label: "Brands Shaped" },
  { num: "15", label: "Countries Served" },
  { num: "98%", label: "Client Retention" },
];

const FOUNDER_SOCIALS = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/hasaka/",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.3-.02-2.96-1.8-2.96-1.8 0-2.08 1.4-2.08 2.86V21h-4V9Z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/thehasaka/",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "X",
    href: "https://x.com/Hasaka_s",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.24 2H21.5l-7.4 8.46L22.82 22h-6.6l-5.17-6.77L5.13 22H1.87l7.91-9.04L1.5 2h6.77l4.67 6.2L18.24 2Zm-1.16 18h1.83L7.03 3.9H5.07L17.08 20Z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/thehasaka",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 9V7c0-1 .3-1.5 1.6-1.5H17V2.2C16.6 2.1 15.5 2 14.5 2 11.9 2 10.3 3.6 10.3 6.5V9H8v3.5h2.3V22h3.5v-9.5h2.5L17 9h-3Z" />
      </svg>
    ),
  },
];

export default function About() {
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

        <div className="about__cards">
        <a
          className="about__card about__brand reveal-up"
          href="https://dubaiography.com"
          target="_blank"
          rel="noreferrer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="about__brand-img"
            src="/assets/city.webp"
            alt="Dubaiography"
            loading="lazy"
          />
          <div className="about__brand-overlay">
            <h3>dubaiography.com</h3>
            <span className="about__learn">Visit site →</span>
          </div>
        </a>

        <div className="about__card about__globe-card reveal-up">
          <div className="about__globe-head">
            <span className="about__loc">Based in Dubai, UAE</span>
            <span className="about__status">
              <i className="about__dot" /> Available Worldwide
            </span>
          </div>
          <Globe />
        </div>

        <div className="about__card about__founder reveal-up">
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
              work that&apos;s genuinely innovative, products, brands, and
              experiences (like Dubaiography) that move people and leave the world
              a little better than I found it.
            </p>
            <p>
              I hold to the idea Steve Jobs lived by: the people crazy enough to
              think they can change the world are the ones who do. Every project is
              a chance to contribute something that lasts, crafted with intent,
              built with soul, and never settling for ordinary.
            </p>
            <div className="about__founder-actions">
              <a className="about__learn" href="https://hasaka.io" target="_blank" rel="noreferrer">Learn more →</a>
              <div className="about__founder-socials">
                {FOUNDER_SOCIALS.map((s) => (
                  <a
                    key={s.name}
                    className="about__founder-social"
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.name}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Shares the brand card's treatment: both are products, so they
            should read as a pair rather than as two different card types. */}
        <a
          className="about__card about__brand about__expert reveal-up"
          href="https://glitchdecoded.com/"
          target="_blank"
          rel="noreferrer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="about__brand-img"
            src="/assets/wallpapermob.jpg"
            alt="Glitch Decoded"
            loading="lazy"
          />
          <div className="about__brand-overlay">
            <h3>Glitch Decoded</h3>
            <span className="about__learn">Visit site →</span>
          </div>
        </a>
        </div>
      </div>
    </section>
  );
}
