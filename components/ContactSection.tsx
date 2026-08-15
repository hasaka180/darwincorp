"use client";

import { useState } from "react";

const SERVICES = [
  "Brand Identity",
  "Website Development",
  "AI Creatives",
  "Something else",
];

const CODES = [
  { c: "+971", n: "UAE", f: "🇦🇪" },
  { c: "+966", n: "Saudi Arabia", f: "🇸🇦" },
  { c: "+974", n: "Qatar", f: "🇶🇦" },
  { c: "+973", n: "Bahrain", f: "🇧🇭" },
  { c: "+965", n: "Kuwait", f: "🇰🇼" },
  { c: "+968", n: "Oman", f: "🇴🇲" },
  { c: "+1", n: "USA / Canada", f: "🇺🇸" },
  { c: "+44", n: "UK", f: "🇬🇧" },
  { c: "+91", n: "India", f: "🇮🇳" },
  { c: "+92", n: "Pakistan", f: "🇵🇰" },
  { c: "+94", n: "Sri Lanka", f: "🇱🇰" },
  { c: "+61", n: "Australia", f: "🇦🇺" },
  { c: "+49", n: "Germany", f: "🇩🇪" },
  { c: "+33", n: "France", f: "🇫🇷" },
  { c: "+39", n: "Italy", f: "🇮🇹" },
  { c: "+34", n: "Spain", f: "🇪🇸" },
  { c: "+31", n: "Netherlands", f: "🇳🇱" },
  { c: "+65", n: "Singapore", f: "🇸🇬" },
  { c: "+60", n: "Malaysia", f: "🇲🇾" },
  { c: "+20", n: "Egypt", f: "🇪🇬" },
  { c: "+90", n: "Türkiye", f: "🇹🇷" },
];

export const SOCIALS = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/thedarwin_co/",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/thedarwincorp",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 9V7c0-1 .3-1.5 1.6-1.5H17V2.2C16.6 2.1 15.5 2 14.5 2 11.9 2 10.3 3.6 10.3 6.5V9H8v3.5h2.3V22h3.5v-9.5h2.5L17 9h-3Z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/darwinco/",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.3-.02-2.96-1.8-2.96-1.8 0-2.08 1.4-2.08 2.86V21h-4V9Z" />
      </svg>
    ),
  },
];

export default function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState(SERVICES[0]);
  const [cc, setCc] = useState("+971");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${cc} ${phone}`,
      `Service: ${service}`,
      "",
      message,
    ].join("\n");
    window.location.href = `mailto:hello@thedarwin.co?subject=${encodeURIComponent(
      `New enquiry — ${service}`
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <section className="contactp" data-theme="light" id="contact">
      <div className="contactp__grid">
        <div className="contactp__info reveal-up">
          <span className="contactp__eyebrow">Contact</span>
          <h1 className="contactp__title">Let&apos;s build something.</h1>
          <p className="contactp__lead">
            Tell us about your project — brand, web, or AI creative. We reply
            within a day.
          </p>

          <div className="contactp__details">
            <a className="contactp__detail" href="mailto:hello@thedarwin.co">
              <span className="contactp__detail-label">Email</span>
              hello@thedarwin.co
            </a>
            <a className="contactp__detail" href="https://wa.me/971555355897" target="_blank" rel="noreferrer">
              <span className="contactp__detail-label">Phone / WhatsApp</span>
              +971 55 535 5897
            </a>
            <span className="contactp__detail">
              <span className="contactp__detail-label">Studio</span>
              Dubai, UAE — working worldwide
            </span>
          </div>

          <div className="contactp__socials">
            {SOCIALS.map((s) => (
              <a
                key={s.name}
                className="contactp__social"
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

        <form className="contactp__form reveal-up" onSubmit={onSubmit}>
          <label className="field">
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
          </label>

          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" />
          </label>

          <label className="field">
            <span>Service</span>
            <select value={service} onChange={(e) => setService(e.target.value)}>
              {SERVICES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Contact number</span>
            <div className="field__phone">
              <select value={cc} onChange={(e) => setCc(e.target.value)} aria-label="Country code">
                {CODES.map((o) => (
                  <option key={o.c + o.n} value={o.c}>{o.f} {o.c}</option>
                ))}
              </select>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="50 123 4567" />
            </div>
          </label>

          <label className="field field--full">
            <span>Message</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Tell us a little about the project…" />
          </label>

          <button type="submit" className="contactp__submit">
            {sent ? "Opening email…" : "Send enquiry"}
          </button>
        </form>
      </div>
    </section>
  );
}
