import Link from "next/link";
import ContactFooter from "@/components/ContactFooter";
import Faq, { type QA } from "@/components/Faq";
import StructuredData from "@/components/StructuredData";
import { LinkCards } from "@/components/ExplorePage";
import Hero from "@/components/realestate/Hero";
import Gallery from "@/components/realestate/Gallery";
import Finder from "@/components/realestate/Finder";
import DetailStory from "@/components/realestate/DetailStory";
import Agents from "@/components/realestate/Agents";
import Lens from "@/components/realestate/Lens";
import Placeholder from "@/components/realestate/Placeholder";
import { breadcrumbData, pageMetadata, SITE_URL } from "@/lib/seo";
import "./real-estate.css";

// Bespoke page: this slug is excluded from app/industries/[slug]. The page is
// a working demonstration of a concept real estate brand ("Aurelia"), then
// hands over to Darwin's own service content. All demo copy, text and links
// are server-rendered; the client components only add motion and state.

const TITLE = "Real Estate Website Design & Development";
const DESCRIPTION =
  "Real estate website design and development by Darwin Corp, Dubai. Custom-coded property websites, off-plan launch pages, property search and branding for agencies and developers.";

export const metadata = pageMetadata(TITLE, DESCRIPTION, "/industries/real-estate");

const CREATE = [
  { title: "Property agency websites", body: "Listings, agent profiles, area guides and enquiry routing for brokerages of any size." },
  { title: "Luxury property showcases", body: "Photography-led presentations for single residences and signature portfolios." },
  { title: "Developer websites", body: "A home for the developer brand, its track record and every project in its pipeline." },
  { title: "Off-plan project landing pages", body: "Launch pages built around the masterplan, payment plans and registration of interest." },
  { title: "Real estate brand identity", body: "Naming, logo, visual identity and guidelines for agencies, developers and projects." },
  { title: "Property search interfaces", body: "Filtered discovery, maps and listing pages designed around a defined data source." },
];

const FAQ: QA[] = [
  { q: "How much does a real estate website cost?", a: "It depends on the scope: a single off-plan launch page is a very different project from an agency website with searchable listings and CRM integration. Our website pricing page explains the tiers, and we confirm a fixed proposal once we understand your inventory and integrations." },
  { q: "Can you connect our property CRM or listing feed?", a: "We can assess the integration once you share the provider and its available API or feed. Data access, update frequency and licensing constraints affect feasibility and scope." },
  { q: "Do you build off-plan launch pages for developers?", a: "Yes. Launch pages can present the masterplan, unit types, payment plans and a registration-of-interest form routed to your sales team, with room to evolve as the project moves from launch to handover." },
  { q: "Will the site work in Arabic as well as English?", a: "Yes. Bilingual and right-to-left layouts can be planned from the start so typography, navigation and property data work in both languages." },
  { q: "Can our team add and update properties themselves?", a: "Yes. We define a property template with the fields you need, such as price, size, bedrooms, gallery and floor plans, so new listings match the original design." },
  { q: "Is the demonstration on this page a real property website?", a: "No. Aurelia is a concept brand we designed to show the approach. The properties, prices, agents and details are illustrative and are not a live inventory." },
];

const SERIES = [
  { n: "01", label: "Real Estate", line: "Beyond listings. Into living.", href: "/industries/real-estate", tone: "dusk" as const },
  { n: "02", label: "Interior Design", line: "Spaces deserve to be experienced, not just seen.", href: "/industries/interior-design", tone: "sand" as const },
  { n: "03", label: "Hospitality", line: "The experience begins before arrival.", href: "/industries/hospitality", tone: "sea" as const },
  { n: "04", label: "Personal Brands", line: "Make your presence impossible to mistake.", href: "/industries/personal-brands", tone: "stone" as const },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      name: "Real Estate Website Design & Development",
      serviceType: "Real estate website design",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: "Worldwide",
      url: `${SITE_URL}/industries/real-estate`,
      description: DESCRIPTION,
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ],
};

function Note({ children }: { children: React.ReactNode }) {
  return <aside className="re-note"><span>The thinking</span><p>{children}</p></aside>;
}

