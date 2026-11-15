import Link from "next/link";
import type { Metadata } from "next";
import { formatAmount, getPrice, stripeConfigured, type StripePrice } from "@/lib/stripe";
import styles from "./pay.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment",
  description: "Pay Darwin Corp securely through Stripe.",
  alternates: { canonical: "/pay" },
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  unavailable: "Online payment isn't available right now. Please email hello@thedarwin.co and we'll send you a payment link.",
  busy: "Too many attempts. Please wait a few minutes and try again.",
  failed: "We couldn't open the secure checkout. Please try again, or email hello@thedarwin.co.",
};

type Props = { searchParams: Promise<{ cancelled?: string; error?: string }> };

export default async function PayPage({ searchParams }: Props) {
  const { cancelled, error } = await searchParams;

  let price: StripePrice | null = null;
  if (stripeConfigured()) {
    try {
      price = await getPrice();
    } catch (err) {
      console.error("[pay] could not load price:", err);
    }
  }
  const message = error ? ERRORS[error] ?? ERRORS.failed : !price ? ERRORS.unavailable : null;

  return (
    <main className={styles.page}>
      <section className={styles.wrap} data-theme="light">
        <span className={styles.label}>[ Secure payment ]</span>
        <h1 className={styles.title}>Pay Darwin Corp</h1>
        <p className={styles.lead}>
          Checkout is handled by Stripe. Card details go straight to Stripe and never touch our servers.
        </p>

        {cancelled && !error && (
          <p className={styles.notice} role="status">Checkout was cancelled. Nothing has been charged.</p>
        )}
        {message && <p className={`${styles.notice} ${styles.error}`} role="alert">{message}</p>}

        {price && (
          <div className={styles.card}>
            <div className={styles.product}>
              <h2>{price.product.name}</h2>
              <span className={styles.amount}>{formatAmount(price.unit_amount, price.currency)}</span>
              {price.product.description && <p>{price.product.description}</p>}
            </div>

            <form className={styles.form} action="/api/checkout" method="POST">
              <button type="submit" className="cta-btn">
                <span className="cta-btn__fluid" aria-hidden="true" />
                <span className="cta-btn__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M5 12h13M12 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="cta-btn__text">Continue to payment</span>
              </button>
            </form>
            <p className={styles.fine}>
              You&rsquo;ll be taken to Stripe&rsquo;s secure checkout page and returned here afterwards.
            </p>
          </div>
        )}

        <Link className={styles.textLink} href="/contact">Questions about a payment? Contact us</Link>
      </section>
    </main>
  );
}
