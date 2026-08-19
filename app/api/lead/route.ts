import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Landing-page lead capture.
 *
 * POST { name, email, cc, phone, company?, source?, website? }
 *   `website` is a honeypot — real users never fill it, bots do.
 *
 * Delivery uses Resend's REST API (no extra dependency, just fetch):
 *   RESEND_API_KEY   → https://resend.com → API Keys
 *   LEAD_TO_EMAIL    → inbox that receives the leads
 *   LEAD_FROM_EMAIL  → a verified sender on your Resend domain
 */

const TO = process.env.LEAD_TO_EMAIL || "hasakasasaranga@gmail.com";
const FROM = process.env.LEAD_FROM_EMAIL || "Darwin Leads <onboarding@resend.dev>";

/* --- tiny in-memory throttle: 5 submissions per IP per 10 minutes --- */
const WINDOW = 10 * 60 * 1000;
const LIMIT = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > LIMIT;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const str = (k: string) => String(body[k] ?? "").trim().slice(0, 200);
  const name = str("name");
  const email = str("email");
  const cc = str("cc");
  const phone = str("phone");
  const source = str("source") || "landing";

  // Honeypot: pretend everything went fine, send nothing.
  if (str("website")) return NextResponse.json({ ok: true });

  if (!name || !email || !phone) {
    return NextResponse.json(
      { ok: false, error: "Please fill in your name, email and phone number." },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "That email address doesn't look right." },
      { status: 400 }
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Try again in a few minutes." },
      { status: 429 }
    );
  }

  const fullPhone = `${cc} ${phone}`.trim();
  const when = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dubai" });

  const html = `
    <div style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:15px;color:#111">
      <h2 style="margin:0 0 16px;font-size:18px">New website enquiry</h2>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <tr><td style="padding:6px 16px 6px 0;color:#666">Name</td><td><strong>${esc(name)}</strong></td></tr>
        <tr><td style="padding:6px 16px 6px 0;color:#666">Email</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
        <tr><td style="padding:6px 16px 6px 0;color:#666">Phone</td><td><a href="tel:${esc(fullPhone.replace(/\s+/g, ""))}">${esc(fullPhone)}</a></td></tr>
        <tr><td style="padding:6px 16px 6px 0;color:#666">Source</td><td>${esc(source)}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;color:#666">Time</td><td>${esc(when)} (Dubai)</td></tr>
      </table>
      <p style="margin:20px 0 0">
        <a href="https://wa.me/${esc(fullPhone.replace(/[^\d]/g, ""))}"
           style="background:#111;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;display:inline-block">
          WhatsApp ${esc(name)}
        </a>
      </p>
    </div>`;

  const text = [
    "New website enquiry",
    `Name:   ${name}`,
    `Email:  ${email}`,
    `Phone:  ${fullPhone}`,
    `Source: ${source}`,
    `Time:   ${when} (Dubai)`,
  ].join("\n");

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Not configured yet: don't lose the lead, and don't pretend in production.
    console.warn("[lead] RESEND_API_KEY missing — lead not emailed:\n" + text);
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { ok: false, error: "Form is not configured yet. Please email hello@thedarwin.co." },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: true, delivered: false });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      reply_to: email,
      subject: `New website enquiry - ${name}`,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[lead] Resend failed", res.status, detail, "\n" + text);
    return NextResponse.json(
      { ok: false, error: "We couldn't send that just now. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, delivered: true });
}
