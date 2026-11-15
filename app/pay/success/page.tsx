import Link from "next/link";
import type { Metadata } from "next";
import { formatAmount, stripe, type CheckoutSession } from "@/lib/stripe";
import styles from "../pay.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment received",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ session_id?: string }> };

async function loadSession(id: string | undefined) {
  if (!id || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return null;
  try {
    return await stripe<CheckoutSession>("GET", `/checkout/sessions/${id}`);
  } catch (err) {
    console.error("[pay/success] could not load session:", err);
    return null;
  }
}

export default async function PaySuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;
  const session = await loadSession(session_id);
  const paid = session?.status === "complete" && session.payment_status === "paid";
  const processing = session?.status === "complete" && session.payment_status === "unpaid";

  return (
    <main className={styles.page}>
      <section className={styles.wrap} data-theme="light">
        <span className={styles.label}>[ {paid ? "Payment received" : processing ? "Payment processing" : "Payment"} ]</span>
        <h1 className={styles.title}>{paid ? "Thank you." : processing ? "Almost there." : "We couldn't confirm this payment."}</h1>

        {paid && session && (
          <div className={styles.card}>
            <div className={styles.product}>
              <h2>Paid</h2>
              <span className={styles.amount}>{formatAmount(session.amount_total, session.currency)}</span>
              {session.customer_details?.email && (
                <p>A receipt is on its way to {session.customer_details.email}.</p>
              )}
            </div>
            <p className={styles.fine}>
              We&rsquo;ve been notified and will be in touch shortly. Questions? Email{" "}
              <a href="mailto:hello@thedarwin.co">hello@thedarwin.co</a>.
            </p>
          </div>
        )}

        {processing && (
          <p className={styles.lead}>
            Your payment has been submitted and is being processed by your bank. We&rsquo;ll confirm by email once it clears.
          </p>
        )}

        {!paid && !processing && (
          <p className={styles.lead}>
            If you were charged, you&rsquo;ll receive a Stripe receipt by email. Otherwise, contact us at{" "}
            <a href="mailto:hello@thedarwin.co">hello@thedarwin.co</a> and we&rsquo;ll sort it out.
          </p>
        )}

        <Link className={styles.textLink} href="/">Back to the homepage</Link>
      </section>
    </main>
  );
}
