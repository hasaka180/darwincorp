import ContactFooter from "@/components/ContactFooter";
import CareersBoard from "@/components/CareersBoard";
import { ROLES } from "@/lib/careers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thedarwin.co";

export const metadata = {
  title: "Careers",
  description:
    "Open roles at Darwin Corp, a creative studio in Dubai. We're hiring a project manager, motion designer, junior graphic designer and a vibe coder.",
  alternates: { canonical: "/careers" },
};

const EMPLOYMENT_TYPES: Record<string, string> = {
  "Full-time": "FULL_TIME",
  Freelance: "CONTRACTOR",
  "Project-based": "CONTRACTOR",
};

export default function CareersPage() {
  // One JobPosting per opening, so the roles can surface in job search results.
  const jsonLd = ROLES.map((role) => {
    const remote = role.modes.includes("Remote");
    return {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: role.title,
      description: `${role.about} Responsibilities: ${role.responsibilities.join(" ")} Requirements: ${role.requirements.join(" ")}`,
      datePosted: role.posted,
      validThrough: role.validThrough,
      employmentType: [...new Set(role.types.map((t) => EMPLOYMENT_TYPES[t]))],
      hiringOrganization: {
        "@type": "Organization",
        name: "Darwin Corp",
        sameAs: SITE_URL,
      },
      identifier: {
        "@type": "PropertyValue",
        name: "Darwin Corp",
        value: role.slug,
      },
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Dubai",
          addressCountry: "AE",
        },
      },
      // Google rejects TELECOMMUTE unless it is paired with the countries an
      // applicant may work from, so the two are always emitted together.
      ...(remote
        ? {
            jobLocationType: "TELECOMMUTE",
            applicantLocationRequirements: (role.applicantCountries ?? ["AE"]).map(
              (country) => ({ "@type": "Country", name: country }),
            ),
          }
        : {}),
      directApply: true,
      url: `${SITE_URL}/careers#${role.slug}`,
    };
  });

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
