import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import CookieSettingsButton from "@/components/CookieSettingsButton";
import { LEGAL } from "@/lib/legal";

export const metadata = {
  title: "Cookie Policy",
  description:
    "Which cookies and local storage thedarwin.co uses, what each one is for, and how to change your choice at any time.",
  alternates: { canonical: "/cookies" },
};

type Row = { name: string; purpose: string; type: string; life: string };

const NECESSARY: Row[] = [
  {
    name: "darwin.cookie-consent",
    purpose: "Remembers your cookie choice so we stop asking on every visit.",
    type: "Local storage",
    life: "Until you clear it",
  },
  {
    name: "Session / security",
    purpose:
      "Set by our hosting provider to keep the site secure, balance traffic and block abuse.",
    type: "Cookie",
    life: "Session",
  },
  {
    name: "Studio login",
    purpose:
      "Holds the sign-in for our password-protected admin area. Only ever set for our own team.",
    type: "Cookie",
    life: "Session",
  },
];

function Table({ rows }: { rows: Row[] }) {
  return (
    <div className="legal__tablewrap">
      <table className="legal__table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Purpose</th>
            <th scope="col">Type</th>
            <th scope="col">Expires</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td data-label="Name">
                <code>{r.name}</code>
              </td>
              <td data-label="Purpose">{r.purpose}</td>
              <td data-label="Type">{r.type}</td>
              <td data-label="Expires">{r.life}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SECTIONS: LegalSection[] = [
  {
    id: "what",
    title: "What cookies are",
    body: (
      <p>
        Cookies are small files a site stores in your browser. Related
        technologies — local storage, pixels and similar identifiers — do much
        the same job. Together they let a site remember a preference, keep a
        session alive, or measure how a page is used. Where we say
        &quot;cookies&quot; below, we mean all of them.
      </p>
    ),
  },
  {
    id: "necessary",
    title: "Strictly necessary",
    body: (
      <>
        <p>
          These make the site work and keep it secure. They cannot be switched
          off, and they do not track you across other sites.
        </p>
        <Table rows={NECESSARY} />
      </>
    ),
  },
  {
    id: "optional",
    title: "Analytics and marketing",
    body: (
      <>
        <p>
          <strong>
            {LEGAL.site} currently runs no analytics or advertising cookies.
          </strong>{" "}
          The banner still asks, because we may add them — for example, a
          privacy-friendly analytics tool to see which services people look at,
          or a conversion pixel on a campaign landing page.
        </p>
        <p>
          If we do, nothing in those categories loads until you have allowed it
          here, and this page will list each one before it goes live.
        </p>
        <ul>
          <li>
            <strong>Analytics</strong> — aggregate page views, referrers and
            journeys, used to improve the site. Never used to identify you
            personally.
          </li>
          <li>
            <strong>Marketing</strong> — measures whether an ad campaign led to
            an enquiry, and may be set by an advertising platform.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "embedded",
    title: "Embedded content",
    body: (
      <p>
        Some pages include content served by other companies — our 3D scenes,
        embedded video and links out to Instagram, LinkedIn, Facebook and
        WhatsApp. When that content loads, the provider can see your IP address
        and may set its own cookies under its own policy. We do not control
        those cookies. Following a social link takes you to that platform, where
        its terms apply.
      </p>
    ),
  },
  {
    id: "choice",
    title: "Changing your choice",
    body: (
      <>
        <p>
          Your choice is stored in your browser, so it is per-device and per
          browser. You can change it whenever you like:
        </p>
        <p>
          <CookieSettingsButton className="legal__btn">
            Open cookie settings
          </CookieSettingsButton>
        </p>
        <p>
          You can also block or delete cookies in your browser settings — in
          Chrome, Safari, Firefox and Edge this sits under privacy or site data.
          Blocking strictly necessary cookies may stop parts of the site working
          properly.
        </p>
      </>
    ),
  },
  {
    id: "more",
    title: "More on how we handle data",
    body: (
      <p>
        Our <Link href="/privacy">Privacy Policy</Link> covers everything else:
        what we collect through enquiries and projects, how long we keep it, and
        the rights you have over it. The{" "}
        <Link href="/terms">Terms of Service</Link> cover use of this site and
        our work. Questions about any of it go to{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>
    ),
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Cookie Policy"
      lead="The short version: we set what the site needs to run, nothing more, and anything optional waits for your say-so."
      sections={SECTIONS}
    />
  );
}
