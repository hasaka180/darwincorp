import type { Metadata } from "next";
import Link from "next/link";
import ContactFooter from "@/components/ContactFooter";
import StructuredData from "@/components/StructuredData";
import { CtaPanel, Deliverables, FaqBlock, MediaHero, Mix, ProcessPanel, Tag, WorkGrid, pad, type WorkItem } from "@/components/ww/Kit";
import portfolio from "@/lib/content/portfolio.json";
import { breadcrumbData, pageMetadata, SITE_URL } from "@/lib/seo";

// Bespoke page: excluded from app/services/[slug]. Visual language follows
// the homepage and /locations/worldwide (components/ww/Kit).

const TITLE = "Brand Identity Design | Dubai & Worldwide";
const DESCRIPTION =
  "Strategy-led brand identity design by Darwin Corp, Dubai. Brand strategy, naming, logo design, visual identity, guidelines and brand applications, distinctive brand systems built to evolve.";
const PATH = "/services/brand-identity";

export const metadata: Metadata = pageMetadata(TITLE, DESCRIPTION, PATH, "/video/brand-identity.png");

type QA = { q: string; a: string };

const BUILD = [
  {
    title: "Brand Strategy",
    sub: "Define the foundation before we design.",
    items: ["Brand discovery", "Market & competitor research", "Audience definition", "Brand positioning", "Purpose, vision & values", "Brand personality", "Brand architecture", "Creative direction"],
  },
  {
    title: "Naming & Messaging",
    sub: "Find the words that make your brand recognizable.",
    items: ["Naming direction", "Tagline development", "Value proposition", "Brand story", "Messaging framework", "Tone of voice", "Key brand messages"],
  },
  {
    title: "Visual Identity",
    sub: "Turn your strategy into a distinctive visual world.",
    items: ["Logo design", "Logo variations", "Monogram / icon", "Colour system", "Typography system", "Iconography", "Graphic elements", "Layout & grid systems", "Photography direction", "Art direction"],
  },
  {
    title: "Brand Guidelines",
    sub: "Give your team a system they can actually use.",
    items: ["Logo usage", "Clear space & sizing", "Colour specifications", "Typography rules", "Imagery direction", "Graphic language", "Digital applications", "Print applications", "Do's & don'ts", "Brand templates"],
  },
  {
    title: "Brand Applications",
    sub: "Take the identity from concept to reality.",
    items: ["Business cards", "Letterheads", "Social media", "Presentation decks", "Marketing materials", "Packaging", "Signage", "Website direction", "Campaign assets", "Digital touchpoints"],
  },
];

const APPROACH = [
  { n: "01", title: "Discover", sub: "Start with the why.", body: "Before we design anything, we get to know your business. We explore your ambition, audience, competitors, strengths, challenges and the space you want to own.", result: "A clear understanding of where your brand stands, and where it needs to go." },
  { n: "02", title: "Define", sub: "Find your position.", body: "We turn research and conversations into a strategic foundation, what your brand stands for, who it speaks to, why it matters and what makes it different.", result: "A focused brand strategy that gives every creative decision a purpose." },
  { n: "03", title: "Create", sub: "Give the brand a visual voice.", body: "We explore creative territories, develop the identity system and refine every detail, from the logo and typography to colour, imagery and graphic language.", result: "A distinctive identity designed to be recognised and remembered." },
  { n: "04", title: "Build", sub: "Turn the identity into a system.", body: "We develop the rules, assets and applications needed to keep your brand consistent across digital, print, social and physical environments.", result: "A flexible brand system your team can confidently use." },
  { n: "05", title: "Launch", sub: "Put the brand into the world.", body: "From final artwork and brand guidelines to launch assets and key applications, we make sure your new identity is ready to perform from day one.", result: "A complete, organised brand ready to evolve." },
];

const SYSTEM = [
  { title: "Strategy", tag: "Know what you stand for.", body: "Your positioning, audience, personality and competitive space become the foundation of the brand." },
  { title: "Identity", tag: "Look like who you are.", body: "A distinctive visual system gives your brand recognition across every touchpoint." },
  { title: "Expression", tag: "Sound and feel consistent.", body: "Messaging, imagery, typography, motion and creative direction bring the identity to life." },
  { title: "Experience", tag: "Make every interaction count.", body: "From your website and social channels to presentations, packaging and physical spaces, we make the brand feel like one connected experience." },
];