export default function RealEstatePage() {
  return (
    <main className="re">
      <StructuredData data={breadcrumbData([{ label: "Home", href: "/" }, { label: "Industries", href: "/industries" }, { label: "Real estate", href: "/industries/real-estate" }])} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Hero />

      <Lens>
        {/* The concept brand's own masthead: signals the shift into the demo. */}
        <div className="re-brandbar" data-theme="light">
          <span className="re-brandbar__mark">AURELIA</span>
          <span className="re-brandbar__nav" aria-hidden="true"><span>Residences</span><span>Neighbourhoods</span><span>Advisors</span><span>Enquire</span></span>
          <span className="re-brandbar__tag">A concept real estate brand, designed by Darwin</span>
        </div>

        {/* 01 Attract */}
        <section className="re-sec re-sec--desire" data-theme="light">
          <header className="re-head reveal-up">
            <span className="re-eyebrow">01 / The first impression</span>
            <h2 className="re-h2 re-serif">Before they buy a property, they imagine a life.</h2>
            <p className="re-lead">The view. The light. The details. The feeling of being there. A digital experience should help them picture it.</p>
          </header>
          <Note>Emotion comes before inventory. Large, patient imagery and one line of copy per scene let the buyer project themselves into the space before we ask them to compare anything.</Note>
          <Gallery />
          <p className="re-statement reveal-up">We design real estate websites that make space, architecture and lifestyle part of the story.</p>
        </section>

        {/* 02 Discover */}
        <section className="re-sec" data-theme="light">
          <header className="re-head reveal-up">
            <span className="re-eyebrow">02 / Discovery · Concept demonstration</span>
            <h2 className="re-h2 re-serif">Find somewhere that feels like yours.</h2>
            <p className="re-lead">Try it: a simple property discovery experience, the way it could work on your website.</p>
          </header>
          <Note>Three filters cover most first searches. Results update instantly, with no page reload, and the count stays visible so a visitor always knows how wide their search is. A large inventory would add a map, sorting and saved searches; a single development might not need search at all.</Note>
          <Finder />
        </section>

        {/* 03 Experience */}
        <section className="re-sec re-sec--detail" data-theme="light">
          <header className="re-head reveal-up">
            <span className="re-eyebrow">03 / The details</span>
            <h2 className="re-h2 re-serif">Every detail tells a story.</h2>
            <p className="re-lead">From the architecture to the neighbourhood, present the information buyers need without compromising the visual experience.</p>
          </header>
          <Note>The page follows the order a buyer asks questions in: what does it look like, how does it feel, how is it laid out, where is it, what are the facts. The enquiry appears once they have the facts, not before.</Note>
          <DetailStory />
          <p className="re-statement reveal-up">We combine visual storytelling with clear information architecture, creating property experiences designed for exploration and informed decisions.</p>
        </section>

        {/* 04 Build confidence */}
        <section className="re-sec re-sec--trust" data-theme="dark">
          <header className="re-head reveal-up">
            <span className="re-eyebrow">04 / Trust</span>
            <h2 className="re-h2 re-serif">People don&apos;t just choose a property. They choose who to trust.</h2>
            <p className="re-lead">Team, expertise, track record, verified reviews, licensing and a clear consultation process, presented with the same care as the properties.</p>
          </header>
          <Note>Agent profiles answer the questions a buyer has about the person, not the property: what they specialise in, where they work, which languages they speak and how they are registered. Every contact route is one tap away.</Note>
          <Agents />
          <ul className="re-trust">
            <li><strong>Track record</strong><span>Completed projects and transactions, from your verified records</span></li>
            <li><strong>Market knowledge</strong><span>Area guides and reports written by your team</span></li>
            <li><strong>Reviews</strong><span>Verified testimonials, attributed and dated</span></li>
            <li><strong>Registration</strong><span>Licence and regulatory details where applicable</span></li>
          </ul>
          <p className="re-disclaimer re-disclaimer--dark">Concept profiles only. Agents, credentials and details on this page are illustrative.</p>
        </section>

        {/* 05 The reveal */}
        <section className="re-reveal" data-theme="dark">
          <div className="re-reveal__media" aria-hidden="true"><Placeholder label="Abstract architectural form, Darwin motion language" tone="night" /></div>
          <div className="re-reveal__copy reveal-up">
            <span className="re-eyebrow">The experience behind the experience</span>
            <h2 className="re-reveal__title">You just experienced what your real estate website could feel like.</h2>
            <p className="re-lead">Now imagine an experience built entirely around your brand, your properties and your audience.</p>
            <p className="re-reveal__sign">Designed to Evolve.<span>Darwin Corp, Creative Design &amp; Development Studio</span></p>
            <div className="re-hero__cta">
              <Link href="/start-a-project" className="re-btn re-btn--light">Start a real estate project ↗</Link>
              <Link href="/cases/realpha" className="re-btn re-btn--line">See the reAlpha case study</Link>
            </div>
          </div>
        </section>
      </Lens>

      {/* Commercial / SEO content */}
      <section className="re-sec re-sec--services" id="re-services" data-theme="light">
        <header className="re-head re-head--split reveal-up">
          <div>
            <span className="re-eyebrow">Real estate website design &amp; development</span>
            <h2 className="re-h2">Digital experiences designed for the real estate industry.</h2>
          </div>
          <div className="re-copy">
            <p>Darwin Corp is a Dubai-based creative agency developing custom-coded websites and interactive digital experiences for real estate agencies, property developers and independent property professionals.</p>
            <p>We bring together brand identity, UI/UX design, creative development and motion to build property websites that connect visual storytelling with practical business needs: property data that stays accurate, enquiries that reach the right person, and pages that load quickly on a phone.</p>
          </div>
        </header>
        <h3 className="re-h3 reveal-up">What we can create for real estate brands</h3>
        <ul className="re-create">
          {CREATE.map((c, i) => (
            <li key={c.title} className="reveal-up">
              <span>0{i + 1}</span>
              <h4>{c.title}</h4>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="re-sec re-sec--how" data-theme="light">
        <header className="re-head reveal-up">
          <span className="re-eyebrow">How a project comes together</span>
          <h2 className="re-h2">Shaped around how you sell.</h2>
        </header>
        <div className="re-how">
          <div className="reveal-up"><h3>Single development or live inventory</h3><p>A luxury developer launching one project needs a different journey from an agency with hundreds of changing listings. We start by defining which one you are, and design the structure around it.</p></div>
          <div className="reveal-up"><h3>Data with a defined source</h3><p>Listing feeds, CRM connections and search are scoped against the actual provider. We establish where property data lives, how it updates and who is responsible for its accuracy.</p></div>
          <div className="reveal-up"><h3>Enquiries that reach the right person</h3><p>Calls to action connect an enquiry to a specific property or project, and form fields and routing follow the way your sales team handles incoming interest.</p></div>
          <div className="reveal-up"><h3>Motion that respects the visitor</h3><p>Cinematic sections are progressive enhancements. Content is server-rendered for search, heavy media is loaded when needed, and reduced-motion preferences are respected.</p></div>
        </div>
      </section>

      <section className="re-sec re-sec--faq" data-theme="light">
        <header className="re-head reveal-up">
          <span className="re-eyebrow">FAQ</span>
          <h2 className="re-h2">Real estate website questions</h2>
        </header>
        <div className="reveal-up"><Faq items={FAQ} /></div>
      </section>

      <section className="re-cta" data-theme="dark">
        <span className="re-eyebrow">Start a project</span>
        <h2 className="re-cta__title">Your properties deserve more than a listing.</h2>
        <p className="re-lead">Tell us about your agency, development or portfolio, and we will shape a proposal around your inventory, audience and sales process.</p>
        <div className="re-hero__cta">
          <Link href="/start-a-project" className="re-btn re-btn--light">Start a real estate project →</Link>
          <Link href="/pricing/websites" className="re-btn re-btn--line">Website pricing</Link>
        </div>
      </section>

      <section className="re-sec re-sec--series" data-theme="light">
        <header className="re-head reveal-up">
          <span className="re-eyebrow">Darwin Corp / Industries</span>
          <h2 className="re-h2">Every industry has a story. We design how it&apos;s experienced.</h2>
        </header>
        <ul className="re-series">
          {SERIES.map(s => (
            <li key={s.n} className="reveal-up">
              <Link href={s.href} aria-current={s.href === "/industries/real-estate" ? "page" : undefined}>
                <Placeholder label={`${s.label} cover image`} tone={s.tone} />
                <span className="re-series__n">{s.n} / {s.label}</span>
                <span className="re-series__line">{s.line}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="re-sec" data-theme="light">
        <h2 className="re-h2">Explore the next step.</h2>
        <LinkCards links={[
          { label: "Custom website development", href: "/services/custom-web-development" },
          { label: "UI/UX design", href: "/services/ui-ux-design" },
          { label: "Brand identity", href: "/services/brand-identity" },
          { label: "Architecture studios", href: "/industries/architecture" },
        ]} />
      </section>
      <ContactFooter hideCta />
    </main>
  );
}
