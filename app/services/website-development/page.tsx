import type { Metadata } from "next";
import Link from "next/link";
import ContactFooter from "@/components/ContactFooter";
import StructuredData from "@/components/StructuredData";
import { CtaPanel, Deliverables, FaqBlock, MediaHero, Mix, ProcessPanel, Tag, WorkGrid, pad, type WorkItem } from "@/components/ww/Kit";
import PixelScene from "@/components/ww/PixelScene";
import portfolio from "@/lib/content/portfolio.json";
import { breadcrumbData, pageMetadata, SITE_URL } from "@/lib/seo";

// Bespoke page: excluded from app/services/[slug]. Visual language follows
// the homepage and /locations/worldwide (components/ww/Kit).

const TITLE = "Website Design & Development | Dubai & Worldwide";
const DESCRIPTION =
  "Website design and development by Darwin Corp, a Dubai studio working worldwide. Strategy, UX, custom design, fast builds, a CMS your team can use and a clear enquiry path.";
const PATH = "/services/website-development";

export const metadata: Metadata = pageMetadata(TITLE, DESCRIPTION, PATH, "/video/website.jpg");

const BUILD = [
  { title: "Corporate & brand websites", href: "/services/custom-web-development", body: "A credible home for the business: clear positioning, service pages that answer real questions and an enquiry path on every page.", chips: ["Strategy", "Custom design", "CMS"] },
  { title: "Interactive & 3D experiences", href: "/services/interactive-web-design", body: "Scroll stories, WebGL scenes and product reveals for brands that need to be remembered, with simpler fallbacks on every device.", chips: ["WebGL", "Motion", "Creative code"] },
  { title: "Real estate & property sites", href: "/industries/real-estate", body: "Listings, project launches and luxury showcases, built around accurate property data and enquiries that reach the right agent.", chips: ["Listings", "Off-plan", "Bilingual"] },
  { title: "Landing pages & campaigns", href: "/pricing/websites", body: "Focused pages for a launch or an ad campaign, with one message, one action and the tracking needed to judge the result.", chips: ["Paid media", "Lead forms", "Tracking"] },
  { title: "Redesigns & migrations", href: "/services/website-redesign", body: "Keep what already ranks and converts, fix what doesn't, and move to a new site with redirects mapped and forms tested.", chips: ["Audit", "Redirects", "Content"] },
  { title: "UI/UX for web products", href: "/services/ui-ux-design", body: "Dashboards, portals and booking flows designed as clear journeys first, then as a component system developers can build.", chips: ["Flows", "Prototypes", "Design system"] },
];

const STEPS = [
  { title: "Discover", body: "Your business, audience, competitors and goals. We agree what the website has to achieve and how we'll measure it." },
  { title: "Structure", body: "Sitemap, content hierarchy and wireframes for the key journeys, so every page has a purpose before it has a look." },
  { title: "Design", body: "The visual system and key pages in high fidelity, with motion studies where interaction carries the story." },
  { title: "Build", body: "A responsive, performant build with your CMS, forms and integrations, reviewed on real devices as it comes together." },
  { title: "Launch & evolve", body: "Launch checks, analytics and enquiry tracking, redirects where needed, and a handover your team can work from." },
];

const DELIVERABLES = [
  "Discovery and project brief",
  "Sitemap and content structure",
  "Wireframes for key journeys",
  "Custom visual design",
  "Responsive design for every page type",
  "Motion and interaction design",
  "Frontend development",
  "CMS setup for your content",
  "Lead forms and email routing",
  "WhatsApp and contact integrations",
  "SEO foundations and metadata",
  "Analytics and enquiry tracking",
  "Performance and accessibility checks",
  "Redirect mapping (redesigns)",
  "Launch and DNS support",
  "Handover documentation",
];

