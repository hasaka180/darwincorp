import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata = {
  title: "Terms of Service",
  description:
    "The terms that apply to Darwin Corp's branding, website and AI creative work, and to the use of thedarwin.co.",
  alternates: { canonical: "/terms" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "about",
    title: "About these terms",
    body: (
      <>
        <p>
          These terms apply to the use of {LEGAL.site} and to the creative
          services {LEGAL.company} provides from {LEGAL.location}. By browsing
          the site, sending an enquiry or accepting a proposal, you agree to
          them.
        </p>
        <p>
          Where we sign a separate proposal, statement of work or agreement with
          a client, that document governs the specifics of the project — scope,
          fees, schedule — and these terms fill in everything it does not cover.
          If the two ever conflict, the signed document wins.
        </p>
      </>
    ),
  },
  {
    id: "services",
    title: "Our services",
    body: (
      <p>
        We provide brand strategy and identity, website design and development,
        content and motion production, and AI-assisted creative work. Every
        engagement is defined by its own proposal: what we will deliver, what it
        costs, and roughly when. Anything not written into that proposal is out
        of scope until we agree otherwise in writing.
      </p>
    ),
  },
  {
    id: "engagement",
    title: "Proposals and engagement",
    body: (
      <>
        <p>
          Proposals and quotes are valid for 30 days unless they say otherwise.
          An engagement starts when you accept the proposal in writing and we
          receive the deposit.
        </p>
        <p>
          We book studio time against confirmed projects, so a slot is reserved
          only once both of those are in place.
        </p>
      </>
    ),
  },
  {
    id: "fees",
    title: "Fees and payment",
    body: (
      <ul>
        <li>
          Projects normally run on a deposit of 50% to begin, with the balance
          due on delivery, unless the proposal sets out a different schedule.
        </li>
        <li>
          Retainers and subscriptions are invoiced monthly in advance and
          continue until either side gives 30 days&apos; written notice.
        </li>
        <li>
          Invoices are payable within 14 days. Late payment may pause work and
          delay delivery, and we may charge interest on overdue amounts at 1%
          per month.
        </li>
        <li>
          Fees are exclusive of UAE VAT and of any bank charges, which are
          added where applicable.
        </li>
        <li>
          Third-party costs — fonts, stock imagery, plugins, hosting, domains,
          ad spend, print — are quoted separately and are payable in addition to
          our fees.
        </li>
      </ul>
    ),
  },
  {
    id: "your-part",
    title: "What we need from you",
    body: (
      <>
        <p>Good work depends on the material and access you provide. You agree to:</p>
        <ul>
          <li>
            give us accurate briefs, content and assets, and the access we need
            to do the work;
          </li>
          <li>
            nominate one person who can give feedback and sign off on the
            project&apos;s behalf;
          </li>
          <li>
            respond to review requests within a reasonable time — normally five
            working days;
          </li>
          <li>
            confirm you own, or have licence to use, everything you send us, and
            that it does not infringe anyone else&apos;s rights or break any law.
          </li>
        </ul>
        <p>
          You indemnify us against claims arising from material you supplied or
          instructed us to use.
        </p>
      </>
    ),
  },
  {
    id: "revisions",
    title: "Revisions and scope",
    body: (
      <>
        <p>
          Each proposal includes a set number of revision rounds at defined
          stages. A round means one consolidated set of feedback, not an ongoing
          series of individual notes.
        </p>
        <p>
          New requirements, a change of direction after sign-off, or extra
          rounds are additional work. We will quote them before starting, and we
          will not proceed without your written approval.
        </p>
      </>
    ),
  },
  {
    id: "timelines",
    title: "Timelines",
    body: (
      <p>
        Dates in a proposal are estimates based on prompt feedback and material
        from you. Delays in either shift the schedule accordingly. We are not
        liable for delays caused by circumstances outside our reasonable
        control, including supplier outages, illness, or events of force
        majeure.
      </p>
    ),
  },
  {
    id: "ip",
    title: "Intellectual property",
    body: (
      <>
        <p>
          <strong>Final deliverables.</strong> Once the project is paid in full,
          ownership of the final approved deliverables created specifically for
          you transfers to you, worldwide and in perpetuity.
        </p>
        <p>
          <strong>Until then</strong>, all work remains our property and may not
          be published, used commercially or registered as a trademark.
        </p>
        <p>
          <strong>What stays with us.</strong> Our pre-existing materials —
          methods, templates, code libraries, components, design systems and
          internal tools — remain ours. Where they are embedded in your
          deliverables, you get a perpetual, non-exclusive licence to use them
          as part of that work.
        </p>
        <p>
          <strong>Concepts not selected.</strong> Routes, drafts and working
          files that were not chosen remain ours, and are not included unless
          the proposal says so.
        </p>
        <p>
          <strong>Registration.</strong> Trademark searches and registration are
          your responsibility. We do not warrant that a name or mark is
          available to register in any jurisdiction.
        </p>
      </>
    ),
  },
  {
    id: "portfolio",
    title: "Portfolio and credit",
    body: (
      <p>
        Unless you ask us in writing not to, we may show the work in our
        portfolio, case studies, social channels and award submissions, and
        name you as a client. We will always respect an agreed embargo or
        confidentiality period, and we will never publish anything you have
        marked confidential.
      </p>
    ),
  },
  {
    id: "third-party",
    title: "Third-party materials and services",
    body: (
      <p>
        Projects often rely on fonts, stock assets, plugins, frameworks,
        hosting, domains and platform accounts owned by other companies. These
        carry their own licences, terms and fees, which you are responsible for
        maintaining after handover. We are not liable for their pricing,
        availability, changes or downtime.
      </p>
    ),
  },
  {
    id: "ai",
    title: "AI-assisted work",
    body: (
      <p>
        Some of our services use generative AI tools as part of the production
        process. Where we do, output is directed, reviewed and edited by our
        team before it reaches you. AI-generated material can vary in quality
        and its copyright status differs between jurisdictions, so we cannot
        guarantee that such material is protectable or exclusive in every
        market. If you would prefer no AI tools be used on your project, tell us
        before we start and we will scope it that way.
      </p>
    ),
  },
  {
    id: "confidentiality",
    title: "Confidentiality",
    body: (
      <p>
        Each side will keep the other&apos;s non-public information confidential
        and use it only for the project. This does not cover information that is
        already public, was known beforehand, or must be disclosed by law. The
        obligation continues after the project ends.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Pausing and cancelling",
    body: (
      <ul>
        <li>
          Either side may end an engagement with written notice. You pay for all
          work completed and committed up to that point; deposits are
          non-refundable, as they reserve studio time.
        </li>
        <li>
          If a project is paused by you for more than 60 days, we may invoice
          the work completed to date and re-quote the remainder when it
          restarts.
        </li>
        <li>
          We may suspend or end work if invoices go unpaid, if material we need
          is not provided, or if we are asked to do something unlawful or
          against our professional judgement.
        </li>
        <li>
          Ownership of deliverables transfers only for work that has been paid
          for.
        </li>
      </ul>
    ),
  },
  {
    id: "warranties",
    title: "Warranties and disclaimers",
    body: (
      <>
        <p>
          We will perform our services with reasonable skill and care, to
          professional standards. For websites we build, we will fix defects
          reported within 30 days of launch at no charge, provided the site has
          not been modified by someone else.
        </p>
        <p>
          Beyond that, our services and this site are provided as-is. We do not
          warrant particular commercial results — traffic, rankings, sales,
          engagement or awards — and we do not warrant that the site or any
          deliverable will be uninterrupted or error-free.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <p>
        To the fullest extent the law allows, neither side is liable for
        indirect or consequential loss, including lost profit, lost revenue,
        lost data or loss of goodwill. Our total liability arising from an
        engagement is limited to the fees you have paid us for that engagement
        in the 12 months before the claim. Nothing here excludes liability that
        cannot legally be excluded, including for fraud or death or personal
        injury caused by negligence.
      </p>
    ),
  },
  {
    id: "site-use",
    title: "Using this website",
    body: (
      <>
        <p>
          The content of {LEGAL.site} — text, design, imagery, code, motion and
          case studies — belongs to {LEGAL.company} or the clients who
          commissioned it. You may view and share it, but not copy, republish or
          use it commercially without written permission.
        </p>
        <p>
          You agree not to attempt to gain unauthorised access to the site or
          its systems, scrape it at a scale that degrades it, submit false or
          abusive enquiries, or use it in a way that breaks the law. Our{" "}
          <Link href="/privacy">Privacy Policy</Link> and{" "}
          <Link href="/cookies">Cookie Policy</Link> also apply to your use of
          the site.
        </p>
      </>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: (
      <p>
        These terms are governed by the laws of the United Arab Emirates as
        applied in the Emirate of Dubai. We will try to resolve any dispute
        directly and in good faith. If we cannot, the courts of Dubai have
        exclusive jurisdiction.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms from time to time. The version published here
        on the date your proposal is accepted is the one that applies to that
        engagement. Continued use of the site after an update means you accept
        the revised terms.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      lead="How we work: what a proposal covers, how payment and revisions run, who owns what at the end, and the terms for using this site."
      sections={SECTIONS}
    />
  );
}
