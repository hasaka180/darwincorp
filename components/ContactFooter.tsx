"use client";

import { useState } from "react";

const LINKS = [
  {
    title: "Studio",
    items: ["Work", "Services", "Process", "About"],
  },
  {
    title: "Connect",
    items: ["Instagram", "LinkedIn", "Behance", "Dribbble"],
  },
  {
    title: "Contact",
    items: ["hello@thedarwin.co", "Dubai, UAE", "Available Worldwide"],
  },
];

export default function ContactFooter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSent(true);
  };

  return (
    <section className="contact" id="contact">
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
                  <li key={it}>
                    <a href="#">{it}</a>
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
