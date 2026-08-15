"use client";

import { useState } from "react";
import Link from "next/link";

type Item = { label: string; href: string | null; ext?: boolean };
const LINKS: { title: string; items: Item[] }[] = [
  {
    title: "Studio",
    items: [
      { label: "Work", href: "/work" },
      { label: "Services", href: "/services" },
      { label: "Journal", href: "/journal" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Connect",
    items: [
      { label: "Instagram", href: "https://www.instagram.com/thedarwin_co/", ext: true },
      { label: "Facebook", href: "https://www.facebook.com/thedarwincorp", ext: true },
      { label: "LinkedIn", href: "https://www.linkedin.com/company/darwinco/", ext: true },
    ],
  },
  {
    title: "Contact",
    items: [
      { label: "hello@thedarwin.co", href: "mailto:hello@thedarwin.co", ext: true },
      { label: "+971 55 535 5897", href: "https://wa.me/971555355897", ext: true },
      { label: "Dubai, UAE", href: null },
    ],
  },
];

function FooterLink({ item }: { item: Item }) {
  if (!item.href) return <span>{item.label}</span>;
  if (item.ext)
    return (
      <a href={item.href} target="_blank" rel="noreferrer">
        {item.label}
      </a>
    );
  return <Link href={item.href}>{item.label}</Link>;
}

export default function ContactFooter({ hideCta = false }: { hideCta?: boolean }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSent(true);
  };

  return (
    <section className={`contact ${hideCta ? "contact--nocta" : ""}`} id="newsletter">
      {!hideCta && (
        <div className="contact__cta">
          <span className="contact__eyebrow">Let&apos;s work together</span>
          <h2 className="contact__title">
            Have a project in mind?
            <br />
            Let&apos;s make it move.
          </h2>

          <form className="contact__form" onSubmit={submit}>
            <input
              type="email"
              className="contact__input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email address"
            />
            <button type="submit" className="contact__btn">
              {sent ? "Subscribed ✓" : "Get in touch"}
            </button>
          </form>
          <p className="contact__note">
            Join the newsletter — occasional notes on brand, motion, and craft. No
            spam.
          </p>
        </div>
      )}

      <footer className="footer">
        <div className="footer__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/darwin.svg" alt="Darwin Corp" className="footer__logo" />
          <p className="footer__tagline">
            Darwin Corp — a motion-first brand &amp; product studio based in
            Dubai, working worldwide. Dubaiography is a Darwin Corp product.
          </p>
        </div>

        <div className="footer__cols">
          {LINKS.map((col) => (
            <div key={col.title} className="footer__col">
              <span className="footer__col-title">{col.title}</span>
              <ul>
                {col.items.map((it) => (
                  <li key={it.label}>
                    <FooterLink item={it} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} Darwin Corp. All rights reserved.</span>
          <span className="footer__bottom-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </span>
        </div>
      </footer>
    </section>
  );
}
