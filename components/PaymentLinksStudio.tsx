"use client";

import { useEffect, useState } from "react";
import type { PaymentLink } from "@/lib/stripe";
import styles from "./PaymentLinksStudio.module.css";

const CURRENCIES = ["AED", "USD", "EUR", "GBP", "SAR"];

/** The link to send: Stripe prefills the client's email when we know it. */
const shareUrl = (link: PaymentLink) =>
  link.metadata.email ? `${link.url}?prefilled_email=${encodeURIComponent(link.metadata.email)}` : link.url;

function status(link: PaymentLink) {
  if ((link.restrictions?.completed_sessions.count ?? 0) > 0) return { label: "Paid", tone: styles.paid };
  if (!link.active) return { label: "Off", tone: styles.off };
  return { label: "Awaiting payment", tone: styles.open };
}

export default function PaymentLinksStudio() {
  const [form, setForm] = useState({ description: "", amount: "", currency: "AED", client: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<PaymentLink | null>(null);
  const [links, setLinks] = useState<PaymentLink[] | null>(null);
  const [copied, setCopied] = useState("");

  const load = () =>
    fetch("/api/payment-links")
      .then((r) => r.json())
      .then((d) => (d.ok ? setLinks(d.links) : setError(d.error)))
      .catch(() => setError("Could not load links."));

  useEffect(() => { load(); }, []);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function post(body: object) {
    const res = await fetch("/api/payment-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(""); setCreated(null);
    try {
      const d = await post(form);
      if (!d.ok) return setError(d.error);
      setCreated(d.link);
      setForm((f) => ({ ...f, description: "", amount: "", client: "", email: "" }));
      load();
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function deactivate(link: PaymentLink) {
    if (!window.confirm(`Switch off the link for "${link.metadata.description}"? The client won't be able to pay with it.`)) return;
    const d = await post({ deactivate: link.id });
    if (!d.ok) return setError(d.error);
    load();
  }

  async function copy(link: PaymentLink) {
    await navigator.clipboard.writeText(shareUrl(link));
    setCopied(link.id);
    setTimeout(() => setCopied(""), 1800);
  }

  return (
    <main className={styles.page}>
      <span className={styles.label}>[ Studio · Payments ]</span>
      <h1 className={styles.title}>Client payment links</h1>
      <p className={styles.lead}>
        Enter the amount you&rsquo;ve agreed, create the link and send it to the client. Each link takes one payment,
        never expires, and switches itself off once paid. You&rsquo;ll get an email when it&rsquo;s paid.
      </p>

      <form className={styles.form} onSubmit={create}>
        <label className={styles.wide}>
          <span>What it&rsquo;s for</span>
          <input value={form.description} onChange={set("description")} placeholder="Website design — 50% deposit" maxLength={200} required />
        </label>
        <label>
          <span>Amount</span>
          <input value={form.amount} onChange={set("amount")} placeholder="2500" inputMode="decimal" required />
        </label>
        <label>
          <span>Currency</span>
          <select value={form.currency} onChange={set("currency")}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>
          <span>Client <em>(optional)</em></span>
          <input value={form.client} onChange={set("client")} placeholder="Acme LLC" maxLength={120} />
        </label>
        <label>
          <span>Client email <em>(optional, prefilled at checkout)</em></span>
          <input type="email" value={form.email} onChange={set("email")} placeholder="client@example.com" />
        </label>
        <button className={styles.button} disabled={busy}>{busy ? "Creating…" : "Create payment link"}</button>
      </form>

      {error && <p className={styles.error} role="alert">{error}</p>}

      {created && (
        <div className={styles.created} role="status">
          <span>Link ready — {created.metadata.amount} for {created.metadata.description}</span>
          <div className={styles.urlRow}>
            <code>{shareUrl(created)}</code>
            <button type="button" onClick={() => copy(created)}>{copied === created.id ? "Copied" : "Copy"}</button>
          </div>
        </div>
      )}

      <h2 className={styles.subhead}>Recent links</h2>
      {links === null ? (
        <p className={styles.muted}>Loading…</p>
      ) : links.length === 0 ? (
        <p className={styles.muted}>No links yet.</p>
      ) : (
        <ul className={styles.list}>
          {links.map((link) => {
            const s = status(link);
            return (
              <li key={link.id}>
                <div>
                  <strong>{link.metadata.description || "(Created outside the studio)"}</strong>
                  <span className={styles.muted}>
                    {[link.metadata.amount, link.metadata.client, link.metadata.email].filter(Boolean).join(" · ")}
                  </span>
                </div>
                <span className={`${styles.badge} ${s.tone}`}>{s.label}</span>
                <div className={styles.actions}>
                  {link.active && <button type="button" onClick={() => copy(link)}>{copied === link.id ? "Copied" : "Copy link"}</button>}
                  {link.active && <button type="button" onClick={() => deactivate(link)}>Switch off</button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
