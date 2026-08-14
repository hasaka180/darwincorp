"use client";

import { useState } from "react";

type Item = {
  quoteShort: string;
  authors: { name: string; role: string; img: string }[];
  tag: string;
  headline: string;
  body: string;
};

const ITEMS: Item[] = [
  {
    quoteShort: "They turned our static brand into something alive.",
    authors: [
      {
        name: "Andy Claremont",
        role: "Head of Brand, Northwind",
        img: "https://i.pravatar.cc/120?img=12",
      },
      {
        name: "Bill Schonbrun",
        role: "Founder, Layerhouse",
        img: "https://i.pravatar.cc/120?img=15",
      },
    ],
    tag: "Testimonial",
    headline: "A partner, not just a vendor",
    body: "Tapping into shared vision and craft, the team rebuilt our identity from the ground up — motion-first, meticulously executed, and delivered ahead of schedule. Every decision felt intentional and built to last.",
  },
  {
    quoteShort: "The most seamless launch we've ever had.",
    authors: [
      {
        name: "Sara Meyer",
        role: "CMO, Fielded",
        img: "https://i.pravatar.cc/120?img=32",
      },
      {
        name: "Omar Rahal",
        role: "Product Lead, Kite",
        img: "https://i.pravatar.cc/120?img=52",
      },
    ],
    tag: "Testimonial",
    headline: "Clarity, intent, precision",
    body: "From strategy to build, they stayed deeply involved. The result is a site that finally moves the way our brand should — fast, considered, and genuinely ours.",
  },
];

export default function Testimonials() {
  const [i, setI] = useState(0);
  const t = ITEMS[i];

  return (
    <section className="tst" id="testimonials" data-theme="light">
      <header className="tst__head">
        <span className="tst__eyebrow">Testimonials</span>
        <h2 className="tst__title">Trusted by teams who care about the details</h2>
      </header>

      <div className="tst__card">
        <div className="tst__media">
          <div className="tst__avatars">
            {t.authors.map((a) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={a.name} src={a.img} alt={a.name} loading="lazy" />
            ))}
          </div>
          <p className="tst__quote">{t.quoteShort}</p>
        </div>

        <div className="tst__body">
          <span className="tst__pill">{t.tag}</span>
          <h3 className="tst__body-title">{t.headline}</h3>
          <p className="tst__body-text">{t.body}</p>

          <div className="tst__guests">
            <span className="tst__guests-label">Guests</span>
            {t.authors.map((a) => (
              <span key={a.name} className="tst__guest">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.img} alt={a.name} loading="lazy" />
                <span>
                  <strong>{a.name}</strong>
                  <em>{a.role}</em>
                </span>
              </span>
            ))}
          </div>

          <div className="tst__nav">
            {ITEMS.map((_, idx) => (
              <button
                key={idx}
                className={`tst__dot ${idx === i ? "is-on" : ""}`}
                aria-label={`Testimonial ${idx + 1}`}
                onClick={() => setI(idx)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
