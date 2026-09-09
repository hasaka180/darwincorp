import { NextResponse } from "next/server"
import { EMAIL_RE, clientIp, escapeHtml, makeThrottle, sendMail } from "@/lib/mailer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Newsletter signup.
 *
 * POST { email, website? }
 *   `website` is a honeypot — real users never fill it, bots do.
 *
 * The address is emailed to LEAD_TO_EMAIL. There is no list integration yet,
 * so this is a record of the signup, not a subscription.
 */

const throttle = makeThrottle(5, 10 * 60 * 1000)

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 })
  }

  const email = String(body.email ?? "").trim().slice(0, 200)

  // Honeypot: pretend everything went fine, send nothing.
  if (String(body.website ?? "").trim()) return NextResponse.json({ ok: true })

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "That email address doesn't look right." },
      { status: 400 }
    )
  }

  if (throttle(clientIp(req))) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Try again in a few minutes." },
      { status: 429 }
    )
  }

  const when = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dubai" })
  const safe = escapeHtml(email)
  const result = await sendMail({
    tag: "subscribe",
    replyTo: email,
    subject: `Newsletter signup - ${email}`,
    html: `
      <div style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:15px;color:#111">
        <h2 style="margin:0 0 16px;font-size:18px">New newsletter signup</h2>
        <p style="margin:0 0 8px"><a href="mailto:${safe}">${safe}</a></p>
        <p style="margin:0;color:#666">${escapeHtml(when)} (Dubai)</p>
      </div>`,
    text: ["New newsletter signup", `Email: ${email}`, `Time:  ${when} (Dubai)`].join("\n"),
  })

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status })
  }
  return NextResponse.json({ ok: true, delivered: result.delivered })
}
