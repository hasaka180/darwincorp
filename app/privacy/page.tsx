import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How Darwin Corp, a creative studio in Dubai, collects, uses and protects personal data from enquiries, projects and this website.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          {LEGAL.company} is a brand, web and AI creative studio based in{" "}
          {LEGAL.location}, working with clients worldwide. Dubaiography is a{" "}
          {LEGAL.company} product and is covered by this policy.
        </p>
        <p>
          This policy explains what personal data we collect through{" "}
          {LEGAL.site}, through enquiries and through client projects, why we
          collect it, and what you can ask us to do with it. We are the
          controller of that data, and you can reach us at{" "}
          <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    body: (
      <>
        <p>We only collect what we need to answer you and run a project.</p>
        <ul>
          <li>
            <strong>Enquiry details.</strong> Your name, email address, phone
            number, the service you are interested in and whatever you write in
            your message — submitted through our contact form, a campaign
            landing page, email, WhatsApp or social media.
          </li>
          <li>
            <strong>Newsletter details.</strong> The email address you give us
            if you subscribe to studio notes.
          </li>
          <li>
            <strong>Client and project data.</strong> Billing and contact
            details for the people we work with, plus any material you share
            with us to do the work — brand assets, copy, imagery, research,
            access to accounts or analytics, and feedback on drafts.
          </li>
          <li>
            <strong>Technical data.</strong> Standard server and security logs
            kept by our hosting provider, such as IP address, browser type,
            referring page and timestamps. We use a short-lived record of your
            IP address to rate-limit our lead form against spam.
          </li>
          <li>
            <strong>Cookie data.</strong> Only what is described in our{" "}
            <Link href="/cookies">Cookie Policy</Link>.
          </li>
        </ul>
        <p>
          We do not ask for special category data (health, religion, biometrics
          and the like), and we ask you not to send it to us. We do not buy
          contact lists.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-it",
    title: "How we use it",
    body: (
      <ul>
        <li>To reply to your enquiry and prepare a proposal or estimate.</li>
        <li>
          To deliver, manage and support the work you have engaged us for, and
          to communicate with you about it.
        </li>
        <li>To issue invoices and keep the accounting records the law requires.</li>
        <li>
          To send studio notes and occasional updates, where you have asked for
          them or are an existing client. Every email has an unsubscribe link.
        </li>
        <li>
          To keep the site secure and working — spam prevention, error
          monitoring and abuse protection.
        </li>
        <li>
          To understand, in aggregate, which pages and services people find
          useful, so we can improve the site.
        </li>
      </ul>
    ),
  },
  {
    id: "legal-basis",
    title: "Our legal basis",
    body: (
      <>
        <p>
          We process personal data under the UAE Federal Decree-Law No. 45 of
          2021 on the Protection of Personal Data. Where a visitor or client is
          in the EU or UK, we also apply the equivalent GDPR grounds:
        </p>
        <ul>
          <li>
            <strong>Your consent</strong> — for the newsletter and for any
            optional cookies. You can withdraw it at any time.
          </li>
          <li>
            <strong>Performance of a contract</strong> — to scope, deliver and
            invoice a project.
          </li>
          <li>
            <strong>Legitimate interests</strong> — to answer enquiries, protect
            the site and improve what we offer, balanced against your rights.
          </li>
          <li>
            <strong>Legal obligation</strong> — to retain tax, accounting and
            corporate records.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>
          We do not sell personal data, and we do not share it for anyone
          else&apos;s advertising. We do rely on a small set of service providers
          who process data on our behalf, under contract and only on our
          instructions:
        </p>
        <ul>
          <li>Website hosting and content delivery.</li>
          <li>Our content database and media storage for this site.</li>
          <li>Transactional email delivery, for form submissions sent to our inbox.</li>
          <li>Email, file storage, project management and accounting tools.</li>
          <li>
            Payment processors and banks, which handle their own payment data
            directly — we never store full card details.
          </li>
        </ul>
        <p>
          We may also disclose data where we are legally required to, or to
          establish or defend a legal claim. If our business is ever
          restructured or acquired, data may transfer with it, subject to this
          policy.
        </p>
      </>
    ),
  },
  {
    id: "transfers",
    title: "International transfers",
    body: (
      <p>
        We are based in the UAE and work with clients and suppliers worldwide,
        so your data may be processed outside the country you are in — typically
        in the UAE, the EU or the United States. Where we transfer data
        internationally, we use providers that commit to appropriate safeguards,
        such as standard contractual clauses or an equivalent adequacy
        mechanism.
      </p>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <ul>
        <li>
          <strong>Enquiries that do not become projects</strong> — up to 24
          months, then deleted.
        </li>
        <li>
          <strong>Client and project records</strong> — for the life of the
          engagement and then as long as we may need them for warranty, dispute
          or portfolio purposes.
        </li>
        <li>
          <strong>Invoices and accounting records</strong> — for the period UAE
          law requires, currently at least five years.
        </li>
        <li>
          <strong>Newsletter subscriptions</strong> — until you unsubscribe.
        </li>
        <li>
          <strong>Server and security logs</strong> — a short rolling window,
          typically no more than 90 days.
        </li>
      </ul>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>You can ask us to:</p>
        <ul>
          <li>tell you what personal data we hold about you, and give you a copy;</li>
          <li>correct anything inaccurate or incomplete;</li>
          <li>delete data we no longer have a reason to keep;</li>
          <li>restrict or object to a particular use, including direct marketing;</li>
          <li>transfer your data to another provider in a portable format;</li>
          <li>withdraw consent you previously gave.</li>
        </ul>
        <p>
          Email <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> and we will
          respond within 30 days. We may need to confirm your identity first. If
          you are not satisfied with our answer, you can complain to the UAE
          Data Office or, if you are in the EU or UK, to your local supervisory
          authority.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "How we protect it",
    body: (
      <p>
        The site is served over HTTPS, our admin tools are password-protected,
        and access to client material is limited to the people working on the
        project. We use reputable providers with their own security programmes.
        No system is perfectly secure, so we cannot guarantee absolute security,
        but if a breach ever affects your data we will notify you and the
        relevant authority as the law requires.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        Our services are aimed at businesses, and the site is not directed at
        children under 18. We do not knowingly collect their data. If you
        believe a child has sent us personal data, contact us and we will delete
        it.
      </p>
    ),
  },
  {
    id: "third-party-links",
    title: "Third-party links",
    body: (
      <p>
        Our site and our work link out to other places — Instagram, LinkedIn,
        Facebook, WhatsApp, client sites and the projects in our portfolio. Once
        you follow a link, that site&apos;s own privacy policy applies. We are not
        responsible for their content or their handling of your data.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We update this policy when our practices or the law change. The date at
        the top always reflects the current version. If a change is significant
        we will make it obvious on the site before it takes effect.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      lead="What we collect when you talk to us or use this site, why we collect it, and how to get it back or have it removed."
      sections={SECTIONS}
    />
  );
}
