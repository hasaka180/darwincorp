import { NextResponse } from "next/server"
import { clientIp, makeThrottle } from "@/lib/mailer"
import { returnOrigin, stripe, stripeConfigured, type CheckoutSession } from "@/lib/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Starts a Stripe-hosted Checkout for STRIPE_PRICE_ID.
 *
 * The /pay page posts a plain HTML form here, so it works without JavaScript:
 * on success we answer 303 straight to Stripe's checkout page, on failure 303
 * back to /pay with an error flag.
 */

const throttle = makeThrottle(10, 10 * 60 * 1000)

export async function POST(req: Request) {
  const origin = returnOrigin(req)
  const back = (reason: string) => NextResponse.redirect(`${origin}/pay?error=${reason}`, 303)

  if (!stripeConfigured()) return back("unavailable")
  if (throttle(clientIp(req))) return back("busy")

  try {
    const session = await stripe<CheckoutSession>("POST", "/checkout/sessions", {
      mode: "payment",
      ui_mode: "hosted_page",
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${origin}/pay/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pay?cancelled=1`,
      billing_address_collection: "auto",
      allow_promotion_codes: false,
      submit_type: "auto",
    })
    if (!session.url) return back("failed")
    return NextResponse.redirect(session.url, 303)
  } catch (err) {
    console.error("[checkout] could not create session:", err)
    return back("failed")
  }
}