const STANDARDS = [
  { title: "Fast on a phone.", body: "Images, video and 3D are loaded in the order a visitor needs them. Performance is checked on mid-range mobile devices, not only on a studio desktop." },
  { title: "Found by search.", body: "Clean URLs, structured data, metadata, a sitemap and server-rendered content, so search engines can read what visitors see." },
  { title: "Editable by your team.", body: "Content you change often lives in a CMS. What needs a developer, and what doesn't, is agreed during scoping." },
  { title: "Built to convert.", body: "Every page leads somewhere: a project brief, a call or WhatsApp. Form submissions and contact clicks are tracked from launch day." },
  { title: "Accessible by default.", body: "Keyboard navigation, readable contrast, reduced-motion alternatives and semantic markup are part of the build, not an afterthought." },
];

const FAQ = [
  { q: "How much does a website cost?", a: "It depends on the number of page types, the content, integrations and how much custom interaction the site needs. Our website pricing page explains the main tiers, and the website cost calculator gives a quick estimate before we talk. Every project receives a written proposal with a fixed scope." },
  { q: "How long does a website take?", a: "A focused landing page is much quicker than a multi-language platform with integrations. We agree a timeline in the proposal, with review points at structure, design and build, so you always know what comes next." },
  { q: "Will we be able to update the website ourselves?", a: "Yes. Pages and content your team updates regularly are managed in a CMS. We walk you through it at handover and document the parts that need a developer." },
  { q: "Can you redesign our existing website without losing search rankings?", a: "We audit what currently ranks and converts, keep or improve those pages, and map every changed URL to a redirect before launch. Forms and tracking are tested before the switch." },
  { q: "Do you build bilingual and Arabic websites?", a: "Yes. English and Arabic, including right-to-left layouts, can be planned from the start so typography, navigation and content work in both languages." },
  { q: "Do you work with businesses outside the UAE?", a: "Yes. Our studio is based in Dubai and we work with clients worldwide through remote collaboration, with agreed review windows across time zones." },
  { q: "Can you also create our brand identity?", a: "Yes. Many projects start with brand identity and continue into the website, so the visual system, messaging and site are designed together." },
];

