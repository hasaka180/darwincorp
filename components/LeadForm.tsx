"use client";

import { useState } from "react";

/** Country dial codes — UAE first, then the rest of the usual traffic. */
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
  { c: "+880", n: "Bangladesh", f: "🇧🇩" },
  { c: "+61", n: "Australia", f: "🇦🇺" },
  { c: "+64", n: "New Zealand", f: "🇳🇿" },
  { c: "+49", n: "Germany", f: "🇩🇪" },
  { c: "+33", n: "France", f: "🇫🇷" },
  { c: "+39", n: "Italy", f: "🇮🇹" },
  { c: "+34", n: "Spain", f: "🇪🇸" },
  { c: "+31", n: "Netherlands", f: "🇳🇱" },
  { c: "+41", n: "Switzerland", f: "🇨🇭" },
  { c: "+46", n: "Sweden", f: "🇸🇪" },
  { c: "+353", n: "Ireland", f: "🇮🇪" },
  { c: "+65", n: "Singapore", f: "🇸🇬" },
  { c: "+60", n: "Malaysia", f: "🇲🇾" },
  { c: "+62", n: "Indonesia", f: "🇮🇩" },
  { c: "+20", n: "Egypt", f: "🇪🇬" },
  { c: "+27", n: "South Africa", f: "🇿🇦" },
  { c: "+234", n: "Nigeria", f: "🇳🇬" },
  { c: "+90", n: "Türkiye", f: "🇹🇷" },
  { c: "+7", n: "Russia", f: "🇷🇺" },
  { c: "+86", n: "China", f: "🇨🇳" },
  { c: "+81", n: "Japan", f: "🇯🇵" },
  { c: "+55", n: "Brazil", f: "🇧🇷" },
];

export default function LeadForm({
  source = "lp/websites",
  cx = "lpw",
  title = "Claim the seasonal rate",
  sub = "Leave your details, we'll be in touch within one business day.",
  submitLabel = "Claim the seasonal rate",
  onDone,
}: {
  source?: string;
  /** BEM prefix for the markup, so a host can bring its own styles. */
  cx?: string;
  title?: string;
  sub?: string;
  submitLabel?: string;
  /** Fired once the lead has been accepted. */
  onDone?: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cc, setCc] = useState("+971");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setError("");
    setState("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, cc, phone, website, source }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setState("idle");
        return;
      }
      setState("done");
      onDone?.();
    } catch {
      setError("Network error. Please check your connection and try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className={`${cx}__form`}>
        <div className={`${cx}__done`}>
          <div className={`${cx}__done-tick`}>
            <svg viewBox="0 0 24 24">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </div>
          <h3>Got it, {name.split(" ")[0] || "thanks"}.</h3>
          <p>
            Your details are with us. We&apos;ll call or WhatsApp you on{" "}
            {cc} {phone} within one business day to book your free 15-minute
            strategy call.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className={`${cx}__form`} onSubmit={onSubmit} noValidate>
      <h2 className={`${cx}__form-title`}>{title}</h2>
      <p className={`${cx}__form-sub`}>{sub}</p>

      <label className={`${cx}__field`}>
        <span className={`${cx}__label`}>Full name</span>
        <input
          className={`${cx}__input`}
          type="text"
          name="name"
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <label className={`${cx}__field`}>
        <span className={`${cx}__label`}>Email</span>
        <input
          className={`${cx}__input`}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <div className={`${cx}__field`}>
        <span className={`${cx}__label`}>Phone number</span>
        <div className={`${cx}__phone`}>
          <select
            className={`${cx}__select`}
            name="cc"
            aria-label="Country code"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
          >
            {CODES.map((o) => (
              <option key={o.c + o.n} value={o.c}>
                {o.f} {o.c}
              </option>
            ))}
          </select>
          <input
            className={`${cx}__input`}
            type="tel"
            name="phone"
            autoComplete="tel-national"
            inputMode="tel"
            placeholder="50 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
      </div>

      {/* honeypot — hidden from humans, catches bots */}
      <input
        className={`${cx}__hp`}
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />

      <button className={`${cx}__submit`} type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : submitLabel}
      </button>

      {error && <p className={`${cx}__error`}>{error}</p>}
    </form>
  );
}
