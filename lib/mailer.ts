/**
 * Outbound mail, shared by the lead and subscribe routes.
 *
 * Resend over its REST API — no extra dependency, just fetch. Configure:
 *   RESEND_API_KEY   → https://resend.com → API Keys
 *   LEAD_TO_EMAIL    → inbox(es) that receive form mail, comma-separated
 *   LEAD_FROM_EMAIL  → a verified sender on your Resend domain
 */

export const TO = (process.env.LEAD_TO_EMAIL || "hello@thedarwin.co")
  .split(",")
  .map((a) => a.trim())
  .filter(Boolean)

export const FROM = process.env.LEAD_FROM_EMAIL || "Darwin Leads <onboarding@resend.dev>"

export type SendResult =
  | { ok: true; delivered: boolean }
  | { ok: false; status: number; error: string }

export async function sendMail(opts: {
  subject: string
  html: string
  text: string
  replyTo?: string
  /** Prefixes the server-side log line when delivery is skipped or fails. */
  tag: string
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    // Not configured: log the content so nothing is silently lost, and be
    // honest about it in production rather than showing a false success.
    console.warn(`[${opts.tag}] RESEND_API_KEY missing — not emailed:\n${opts.text}`)
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        status: 503,
        error: "Form is not configured yet. Please email hello@thedarwin.co.",
      }
    }
    return { ok: true, delivered: false }
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: TO,
      reply_to: opts.replyTo,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    console.error(`[${opts.tag}] Resend failed`, res.status, detail, "\n" + opts.text)
    return {
      ok: false,
      status: 502,
      error: "We couldn't send that just now. Please try again.",
    }
  }

  return { ok: true, delivered: true }
}

/** In-memory throttle. Per instance, so it is a speed bump, not a guarantee. */
export function makeThrottle(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>()
  return (ip: string) => {
    const now = Date.now()
    const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs)
    recent.push(now)
    hits.set(ip, recent)
    if (hits.size > 5000) hits.clear()
    return recent.length > limit
  }
}

export function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  )
}

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
