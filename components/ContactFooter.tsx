"use client";

import { useRef, useState } from "react";
import useNearViewport from "@/components/useNearViewport";
import dynamic from "next/dynamic";
import Link from "next/link";
import SceneBoundary from "@/components/SceneBoundary";
import { SOCIALS } from "@/components/ContactSection";
import CookieSettingsButton from "@/components/CookieSettingsButton";
import { track } from "@/lib/analytics";
import { BRIEF_EMAIL_KEY, landingSummary } from "@/lib/attribution";

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
      { label: "About Darwin", href: "/about" },
      { label: "Work", href: "/work" },
      { label: "Services", href: "/services" },
      { label: "Journal", href: "/journal" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Explore",
    items: [
      { label: "Industries", href: "/industries" },
      { label: "Locations", href: "/locations" },
      { label: "Pricing", href: "/pricing" },
      { label: "Free tools", href: "/tools" },
      { label: "Our process", href: "/process" },
      { label: "Technologies", href: "/technologies" },
      { label: "FAQs", href: "/faq" },
      { label: "Start a project", href: "/start-a-project" },
    ],
  },
  // Was "Legal", which repeated the bottom bar's Privacy / Terms / Cookies.
  // Every page now links straight to the main service pages instead.
  {
    title: "Services",
    items: [
      { label: "Website design & development", href: "/services/website-development" },
      { label: "Brand identity", href: "/services/brand-identity" },
      { label: "UI/UX design", href: "/services/ui-ux-design" },
      { label: "Website redesign", href: "/services/website-redesign" },
      { label: "Motion design", href: "/services/motion-design" },
      { label: "AI creatives", href: "/services/ai-creatives" },
    ],
  },
  {
    title: "Find us on",
    items: [
      { label: "Behance", href: "https://www.behance.net/darwincorp", ext: true },
      { label: "Dribbble", href: "https://dribbble.com/darwin-corp", ext: true },
      { label: "Clutch", href: "https://clutch.co/profile/darwin-corp", ext: true },
      { label: "Sortlist", href: "https://www.sortlist.com/agency/darwin-corp-llcfz", ext: true },
      { label: "GoodFirms", href: "https://www.goodfirms.co/company/darwin-corp-llcfz", ext: true },
      { label: "DesignRush", href: "https://www.designrush.com/agency/profile/darwin-corp-llcfz", ext: true },
      { label: "TechBehemoths", href: "https://techbehemoths.com/company/darwin-corp-llcfz", ext: true },
      { label: "Invest Emirates", href: "https://invest-emirates.ae/directory/advertising-and-marketing/darwin-corp-llcfz", ext: true },
      { label: "Get Listed UAE", href: "https://getlisteduae.com/listings/darwin-corp-llcfz", ext: true },
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
  const sectionRef = useRef<HTMLElement>(null);
  const nearViewport = useNearViewport(sectionRef);
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
        body: JSON.stringify({ email, website, source: "footer", landing: landingSummary() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setState("idle");
        return;
      }
      setState("done");
      track("generate_lead", { form_source: "footer", lead_type: "email_only" });
      // Lets the brief form start with this address already filled in.
      try { window.sessionStorage.setItem(BRIEF_EMAIL_KEY, email.trim()); } catch { /* storage blocked */ }
    } catch {
      setError("Network error. Please check your connection and try again.");
      setState("idle");
    }
  };

  return (
    <section ref={sectionRef} className={`contact ${hideCta ? "contact--nocta" : ""}`} id="newsletter">
      <SceneBoundary>
        {nearViewport && <FooterScene />}
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
              {state === "done" ? "Sent ✓" : state === "sending" ? "Sending…" : "Get in touch"}
            </button>
          </form>
          {/* This form used to promise a newsletter that does not exist, so a
              visitor with a project was told "you're on the list". It is now
              what the heading says: the start of an enquiry. */}
          <p className="contact__note" role={error ? "alert" : "status"}>
            {error ||
              (state === "done" ? (
                <>
                  Thanks, we&apos;ll reply within one business day.{" "}
                  <Link href="/start-a-project" className="contact__note-link">Add project details</Link> for a faster, more useful answer.
                </>
              ) : (
                "Leave your email and we’ll reply within one business day. No newsletters, no spam."
              ))}
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
          {/* Directory badges, kept as each directory's embed code (their link,
              hosted image and any data attribute) so their checks can find
              them. All are followed links, which the directories require. */}
          <div className="footer__badges">
            <a
              className="footer__badge"
              href="https://marketingdubai.ae/agencies/darwin-corp"
              title="Darwin Corp on Marketing Dubai"
              target="_blank"
              rel="noopener"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://marketingdubai.ae/badge/darwin-corp.svg"
                alt="Listed on Marketing Dubai"
                width={220}
                height={60}
                loading="lazy"
              />
            </a>
            <a
              className="footer__badge footer__badge--card"
              href="https://techbehemoths.com/company/darwin-corp-llcfz"
              target="_blank"
              rel="noopener"
              data-techbehemoths-verification=""
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://cdn.techbehemoths.com/public/static/validation/tb-verified-logo.svg"
                alt="TechBehemoths Verification"
                loading="lazy"
              />
            </a>
            <a
              className="footer__badge footer__badge--card"
              href="https://invest-emirates.ae/directory/advertising-and-marketing/darwin-corp-llcfz"
              title="Darwin Corp on Invest Emirates"
              target="_blank"
              rel="noopener"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/badges/invest-emirates.svg"
                alt="Listed on Invest Emirates"
                width={759}
                height={112}
                loading="lazy"
              />
            </a>
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
