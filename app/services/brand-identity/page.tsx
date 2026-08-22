import Link from "next/link";
import ContactFooter from "@/components/ContactFooter";
import Faq, { type QA } from "@/components/Faq";

export const metadata = {
  title: "Brand Identity Design in Dubai",
  description:
    "Strategy-led brand identity design by Darwin Corp, Dubai. Brand strategy, naming, logo design, visual identity, guidelines and brand applications, distinctive brand systems built to evolve.",
  alternates: { canonical: "/services/brand-identity" },
};

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

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      name: "Brand Identity Design",
      provider: { "@type": "Organization", name: "Darwin Corp", url: "https://thedarwin.co" },
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

export default function BrandIdentityPage() {
  return (
    <main className="bi">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="bi-hero" data-theme="light">
        <Link href="/services" className="bi-back">← Services</Link>
        <span className="bi-hero__eyebrow">01 · Brand Identity</span>
        <h1 className="bi-hero__title">Build a brand people remember.</h1>
        <p className="bi-hero__lead">
          A brand is more than a logo. It is the idea people take away, the feeling
          they associate with you, and the consistency they experience every time
          they meet your business. At Darwin, we build distinctive brand identities
          from the ground up, combining strategy, positioning, visual identity and
          creative direction into one cohesive system.
        </p>
        <p className="bi-hero__note">
          From first impression to every touchpoint, we design brands built to evolve.
        </p>
        <div className="bi-hero__cta">
          <Link href="/contact" className="bi-btn bi-btn--dark">Start a project</Link>
          <Link href="/work" className="bi-btn bi-btn--ghost">See our work</Link>
        </div>
      </section>

      <div className="bi-cover reveal-up" data-theme="light">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/video/brand-identity.png" alt="Brand identity by Darwin Corp" />
      </div>

      {/* More than a logo */}
      <section className="bi-section bi-section--intro" data-theme="light">
        <div className="bi-split reveal-up">
          <h2 className="bi-h2">More than a logo.</h2>
          <div className="bi-split__body">
            <p>A strong identity gives your business a clear point of view. We uncover what makes your brand different, define how it should be perceived, and translate that thinking into a visual language that feels unmistakably yours.</p>
            <p>Whether you&apos;re launching something new, repositioning an existing business, or taking an established brand into its next chapter, we create identities that are built for real-world use, not just a presentation screen.</p>
          </div>
        </div>
      </section>

      {/* What we build */}
      <section className="bi-section" data-theme="light">
        <header className="bi-head reveal-up">
          <span className="bi-eyebrow">Capabilities</span>
          <h2 className="bi-h2">What we build</h2>
        </header>
        <div className="bi-build">
          {BUILD.map((b) => (
            <div key={b.title} className="bi-build__card reveal-up">
              <h3>{b.title}</h3>
              <p>{b.sub}</p>
              <ul>
                {b.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Approach */}
      <section className="bi-section bi-section--dark" data-theme="dark">
        <header className="bi-head reveal-up">
          <span className="bi-eyebrow">Process</span>
          <h2 className="bi-h2">Our approach</h2>
        </header>
        <div className="bi-steps">
          {APPROACH.map((s) => (
            <div key={s.n} className="bi-step reveal-up">
              <span className="bi-step__n">{s.n}</span>
              <div className="bi-step__main">
                <h3>{s.title}</h3>
                <p className="bi-step__sub">{s.sub}</p>
                <p className="bi-step__body">{s.body}</p>
                <p className="bi-step__result"><strong>The result:</strong> {s.result}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Brand system */}
      <section className="bi-section" data-theme="light">
        <header className="bi-head reveal-up">
          <span className="bi-eyebrow">The Darwin Brand System</span>
          <h2 className="bi-h2">Four layers, one connected brand.</h2>
        </header>
        <div className="bi-system">
          {SYSTEM.map((p, i) => (
            <div key={p.title} className="bi-system__card reveal-up">
              <span className="bi-system__n">0{i + 1}</span>
              <h3>{p.title}</h3>
              <p className="bi-system__tag">{p.tag}</p>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you receive */}
      <section className="bi-section bi-section--receive" data-theme="light">
        <div className="bi-split reveal-up">
          <div>
            <span className="bi-eyebrow">Deliverables</span>
            <h2 className="bi-h2">What you receive</h2>
            <p className="bi-receive__note">Everything organised. Everything ready to use.</p>
          </div>
          <ul className="bi-receive__list">
            {RECEIVE.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Built for */}
      <section className="bi-section" data-theme="light">
        <header className="bi-head reveal-up">
          <span className="bi-eyebrow">Built for where you&apos;re going</span>
          <h2 className="bi-h2">Wherever your brand is right now.</h2>
        </header>
        <div className="bi-builtfor">
          {BUILT_FOR.map((b) => (
            <div key={b.title} className="bi-builtfor__card reveal-up">
              <h3>{b.title}</h3>
              <p>{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Darwin */}
      <section className="bi-section bi-section--dark" data-theme="dark">
        <header className="bi-head reveal-up">
          <span className="bi-eyebrow">Why Darwin</span>
          <h2 className="bi-h2">A brand should do more than look good.</h2>
          <p className="bi-head__lead">It should make your business easier to recognise, easier to understand, easier to remember, and easier to choose.</p>
        </header>
        <div className="bi-why">
          {WHY.map((w, i) => (
            <div key={w.title} className="bi-why__row reveal-up">
              <span className="bi-why__n">0{i + 1}</span>
              <h3>{w.title}</h3>
              <p>{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bi-section bi-section--faq" data-theme="light">
        <header className="bi-head reveal-up">
          <span className="bi-eyebrow">FAQ</span>
          <h2 className="bi-h2">Frequently asked questions</h2>
        </header>
        <div className="reveal-up">
          <Faq items={FAQ} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="bi-cta" data-theme="dark">
        <span className="bi-cta__eyebrow">Ready to evolve?</span>
        <h2 className="bi-cta__title">Your next chapter deserves more than a new logo.</h2>
        <p className="bi-cta__lead">Let&apos;s build a brand with a point of view, a system with purpose, and an identity designed to grow with you.</p>
        <Link href="/contact" className="bi-btn bi-btn--light">Start a project →</Link>
        <p className="bi-cta__sign">Darwin Corp - <em>Designed to Evolve.</em></p>
      </section>

      <ContactFooter hideCta />
    </main>
  );
}
