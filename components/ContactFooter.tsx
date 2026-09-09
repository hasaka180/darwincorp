"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import SceneBoundary from "@/components/SceneBoundary";
import { SOCIALS } from "@/components/ContactSection";
import CookieSettingsButton from "@/components/CookieSettingsButton";

// Client-only, and behind a boundary: a footer must still render if the GPU
// cannot give the scene a context.
const FooterScene = dynamic(() => import("@/components/FooterScene"), {
  ssr: false,
  loading: () => null,
});

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
    title: "Legal",
    items: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
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
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  // Honeypot: real people leave it empty, bots fill it in.
  const [website, setWebsite] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending" || !email.trim()) return;
    setError("");
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setState("idle");
    }
  };

  return (
    <section className={`contact ${hideCta ? "contact--nocta" : ""}`} id="newsletter">
      <SceneBoundary>
        <FooterScene />
      </SceneBoundary>

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
              disabled={state === "done"}
              aria-label="Email address"
            />
            <input
              className="contact__hp"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
            <button type="submit" className="contact__btn" disabled={state !== "idle"}>
              {state === "done" ? "Subscribed ✓" : state === "sending" ? "Sending…" : "Get in touch"}
            </button>
          </form>
          <p className="contact__note" role={error ? "alert" : undefined}>
            {error ||
              (state === "done"
                ? "Thanks — you're on the list."
                : "Join the newsletter, occasional notes on brand, motion, and craft. No spam.")}
          </p>
        </div>
      )}

      <footer className="footer">
        <div className="footer__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/darwin.svg" alt="Darwin Corp" className="footer__logo" />
          <p className="footer__tagline">
            Darwin Corp, a motion-first brand &amp; product studio based in
            Dubai, working worldwide. Dubaiography is a Darwin Corp product.
          </p>
          <div className="footer__contactline">
            <a href="mailto:hello@thedarwin.co">hello@thedarwin.co</a>
            <a href="https://wa.me/971555355897" target="_blank" rel="noreferrer">
              +971 55 535 5897
            </a>
            <span>Dubai, UAE, working worldwide</span>
          </div>
          <div className="footer__socials">
            {SOCIALS.map((s) => (
              <a
                key={s.name}
                className="footer__social"
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
          <span>
            © {new Date().getFullYear()} Darwin Corp. All rights reserved.
          </span>
          <span className="footer__bottom-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/cookies">Cookies</Link>
            <CookieSettingsButton className="footer__cookie-btn" />
          </span>
        </div>
      </footer>
    </section>
  );
}
