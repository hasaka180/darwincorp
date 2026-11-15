import { createHmac, timingSafeEqual } from "node:crypto"

/**
 * Stripe over its REST API — no SDK, just fetch, like the Resend mailer.
 * Configure:
 *   STRIPE_SECRET_KEY      → Dashboard → Developers → API keys (sk_test_… / sk_live_…)
 *   STRIPE_WEBHOOK_SECRET  → Developers → Webhooks → the /api/stripe/webhook endpoint (whsec_…)
 */

/** Pinned so a dashboard upgrade can't change the response shapes under us. */
const STRIPE_VERSION = "2026-10-28.endive"

export const stripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY)

type Params = Record<string, unknown>

/** Stripe wants nested form fields: line_items[0][price]=…, expand[]=… */
function encode(params: Params, prefix = "", out = new URLSearchParams()) {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    const name = prefix ? `${prefix}[${key}]` : key
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item !== null && typeof item === "object") encode(item as Params, `${name}[${i}]`, out)
        else out.append(`${name}[]`, String(item))
      })
    } else if (typeof value === "object") {
      encode(value as Params, name, out)
    } else {
      out.append(name, String(value))
    }
  }
  return out
}

export class StripeError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

export async function stripe<T = Record<string, unknown>>(
  method: "GET" | "POST",
  path: string,
  params: Params = {}
): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new StripeError("STRIPE_SECRET_KEY is not set.", 503)

  const query = encode(params).toString()
  const url = `https://api.stripe.com/v1${path}${method === "GET" && query ? `?${query}` : ""}`
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Stripe-Version": STRIPE_VERSION,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: method === "POST" ? query : undefined,
    cache: "no-store",
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = (data as { error?: { message?: string } }).error?.message || res.statusText
    throw new StripeError(message, res.status)
  }
  return data as T
}

export type CheckoutSession = {
  id: string
  url: string | null
  status: "open" | "complete" | "expired"
  payment_status: "paid" | "unpaid" | "no_payment_required"
  amount_total: number | null
  currency: string | null
  livemode: boolean
  payment_intent: string | null
  customer_details: { email: string | null; name: string | null } | null
  payment_link: string | null
}

/** What we store on each link, so the studio list and the order email can describe it. */
export type LinkMeta = { description: string; client?: string; email?: string; amount: string; currency: string }

export type PaymentLink = {
  id: string
  url: string
  active: boolean
  created?: number
  metadata: Partial<LinkMeta>
  restrictions: { completed_sessions: { count: number; limit: number } } | null
}

/** Currencies offered in the studio. All two-decimal, so amounts are ×100. */
export const CURRENCIES = ["aed", "usd", "eur", "gbp", "sar"] as const

/** "2,500.50" → 250050, or null if it isn't a positive amount with ≤ 2 decimals. */
export function toMinorUnits(input: string) {
  const clean = input.replace(/[,\s]/g, "")
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null
  const minor = Math.round(Number(clean) * 100)
  return minor > 0 && minor <= 99_999_999 ? minor : null
}

// Currencies Stripe counts in whole units rather than cents.
const ZERO_DECIMAL = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
])

export function formatAmount(amount: number | null, currency: string | null) {
  if (amount == null || !currency) return ""
  const value = ZERO_DECIMAL.has(currency.toLowerCase()) ? amount : amount / 100
  return new Intl.NumberFormat("en-AE", { style: "currency", currency: currency.toUpperCase() }).format(value)
}

/**
 * Check the Stripe-Signature header: `t=<unix>,v1=<hex hmac>[,v1=…]`, where
 * the HMAC is SHA-256 of `${t}.${rawBody}` keyed with the endpoint secret.
 * Rejects anything older than five minutes to stop replays.
 */
export function verifyWebhook(rawBody: string, header: string | null, secret: string) {
  if (!header) return false
  const parts = header.split(",").map((p) => p.split("=") as [string, string])
  const timestamp = parts.find(([k]) => k === "t")?.[1]
  const signatures = parts.filter(([k]) => k === "v1").map(([, v]) => v)
  if (!timestamp || signatures.length === 0) return false
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest()
  return signatures.some((sig) => {
    const given = Buffer.from(sig, "hex")
    return given.length === expected.length && timingSafeEqual(given, expected)
  })
}