const byslug = new Map(portfolio.map((p) => [p.slug, p]));
const WORK: WorkItem[] = [
  { ...byslug.get("nadz-home-healthcare")!, note: "Website & brand" },
  { title: "Coastal residence property site", category: "Real estate", note: "Live demo", href: "/industries/real-estate", cover: "/assets/realestate/detail-exterior.webp", services: ["Website design", "3D villa hero", "Listings"] },
  { ...byslug.get("the-cooking-guild")!, note: "Landing pages & UX" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Service", name: "Website Design & Development", serviceType: "Website development", description: DESCRIPTION, url: `${SITE_URL}${PATH}`, areaServed: "Worldwide", provider: { "@id": `${SITE_URL}/#organization` } },
    { "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ],
};

const CRUMBS = [{ label: "Home", href: "/" }, { label: "Services", href: "/services" }, { label: "Website development", href: PATH }];

export default function WebsiteDevelopmentPage() {
  return (
    <main className="ww">
      <StructuredData data={breadcrumbData(CRUMBS)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <MediaHero
        crumbs={CRUMBS}
        tag="Services / Website development"
        serif="Websites built"
        display="to be chosen."
        sub="Design and development from Dubai, for businesses worldwide."
        body="We plan, design and build websites that earn trust quickly, explain what you do clearly and make the next step easy, on a codebase that stays fast as your business grows."
        scene={<PixelScene variant="web" />}
        secondary={{ label: "See website work", href: "#work" }}
      />

      {/* 01 Perspective */}
      <section className="ww-sec ww-split" data-theme="light">
        <header className="reveal-up">
          <Tag>01 / Perspective</Tag>
          <Mix serif="A website is" pixel="a sales conversation." />
          <p className="ww-serif">It should answer the questions a buyer has, in the order they have them.</p>
        </header>
        <div className="ww-prose reveal-up">
          <p className="ww-lead">Most visitors decide within a few pages whether to get in touch. We design those pages around what they need to know: what you do, who it&apos;s for, why you&apos;re credible and what happens next.</p>
          <p>Strategy, design and development happen in one studio. The person shaping the structure works with the person writing the code, so the site that launches is the site that was designed.</p>
          <p>We build for real devices and real connections. Motion and 3D are used when they explain something better than a still image, and always with a simpler path for visitors who need it.</p>
        </div>
      </section>

      {/* 02 What we build */}
      <section className="ww-sec" data-theme="light">
        <header className="ww-head reveal-up">
          <div>
            <Tag>02 / What we build</Tag>
            <Mix serif="Websites for" pixel="every stage of growth" />
          </div>
          <p className="ww-body">From a single campaign page to a full platform, every build follows the same process and the same standards.</p>
        </header>
        <ul className="ww-markets">
          {BUILD.map((b, i) => (
            <li key={b.title} className="ww-market reveal-up">
              <Link href={b.href} className="svx-market-link">
                <span className="svx-market-n">{pad(i + 1)}</span>
                <h3 className="ww-market__name">{b.title}</h3>
                <p>{b.body}</p>
                <ul className="svx-chips">{b.chips.map((c) => <li key={c}>{c}</li>)}</ul>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 03 Process */}
      <ProcessPanel
        tag="03 / How we work"
        serif="From a clear brief"
        pixel="to a working website."
        intro={["Every project follows five stages with a review at each one, so decisions are made early, when they are cheapest to change."]}
        steps={STEPS}
      />

      {/* 04 Work */}
      <section className="ww-sec" data-theme="light" id="work">
        <header className="ww-head reveal-up">
          <div>
            <Tag>04 / Selected work</Tag>
            <Mix serif="Ideas put" pixel="into practice." />
          </div>
          <p className="ww-body">Websites, landing pages and digital experiences we&apos;ve designed and built.</p>
        </header>
        <WorkGrid items={WORK} />
        <div className="ww-foot"><Link href="/work" className="ww-link">Explore all work <span aria-hidden="true">→</span></Link></div>
      </section>

      {/* 05 Deliverables */}
      <section className="ww-sec ww-split" data-theme="light">
        <header className="reveal-up">
          <Tag>05 / Deliverables</Tag>
          <Mix serif="What you" pixel="receive." />
          <p className="ww-serif">The exact list is agreed in your proposal. A typical project includes:</p>
          <div className="ww-foot"><Link href="/pricing/websites" className="ww-link">Website pricing <span aria-hidden="true">→</span></Link></div>
        </header>
        <div className="reveal-up"><Deliverables items={DELIVERABLES} /></div>
      </section>

      {/* 06 Standards */}
      <section className="ww-sec ww-split" data-theme="light">
        <header className="reveal-up">
          <Tag>06 / Standards</Tag>
          <Mix serif="Built right" pixel="from day one." />
          <p className="ww-serif">The parts visitors never notice, until they&apos;re missing.</p>
        </header>
        <ol className="svx-rows reveal-up">
          {STANDARDS.map((s, i) => <li key={s.title}><span>{pad(i + 1)}</span><h3>{s.title}</h3><p>{s.body}</p></li>)}
        </ol>
      </section>

      <FaqBlock tag="07 / Good to know" items={FAQ} />

      <CtaPanel
        track="service_cta"
        tag="Ready when you are"
        serif="Your next website"
        pixel="starts with a brief."
        line="Let's make something worth choosing."
        body={["Tell us what you're building, what needs to change and when you'd like to launch. A short brief is enough to start the conversation."]}
        links={[{ label: "Website cost calculator", href: "/tools/website-cost-calculator" }, { label: "Custom web development", href: "/services/custom-web-development" }]}
      />

      <ContactFooter hideCta />
    </main>
  );
}
