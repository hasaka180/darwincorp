import ContactFooter from "@/components/ContactFooter";
import CareersBoard from "@/components/CareersBoard";
import { ROLES } from "@/lib/careers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thedarwin.co";

export const metadata = {
  title: "Careers",
  description: `Open roles at Darwin Corp, a creative studio in Dubai. We're hiring ${ROLES.map((r) => r.title.toLowerCase()).join(", ")}.`,
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  return (
    <main>
      <section className="subpage" data-theme="light">
        <header className="subpage__head reveal-up">
          <span className="subpage__eyebrow">Careers</span>
          <h1 className="subpage__title">Build with us.</h1>
          <p className="careers__intro">
            Darwin Corp is a small creative studio in Dubai making brands, websites and content
            that earn attention. We hire people who care about craft and want the work to be
            good, not just done. If that sounds like you, apply below.
          </p>
        </header>

        <CareersBoard roles={ROLES} />

        <p className="careers__open">
          Nothing here that fits? Send us your portfolio anyway at{" "}
          <a href="mailto:hello@thedarwin.co">hello@thedarwin.co</a>. Good people are worth
          making room for.
        </p>
      </section>
      <ContactFooter />
    </main>
  );
}
