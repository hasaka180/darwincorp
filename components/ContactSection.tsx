"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { BRIEF_EMAIL_KEY, landingSummary } from "@/lib/attribution";

// Project types, matching the service pages. Service CTAs open the brief with
// ?service=<one of these>, so the visitor doesn't have to choose again.
const SERVICES = [
  "Website design & development",
  "Brand identity",
  "Website redesign",
  "UI/UX design",
  "Motion design",
  "AI creatives",
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
  {
    name: "Behance",
    href: "https://www.behance.net/darwincorp",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.2 11.3c.9-.4 1.5-1.2 1.5-2.4C9.7 6.6 8 6 6 6H1v12h5.2c2.1 0 4.1-1 4.1-3.4 0-1.5-.7-2.7-2.1-3.3ZM3.4 8h2.2c.8 0 1.6.2 1.6 1.2 0 .9-.6 1.3-1.4 1.3H3.4V8Zm2.4 7.9H3.4v-3.3h2.5c1 0 1.7.4 1.7 1.6 0 1.2-.8 1.7-1.8 1.7ZM15.1 7h5.3v1.4h-5.3V7Zm2.7 2.8c-2.6 0-4.4 1.9-4.4 4.5 0 2.7 1.7 4.5 4.4 4.5 2 0 3.4-.9 4-2.9h-2.1c-.2.7-1.1 1.1-1.8 1.1-1.3 0-2-.8-2-2.1H22c.2-2.7-1.3-5.1-4.2-5.1Zm-2 3.6c.1-1.1.8-1.8 1.9-1.8 1.2 0 1.7.7 1.8 1.8h-3.7Z" />
      </svg>
    ),
  },
  {
    name: "Dribbble",
    href: "https://dribbble.com/darwin-corp",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.814zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z" />
      </svg>
    ),
  },
];

export default function ContactSection({ projectBrief = false }: { projectBrief?: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [service, setService] = useState(SERVICES[0]);
  const [cc, setCc] = useState("+971");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  // Honeypot: real people leave it empty, bots fill it in.
  const [website, setWebsite] = useState("");

  // Read once after mount (not during render) so the server HTML and the
  // first client render match.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("service");
    const match = SERVICES.find((s) => s.toLowerCase() === wanted?.toLowerCase());
    if (match) setService(match);
    try {
      const saved = window.sessionStorage.getItem(BRIEF_EMAIL_KEY);
      if (saved) setEmail((current) => current || saved);
    } catch {
      /* storage blocked */
    }
  }, []);

  // Posts to the server rather than handing off to mailto: an enquiry should
  // not depend on the visitor having a mail client, and this way it is
  // delivered whether or not they follow through in one.
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;
    setError("");
    setState("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company,
          cc,
          phone,
          service,
          message: projectBrief ? `${message}\n\nBudget: ${budget || "To discuss"}\nTarget launch: ${timeline || "Flexible"}` : message,
          website,
          source: projectBrief ? "start a project page" : "contact page",
          landing: landingSummary(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setState("idle");
        return;
      }
      setState("done");
      // No personal data in analytics: the form, the project type and the
      // page the visit started on, nothing the visitor typed.
      track("generate_lead", {
        form_source: projectBrief ? "start a project page" : "contact page",
        lead_type: projectBrief ? "project_brief" : "contact",
        service: service || undefined,
        landing_page: landingSummary()?.landing_page,
      });
    } catch {
      setError("Network error. Please check your connection and try again.");
      setState("idle");
    }
  };

  return (
    <section className="contactp" data-theme="light" id="contact">
      <div className="contactp__grid">
        <div className="contactp__info reveal-up">
          <span className="contactp__eyebrow">{projectBrief ? "Start a project" : "Contact"}</span>
          <h1 className="contactp__title">{projectBrief ? "Tell us about your next chapter." : "Let’s build something."}</h1>
          <p className="contactp__lead">
            {projectBrief ? "Share what you are building, what needs to change and any requirements you already know. A short brief is enough to start the conversation." : "Tell us about your project, brand, web, or AI creative. We reply within a day."}
          </p>

          <div className="contactp__details" data-track="contact_page">
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
              Dubai, UAE, working worldwide
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
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" autoComplete="name" />
          </label>

          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" autoComplete="email" />
          </label>

          {projectBrief && (
            <label className="field">
              <span>Company (optional)</span>
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company or brand name" autoComplete="organization" maxLength={120} />
            </label>
          )}

          <label className="field">
            <span>{projectBrief ? "Project type" : "Service"}</span>
            <select value={service} onChange={(e) => setService(e.target.value)}>
              {SERVICES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          {/* Full width on the brief, which has an odd number of half-width
              fields once Company is added. */}
          <label className={projectBrief ? "field field--full" : "field"}>
            <span>Contact number</span>
            <div className="field__phone">
              <select value={cc} onChange={(e) => setCc(e.target.value)} aria-label="Country code">
                {CODES.map((o) => (
                  <option key={o.c + o.n} value={o.c}>{o.f} {o.c}</option>
                ))}
              </select>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="50 123 4567" />
            </div>
          </label>

          <label className="field field--full">
            <span>Message</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Tell us a little about the project…" />
          </label>

          {projectBrief && <>
            <label className="field"><span>Budget range (optional)</span><input value={budget} onChange={e => setBudget(e.target.value)} placeholder="Amount and currency, or to discuss" maxLength={120} /></label>
            <label className="field"><span>Target launch (optional)</span><input value={timeline} onChange={e => setTimeline(e.target.value)} placeholder="A date, month or flexible" maxLength={120} /></label>
          </>}

          <input
            className="contactp__hp"
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />

          <button type="submit" className="contactp__submit" disabled={state !== "idle"}>
            {state === "done" ? "Enquiry sent ✓" : state === "sending" ? "Sending…" : "Send enquiry"}
          </button>

          <p className="contactp__privacy">
            We use these details only to reply to your enquiry. See our{" "}
            <Link href="/privacy">privacy policy</Link>.
          </p>

          {(error || state === "done") && (
            <p className="contactp__status" role={error ? "alert" : "status"}>
              {error || "Thanks — we'll be in touch shortly."}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
