import { NextResponse } from "next/server";
import { EMAIL_RE, clientIp, escapeHtml as esc, makeThrottle, sendMail } from "@/lib/mailer";
import { ROLES } from "@/lib/careers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Careers application capture.
 *
 * POST multipart/form-data { role, name, email, cc, phone, country, mode,
 *   engagement, portfolio?, cover?, resume?, website? }
 *   `website` is a honeypot — real users never fill it, bots do.
 *
 * The CV is emailed as an attachment rather than written to R2: that bucket is
 * public, and a candidate's CV should not be sitting on a guessable URL.
 */

/* 3 applications per IP per 15 minutes */
const throttle = makeThrottle(3, 15 * 60 * 1000);

/* Vercel caps a serverless request body at ~4.5 MB. */
const MAX_RESUME = 4 * 1024 * 1024;

const RESUME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MODES = new Set(["Onsite", "Remote", "Hybrid"]);
const ENGAGEMENTS = new Set(["Full-time", "Freelance", "Project-based"]);

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const str = (k: string, max = 200) => String(form.get(k) ?? "").trim().slice(0, max);
  const role = str("role", 120);
  const name = str("name");
  const email = str("email");
  const cc = str("cc", 8);
  const phone = str("phone", 40);
  const country = str("country", 80);
  const mode = str("mode", 20);
  const engagement = str("engagement", 20);
  const portfolio = str("portfolio", 500);
  const cover = String(form.get("cover") ?? "").trim().slice(0, 6000);

  // Honeypot: pretend everything went fine, send nothing.
  if (str("website")) return NextResponse.json({ ok: true });

  if (!name || !email || !phone || !country) {
    return NextResponse.json(
      { ok: false, error: "Please fill in your name, email, phone number and country." },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "That email address doesn't look right." },
      { status: 400 }
    );
  }
  if (!MODES.has(mode) || !ENGAGEMENTS.has(engagement)) {
    return NextResponse.json(
      { ok: false, error: "Please choose how you'd like to work with us." },
      { status: 400 }
    );
  }

  if (throttle(clientIp(req))) {
    return NextResponse.json(
      { ok: false, error: "Too many applications. Try again in a few minutes." },
      { status: 429 }
    );
  }

  // Resolve against the real openings so the subject line can't be spoofed.
  const known = ROLES.find((r) => r.title === role || r.slug === role);
  const roleLabel = known?.title ?? "General application";

  const resume = form.get("resume");
  const attachments = [];
  let resumeNote = "Not attached";
  if (resume instanceof File && resume.size > 0) {
    if (resume.size > MAX_RESUME) {
      return NextResponse.json(
        { ok: false, error: "That CV is over 4 MB. Please attach a smaller file or send a link." },
        { status: 400 }
      );
    }
    if (!RESUME_TYPES.has(resume.type)) {
      return NextResponse.json(
        { ok: false, error: "Please upload your CV as a PDF or Word document." },
        { status: 400 }
      );
    }
    const buf = Buffer.from(await resume.arrayBuffer());
    // Keep the candidate's filename but strip anything path-like.
    const safeName = (resume.name || "cv.pdf").replace(/[^\w.\- ]+/g, "_").slice(0, 120);
    attachments.push({ filename: safeName, content: buf.toString("base64") });
    resumeNote = `${safeName} (${Math.round(resume.size / 1024)} KB, attached)`;
  } else if (!portfolio) {
    return NextResponse.json(
      { ok: false, error: "Please attach a CV or share a portfolio link." },
      { status: 400 }
    );
  }

  const fullPhone = `${cc} ${phone}`.trim();
  const when = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dubai" });

  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#666;white-space:nowrap">${label}</td><td>${value}</td></tr>`;

  const html = `
    <div style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:15px;color:#111">
      <h2 style="margin:0 0 4px;font-size:18px">New application - ${esc(roleLabel)}</h2>
      <p style="margin:0 0 16px;color:#666">${esc(name)} applied via thedarwin.co/careers</p>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        ${row("Role", `<strong>${esc(roleLabel)}</strong>`)}
        ${row("Name", `<strong>${esc(name)}</strong>`)}
        ${row("Email", `<a href="mailto:${esc(email)}">${esc(email)}</a>`)}
        ${row("Phone", `<a href="tel:${esc(fullPhone.replace(/\s+/g, ""))}">${esc(fullPhone)}</a>`)}
        ${row("Country", esc(country))}
        ${row("Work mode", esc(mode))}
        ${row("Engagement", esc(engagement))}
        ${portfolio ? row("Portfolio", `<a href="${esc(portfolio)}">${esc(portfolio)}</a>`) : ""}
        ${row("CV", esc(resumeNote))}
        ${row("Time", `${esc(when)} (Dubai)`)}
      </table>
      ${
        cover
          ? `<h3 style="margin:22px 0 6px;font-size:14px;color:#666">Cover letter</h3>
             <p style="margin:0;white-space:pre-wrap;line-height:1.6">${esc(cover)}</p>`
          : ""
      }
      <p style="margin:24px 0 0">
        <a href="https://wa.me/${esc(fullPhone.replace(/[^\d]/g, ""))}"
           style="background:#111;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;display:inline-block">
          WhatsApp ${esc(name)}
        </a>
      </p>
    </div>`;

  const text = [
    `New application - ${roleLabel}`,
    `Name:       ${name}`,
    `Email:      ${email}`,
    `Phone:      ${fullPhone}`,
    `Country:    ${country}`,
    `Work mode:  ${mode}`,
    `Engagement: ${engagement}`,
    ...(portfolio ? [`Portfolio:  ${portfolio}`] : []),
    `CV:         ${resumeNote}`,
    `Time:       ${when} (Dubai)`,
    ...(cover ? ["", "Cover letter:", cover] : []),
  ].join("\n");

  const result = await sendMail({
    tag: "apply",
    replyTo: email,
    subject: `Application: ${roleLabel} - ${name}`,
    html,
    text,
    attachments,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, delivered: result.delivered });
}