const RECEIVE = ["Brand strategy", "Positioning framework", "Brand personality", "Naming & tagline direction", "Logo suite", "Logo variations", "Icon / monogram", "Colour palette", "Typography system", "Graphic elements", "Iconography", "Photography direction", "Art direction", "Brand messaging", "Tone of voice", "Brand guidelines", "Social media templates", "Presentation templates", "Business stationery", "Digital brand assets", "Marketing collateral", "Final production files"];

const BUILT_FOR = [
  { title: "Launching a new brand?", body: "Start with a clear foundation instead of trying to fix your identity later." },
  { title: "Growing business?", body: "Bring consistency to a brand that has evolved organically." },
  { title: "Rebranding?", body: "Change how your business is perceived without losing what already makes it valuable." },
  { title: "Entering a new market?", body: "Create an identity that feels relevant, competitive and ready for a bigger audience." },
];

const WHY = [
  { title: "Strategy before aesthetics.", body: "We don't start with colours and logos. We start with understanding." },
  { title: "Designed as a system.", body: "Your brand shouldn't depend on one logo. Every element works together." },
  { title: "Made for real life.", body: "We design identities that work on screens, signage, social media, print and everywhere your audience encounters you." },
  { title: "Creative with purpose.", body: "Every visual decision has a reason behind it." },
  { title: "Built to evolve.", body: "Your brand today shouldn't limit your brand tomorrow." },
];

const FAQ: QA[] = [
  { q: "What is brand identity?", a: "Brand identity is the complete system that shapes how your business looks, sounds and feels. It can include strategy, positioning, messaging, logo design, typography, colour, imagery, guidelines and brand applications." },
  { q: "Is brand identity the same as a logo?", a: "No. A logo is one part of an identity. A strong brand identity creates a complete and consistent system around the logo." },
  { q: "Do you work with new businesses?", a: "Yes. We work with businesses building their first identity as well as established brands looking to evolve or reposition themselves." },
  { q: "Can you redesign an existing brand?", a: "Absolutely. We can evolve an existing identity while retaining valuable brand equity, or develop a completely new direction when a bigger change is needed." },
  { q: "Can you create Arabic and English identities?", a: "Yes. For UAE and GCC brands, bilingual considerations can be incorporated into the identity system, typography and applications from the beginning." },
  { q: "Do you provide brand guidelines?", a: "Yes. Final guidelines document how the identity should be used across key brand touchpoints, helping your team and partners maintain consistency." },
  { q: "Can you apply the new identity to our website and social media?", a: "Yes. Brand identity can be extended into digital experiences, social media, campaigns, presentations and other brand touchpoints." },
];

// Every Darwin project with brand identity in its scope, strongest first.
const WORK: WorkItem[] = ["nexera-robotics", "realpha", "summa-forte", "the-cooking-guild", "nadz-home-healthcare"]
  .map((slug) => portfolio.find((p) => p.slug === slug))
  .filter((p): p is (typeof portfolio)[number] => Boolean(p));

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      name: "Brand Identity Design",
      serviceType: "Brand identity design",
      url: `${SITE_URL}${PATH}`,
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: "Worldwide",
      description:
        "Strategy-led brand identity design, brand strategy, naming, logo design, visual identity, guidelines and applications.",
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

const CRUMBS = [{ label: "Home", href: "/" }, { label: "Services", href: "/services" }, { label: "Brand identity", href: PATH }];

