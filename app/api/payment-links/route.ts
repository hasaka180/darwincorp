import { NextResponse } from "next/server"
import { EMAIL_RE } from "@/lib/mailer"
import { SITE_URL } from "@/lib/seo"
import { CURRENCIES, StripeError, formatAmount, stripe, stripeConfigured, toMinorUnits, type PaymentLink } from "@/lib/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Per-client payment links, used from /studio/payments. Password-gated by
 * middleware.ts, like the rest of the studio.
 *
 *   GET                                   → the 25 most recent links
 *   POST { description, amount, currency, client?, email? } → a new single-use link
 *   POST { deactivate: "plink_…" }        → switch a link off
 *
 * Each link is a Stripe Payment Link for a one-off price. It never expires,
 * accepts exactly one payment, then turns itself off. Payment lands on
 * /pay/success, and the webhook emails the order.
 */

const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status })

export async function GET() {
  if (!stripeConfigured()) return fail("STRIPE_SECRET_KEY is not set.", 503)
  try {
    const list = await stripe<{ data: PaymentLink[] }>("GET", "/payment_links", { limit: 25 })
    return NextResponse.json({ ok: true, links: list.data })
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not load links.", err instanceof StripeError ? err.status : 500)
  }
}

export async function POST(req: Request) {
  if (!stripeConfigured()) return fail("STRIPE_SECRET_KEY is not set.", 503)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return fail("Bad request.")
  }

  try {
    if (typeof body.deactivate === "string") {
      if (!/^plink_[A-Za-z0-9]+$/.test(body.deactivate)) return fail("Unknown link.")
      const link = await stripe<PaymentLink>("POST", `/payment_links/${body.deactivate}`, { active: false })
      return NextResponse.json({ ok: true, link })
    }

    const description = String(body.description ?? "").trim().slice(0, 200)
    const client = String(body.client ?? "").trim().slice(0, 120)
    const email = String(body.email ?? "").trim().slice(0, 200)
    const currency = String(body.currency ?? "").toLowerCase()
    const amount = toMinorUnits(String(body.amount ?? ""))

    if (!description) return fail("Add a description — the client sees it at checkout.")
    if (amount === null) return fail("Enter an amount like 2500 or 2500.50.")
    if (!(CURRENCIES as readonly string[]).includes(currency)) return fail("Pick a currency.")
    if (email && !EMAIL_RE.test(email)) return fail("That email address doesn't look right.")

    const price = await stripe<{ id: string }>("POST", "/prices", {
      currency,
      unit_amount: amount,
      product_data: { name: description },
    })

    const metadata = { description, client, email, amount: formatAmount(amount, currency), currency }
    const link = await stripe<PaymentLink>("POST", "/payment_links", {
      line_items: [{ price: price.id, quantity: 1 }],
      restrictions: { completed_sessions: { limit: 1 } },
      after_completion: {
        type: "redirect",
        redirect: { url: `${SITE_URL}/pay/success?session_id={CHECKOUT_SESSION_ID}` },
      },
      billing_address_collection: "auto",
      allow_promotion_codes: false,
      submit_type: "pay",
      metadata,
      payment_intent_data: { description: client ? `${description} (${client})` : description, metadata },
    })

    return NextResponse.json({ ok: true, link })
  } catch (err) {
    console.error("[payment-links]", err)
    return fail(err instanceof Error ? err.message : "Stripe error.", err instanceof StripeError ? err.status : 500)
  }
}
