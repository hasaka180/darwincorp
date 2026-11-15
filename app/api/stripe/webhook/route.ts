import { NextResponse } from "next/server"
import { escapeHtml, sendMail } from "@/lib/mailer"
import { formatAmount, stripe, verifyWebhook, type CheckoutSession, type PaymentLink } from "@/lib/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Stripe event destination. Subscribe it (Developers → Webhooks) to:
 *   checkout.session.completed
 *   checkout.session.async_payment_succeeded
 *   checkout.session.async_payment_failed
 *
 * A paid order is emailed to LEAD_TO_EMAIL. Stripe retries anything that
 * isn't a 2xx, so we only answer non-2xx when we genuinely want a retry.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Not configured." }, { status: 503 })
  }

  // The signature covers the exact bytes Stripe sent, so read the raw text.
  const raw = await req.text()
  if (!verifyWebhook(raw, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Bad signature." }, { status: 400 })
  }

  const event = JSON.parse(raw) as { id: string; type: string; data: { object: CheckoutSession } }
  const session = event.data.object

  switch (event.type) {
    case "checkout.session.completed":
      // Card payments are paid here; delayed methods (bank transfer) are not
      // yet and arrive later as async_payment_succeeded.
      if (session.payment_status === "paid") await notify(session, "Payment received")
      break
    case "checkout.session.async_payment_succeeded":
      await notify(session, "Payment received")
      break
    case "checkout.session.async_payment_failed":
      await notify(session, "Payment failed")
      break
  }

  return NextResponse.json({ received: true })
}

/** The studio stores what the link was for on the link itself. */
async function linkDetails(session: CheckoutSession) {
  if (!session.payment_link) return null
  try {
    return (await stripe<PaymentLink>("GET", `/payment_links/${session.payment_link}`)).metadata
  } catch (err) {
    console.error(`[stripe-webhook] could not load ${session.payment_link}:`, err)
    return null
  }
}

async function notify(session: CheckoutSession, heading: string) {
  const link = await linkDetails(session)
  const forWhat = [link?.description, link?.client].filter(Boolean).join(" — ")
  const amount = formatAmount(session.amount_total, session.currency)
  const email = session.customer_details?.email || "(no email)"
  const name = session.customer_details?.name || ""
  const dashboard = `https://dashboard.stripe.com/${session.livemode ? "" : "test/"}payments/${session.payment_intent ?? ""}`
  const when = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dubai" })

  const result = await sendMail({
    tag: "stripe-webhook",
    replyTo: session.customer_details?.email || undefined,
    subject: `${heading}: ${amount} from ${name || email}${forWhat ? ` (${forWhat})` : ""}${session.livemode ? "" : " [TEST]"}`,
    html: `
      <div style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:15px;color:#111">
        <h2 style="margin:0 0 16px;font-size:18px">${escapeHtml(heading)}${session.livemode ? "" : " (test mode)"}</h2>
        <p style="margin:0 0 8px"><strong>${escapeHtml(amount)}</strong>${forWhat ? ` for ${escapeHtml(forWhat)}` : ""}</p>
        <p style="margin:0 0 8px">${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
        <p style="margin:0 0 8px"><a href="${escapeHtml(dashboard)}">View in Stripe</a></p>
        <p style="margin:0;color:#666">${escapeHtml(session.id)} · ${escapeHtml(when)} (Dubai)</p>
      </div>`,
    text: [heading, `Amount:  ${amount}`, `For:     ${forWhat || "-"}`, `Name:    ${name}`, `Email:   ${email}`, `Stripe:  ${dashboard}`, `Session: ${session.id}`].join("\n"),
  })
  if (!result.ok) console.error(`[stripe-webhook] email failed for ${session.id}: ${result.error}`)
}
