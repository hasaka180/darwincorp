import type { Metadata } from "next";
import LeadForm from "@/components/LeadForm";
import "./landing.css";

export const metadata: Metadata = {
  title: "High Performing Interactive Websites - Darwin Corp",
  description:
    "Interactive, fully custom-coded websites tuned for speed, Google rankings and AI search answers. Leave your details for a free strategy call.",
  robots: { index: false, follow: false },
};

export default function WebsitesLandingPage() {
  return (
    <main className="lpw">
      <div className="lpw__bg" aria-hidden="true" />
      <div className="lpw__streaks" aria-hidden="true" />

      <div className="lpw__inner">
        <img className="lpw__logo" src="/darwin.svg" alt="Darwin" />

        <span className="lpw__eyebrow">We build</span>
        <h1 className="lpw__h1">
          High performing interactive
          <span className="lpw__h1-pixel">Websites</span>
        </h1>

        <LeadForm source="lp/websites" />

        <p className="lpw__fine">
          Offer valid this season only &middot; Free 15-min strategy call, no
          obligation
        </p>

        <div className="lpw__footer">
          <a href="https://thedarwin.co">thedarwin.co</a>
          <span>&middot;</span>
          <a href="mailto:hello@thedarwin.co">hello@thedarwin.co</a>
          <span>&middot;</span>
          <span>Dubai, UAE</span>
        </div>
      </div>
    </main>
  );
}
