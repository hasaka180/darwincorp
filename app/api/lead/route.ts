import { NextResponse } from "next/server";
import { EMAIL_RE, clientIp, escapeHtml as esc, makeThrottle, sendMail } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Enquiry capture — the landing pages, the promo popup and the contact page.
 *
 * POST { name, email, cc, phone, service?, message?, source?, website? }
 *   `website` is a honeypot — real users never fill it, bots do.
 *
 * Delivery and configuration live in lib/mailer.
 */

/* 5 submissions per IP per 10 minutes */
const throttle = makeThrottle(5, 10 * 60 * 1000);

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
  const service = str("service");
  const message = String(body.message ?? "").trim().slice(0, 4000);
  const source = str("source") || "landing";

  // Honeypot: pretend everything went fine, send nothing.
  if (str("website")) return NextResponse.json({ ok: true });

  if (!name || !email || !phone) {
    return NextResponse.json(
      { ok: false, error: "Please fill in your name, email and phone number." },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "That email address doesn't look right." },
      { status: 400 }
    );
  }

  if (throttle(clientIp(req))) {
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
        ${service ? `<tr><td style="padding:6px 16px 6px 0;color:#666">Service</td><td>${esc(service)}</td></tr>` : ""}
        <tr><td style="padding:6px 16px 6px 0;color:#666">Source</td><td>${esc(source)}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;color:#666">Time</td><td>${esc(when)} (Dubai)</td></tr>
      </table>
      ${message ? `<p style="margin:18px 0 0;white-space:pre-wrap">${esc(message)}</p>` : ""}
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
    ...(service ? [`Service: ${service}`] : []),
    `Source: ${source}`,
    `Time:   ${when} (Dubai)`,
    ...(message ? ["", message] : []),
  ].join("\n");

  const result = await sendMail({
    tag: "lead",
    replyTo: email,
    subject: `New website enquiry - ${name}`,
    html,
    text,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, delivered: result.delivered });
}