export default function BrandIdentityPage() {
  return (
    <main className="ww">
      <StructuredData data={breadcrumbData(CRUMBS)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <MediaHero
        crumbs={CRUMBS}
        tag="Services / Brand identity"
        serif="Build a brand"
        display="people remember."
        sub="From first impression to every touchpoint."
        body="A brand is more than a logo. We build distinctive identities from the ground up, combining strategy, positioning, visual identity and creative direction into one cohesive system."
        media={{ video: "/video/brand-identity.mp4", poster: "/video/brand-identity.png", alt: "Brand identity artwork by Darwin Corp" }}
        secondary={{ label: "See brand work", href: "#work" }}
      />

      {/* 01 More than a logo */}
      <section className="ww-sec ww-split" data-theme="light">
        <header className="reveal-up">
          <Tag>01 / Perspective</Tag>
          <Mix serif="More than" pixel="a logo." />
          <p className="ww-serif">A strong identity gives your business a clear point of view.</p>
        </header>
        <div className="ww-prose reveal-up">
          <p className="ww-lead">We uncover what makes your brand different, define how it should be perceived, and translate that thinking into a visual language that feels unmistakably yours.</p>
          <p>Whether you&apos;re launching something new, repositioning an existing business, or taking an established brand into its next chapter, we create identities that are built for real-world use, not just a presentation screen.</p>
        </div>
      </section>

      {/* 02 What we build */}
      <section className="ww-sec" data-theme="light">
        <header className="ww-head reveal-up">
          <div>
            <Tag>02 / Capabilities</Tag>
            <Mix serif="What" pixel="we build" />
          </div>
          <p className="ww-body">Five connected disciplines. Most projects use several of them; every one is scoped to what your brand needs now.</p>
        </header>
        <ul className="ww-markets">
          {BUILD.map((b, i) => (
            <li key={b.title} className="ww-market reveal-up">
              <span className="svx-market-n">{pad(i + 1)}</span>
              <h3 className="ww-market__name">{b.title}</h3>
              <p>{b.sub}</p>
              <ul className="svx-chips">{b.items.map((it) => <li key={it}>{it}</li>)}</ul>
            </li>
          ))}
        </ul>
      </section>

      {/* 03 Approach */}
      <ProcessPanel
        tag="03 / Our approach"
        serif="Strategy first."
        pixel="Then the identity."
        intro={["Every stage ends with a clear result, so the creative work always has a strategic reason behind it."]}
        steps={APPROACH.map((s) => ({ title: s.title, body: s.body, result: s.result }))}
      />

      {/* 04 Brand system */}
      <section className="ww-sec" data-theme="light">
        <header className="ww-head reveal-up">
          <div>
            <Tag>04 / The Darwin brand system</Tag>
            <Mix serif="Four layers," pixel="one connected brand." />
          </div>
        </header>
        <ul className="ww-markets svx-grid-4">
          {SYSTEM.map((p, i) => (
            <li key={p.title} className="ww-market reveal-up">
              <span className="svx-market-n">{pad(i + 1)}</span>
              <h3 className="ww-market__name">{p.title}</h3>
              <span className="ww-market__k" style={{ marginTop: 10 }}>{p.tag}</span>
              <p>{p.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 05 Work */}
      <section className="ww-sec" data-theme="light" id="work">
        <header className="ww-head reveal-up">
          <div>
            <Tag>05 / Selected work</Tag>
            <Mix serif="Brands we've" pixel="built." />
          </div>
          <p className="ww-body">Identities, packaging and brand systems from deep tech to healthcare.</p>
        </header>
        <WorkGrid items={WORK} />
        <div className="ww-foot"><Link href="/work" className="ww-link">Explore all work <span aria-hidden="true">→</span></Link></div>
      </section>

      {/* 06 Deliverables */}
      <section className="ww-sec ww-split" data-theme="light">
        <header className="reveal-up">
          <Tag>06 / Deliverables</Tag>
          <Mix serif="What you" pixel="receive." />
          <p className="ww-serif">Everything organised. Everything ready to use.</p>
          <div className="ww-foot"><Link href="/pricing/branding" className="ww-link">Branding pricing <span aria-hidden="true">→</span></Link></div>
        </header>
        <div className="reveal-up"><Deliverables items={RECEIVE} /></div>
      </section>

      {/* 07 Built for */}
      <section className="ww-sec" data-theme="light">
        <header className="ww-head reveal-up">
          <div>
            <Tag>07 / Built for where you&apos;re going</Tag>
            <Mix serif="Wherever your brand" pixel="is right now." />
          </div>
        </header>
        <ul className="ww-markets svx-grid-4">
          {BUILT_FOR.map((b) => (
            <li key={b.title} className="ww-market reveal-up">
              <h3 className="ww-market__name">{b.title}</h3>
              <p>{b.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 08 Why Darwin */}
      <section className="ww-sec ww-split" data-theme="light">
        <header className="reveal-up">
          <Tag>08 / Why Darwin</Tag>
          <Mix serif="A brand should do" pixel="more than look good." />
          <p className="ww-serif">It should make your business easier to recognise, understand, remember and choose.</p>
        </header>
        <ol className="svx-rows reveal-up">
          {WHY.map((w, i) => <li key={w.title}><span>{pad(i + 1)}</span><h3>{w.title}</h3><p>{w.body}</p></li>)}
        </ol>
      </section>

      <FaqBlock tag="09 / Good to know" items={FAQ} />

      <CtaPanel
        track="service_cta"
        tag="Ready to evolve?"
        serif="Your next chapter deserves"
        pixel="more than a new logo."
        line="Darwin Corp. Designed to evolve."
        body={["Let's build a brand with a point of view, a system with purpose, and an identity designed to grow with you."]}
        links={[{ label: "Logo & visual identity", href: "/services/logo-visual-identity" }, { label: "Brand identity vs logo", href: "/journal/brand-identity-vs-logo-design" }]}
      />

      <ContactFooter hideCta />
    </main>
  );
}
