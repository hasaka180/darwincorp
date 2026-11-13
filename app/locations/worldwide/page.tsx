import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import ContactFooter from "@/components/ContactFooter";
import StructuredData from "@/components/StructuredData";
import WorldHero from "@/components/worldwide/WorldHero";
import TimeBar from "@/components/worldwide/TimeBar";
import { AudiencePreview, LocalTime, ScrollProgress, TiltCard } from "@/components/worldwide/Interactive";
import { MARKETS, STUDIO } from "@/components/worldwide/markets";
import { breadcrumbData, pageMetadata, SITE_URL } from "@/lib/seo";
import "./worldwide.css";

// Bespoke page: this slug is excluded from app/locations/[slug]. Copy follows
// Figma "Darwin — Working worldwide" (page 9); the visual language follows the
// homepage: white base, contained column, framed 3D hero, Handjet titles.
// All text is server-rendered; client components add the scene and motion.

const TITLE = "Global Creative & Digital Agency | Darwin Corp";
const DESCRIPTION =
  "Darwin Corp is a Dubai-based creative and digital agency working worldwide. Explore brand identity, website development, UI/UX and interactive digital experiences.";
const PATH = "/locations/worldwide";

const base = pageMetadata(TITLE, DESCRIPTION, PATH);
// Absolute so the layout's "%s - Darwin Corp" template doesn't add the brand twice.
export const metadata: Metadata = { ...base, title: { absolute: TITLE } };

// Each card gets its own pair from the homepage palette for its gradient field.
const CAPABILITIES = [
  { title: "Website design & development", href: "/services/custom-web-development", tag: "Web · UX · Build", a: "#b24d93", b: "#9867b3", body: "Websites designed to establish credibility, communicate value and turn visitors into customers. From premium corporate websites to complex digital platforms, we combine thoughtful UX, distinctive visual design and reliable development." },
  { title: "Brand identity & creative direction", href: "/services/brand-identity", tag: "Identity · Systems", a: "#ff5b3a", b: "#9a2535", body: "Distinctive brand identities built around a clear purpose. We develop visual systems, logos, typography, colour languages and creative direction that help businesses build recognition across every touchpoint." },
  { title: "Interactive digital experiences", href: "/services/interactive-web-design", tag: "WebGL · Motion", a: "#9867b3", b: "#674158", body: "Digital experiences that invite people to explore, engage and connect. We use interaction, motion and thoughtful storytelling to make websites more memorable and meaningful." },
  { title: "UI/UX & digital product design", href: "/services/ui-ux-design", tag: "Product · Prototypes", a: "#5d68b0", b: "#9867b3", body: "Intuitive interfaces and user journeys shaped around real business objectives. From early concepts and wireframes to detailed prototypes and design systems, we make digital products easier to understand and use." },
  { title: "Motion design & digital storytelling", href: "/services/motion-design", tag: "Motion · Narrative", a: "#c64f65", b: "#b24d93", body: "Motion-led creative that gives brands a distinctive voice. We develop visual narratives, animated identities and digital content that communicate ideas with clarity and character." },
  { title: "AI-powered creative production", href: "/services/ai-creative-production", tag: "Generative · Art direction", a: "#cf7466", b: "#9a2535", body: "New creative possibilities through the considered use of generative technologies. We combine human art direction with emerging tools to produce original visual content and explore new ways of communicating." },
];

const STEPS = [
  { title: "Discover", body: "We begin by understanding your business, audience, objectives and market. We establish the project scope, key requirements and what success should look like." },
  { title: "Define", body: "We establish the creative direction, content structure, technical requirements and delivery roadmap before moving into production." },
  { title: "Design", body: "We develop concepts, interfaces and prototypes, giving your team clear opportunities to review the work and provide consolidated feedback." },
  { title: "Develop", body: "Approved designs are translated into working digital experiences, with development, integrations and quality checks aligned with the agreed scope." },
  { title: "Launch & evolve", body: "We prepare the final handover, support the launch according to the agreed scope and help your team move forward with a clear foundation." },
];

const FAQ = [
  { q: "Where is Darwin Corp based?", a: "Darwin Corp is an independent creative and digital studio based in Dubai, United Arab Emirates. We work with businesses internationally through remote collaboration." },
  { q: "Does Darwin Corp work with international clients?", a: "Yes. We work with businesses and teams across different countries. Project communication, review schedules, deliverables and handover arrangements are agreed before work begins." },
  { q: "Can you design and develop a website for a business outside the UAE?", a: "Yes. We provide website strategy, design and development for international businesses. We adapt the project to your audience, business requirements and technical needs." },
  { q: "Can you create multilingual websites?", a: "Yes. Multilingual requirements can be included in the project scope. We plan language versions, content structure and layouts, including right-to-left interfaces where required. Translation and local-language content responsibilities are agreed in advance." },
  { q: "How do international projects work across time zones?", a: "We use scheduled meetings where useful, documented decisions, shared prototypes and agreed feedback windows. This allows projects to progress without requiring every decision to happen in a live meeting." },
  { q: "How do you handle international pricing and payments?", a: "Every project receives a tailored proposal outlining the scope, deliverables, payment milestones and agreed currency. Any third-party costs are identified before the project begins." },
  { q: "Do you have physical offices in other countries?", a: "Our studio is based in Dubai, UAE. We serve international clients remotely and do not claim physical offices in other markets." },
];

const TICKER = ["Dubai GMT+4", "London GMT+0", "New York GMT−5", "Amsterdam GMT+1", "Singapore GMT+8", "Riyadh GMT+3"];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}${PATH}#webpage`,
      url: `${SITE_URL}${PATH}`,
      name: TITLE,
      description: DESCRIPTION,
      about: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ],
};

const pad = (n: number) => String(n).padStart(2, "0");

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="ww-tag-label">[ {children} ]</span>;
}

/** The homepage's iridescent pill button. */
function CtaButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className="cta-btn ww-cta-btn" href={href}>
      <span className="cta-btn__fluid" aria-hidden="true" />
      <span className="cta-btn__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 12h13M12 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="cta-btn__text">{children}</span>
    </Link>
  );
}

export default function WorldwidePage() {
  return (
    <main className="ww">
      <StructuredData data={breadcrumbData([{ label: "Home", href: "/" }, { label: "Locations", href: "/locations" }, { label: "Worldwide", href: PATH }])} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <WorldHero>
        <Tag>Darwin Corp / Working worldwide</Tag>
        <h1 className="ww-hero__title">
          <span className="ww-hero__serif blur-in">One studio.</span>
          <span className="ww-hero__display blur-in">Every time zone.</span>
        </h1>
        <p className="ww-hero__sub blur-in">A global creative and digital partner, based in Dubai.</p>
        <p className="ww-hero__body blur-in">Darwin Corp works with ambitious businesses, founders and teams across the world to create distinctive brands, high-performance websites and digital experiences.</p>
        <div className="ww-hero__actions blur-in">
          <CtaButton href="/start-a-project">Start a project</CtaButton>
          <Link href="/work" className="ww-ghost">Explore our work <span aria-hidden="true">→</span></Link>
        </div>
      </WorldHero>

      <div className="ww-ticker" aria-hidden="true">
        <div className="ww-ticker__track">
          {[0, 1].map((k) => (
            <span key={k}>{TICKER.map((t) => <span key={t}>{t}<i>✦</i></span>)}</span>
          ))}
        </div>
      </div>

      {/* 01 Perspective */}
      <section className="ww-sec ww-split" data-theme="light">
        <span className="ww-aura ww-aura--a" aria-hidden="true" />
        <header className="reveal-up">
          <Tag>01 / Perspective</Tag>
          <h2 className="ww-title">Creative thinking.<br /><span className="ww-grad">Global perspective.</span></h2>
          <p className="ww-serif">Great digital work shouldn&apos;t be limited by geography.</p>
        </header>
        <div className="ww-prose reveal-up">
          <p className="ww-lead">From the first creative conversation to the final launch, we bring strategy, design and technology together to make digital experiences that do more than look impressive. They communicate clearly, connect with people and move businesses forward.</p>
          <p>Our studio is based in Dubai, a city shaped by international business, diverse cultures and a constant drive to innovate. That perspective influences how we approach every project: with an understanding of different audiences, an appreciation for ambitious ideas and a commitment to creating work that feels relevant wherever it is experienced.</p>
          <p>We collaborate remotely with businesses and teams across different markets, bringing creative direction, design and development together through one connected process.</p>
          <p>Whether you&apos;re launching a new business, repositioning an established brand or transforming an existing website, we help turn your vision into a digital experience built for what comes next.</p>
        </div>
      </section>

      {/* 02 Capabilities */}
      <section className="ww-sec" data-theme="light">
        <header className="ww-head reveal-up">
          <div>
            <Tag>02 / Capabilities</Tag>
            <h2 className="ww-title">What we create for<br />businesses worldwide</h2>
          </div>
          <p className="ww-body">We bring creative and technical capabilities together under one roof, giving businesses a connected partner from concept to delivery.</p>
        </header>
        <ul className="ww-cards">
          {CAPABILITIES.map((c, i) => (
            <li key={c.title} className="reveal-up">
              <TiltCard href={c.href} className="ww-card--neon">
                <span className="ww-card__field" style={{ "--a": c.a, "--b": c.b } as CSSProperties} aria-hidden="true">
                  <span className="ww-card__scan" />
                </span>
                <span className="ww-card__top">
                  <span className="ww-card__n">{pad(i + 1)}</span>
                  <span className="ww-card__chip">{c.tag}</span>
                </span>
                <span className="ww-card__copy">
                  <h3 className="ww-card__title">{c.title}</h3>
                  <p className="ww-card__body">{c.body}</p>
                </span>
                <span className="ww-card__go" aria-hidden="true">↗</span>
              </TiltCard>
            </li>
          ))}
        </ul>
        <div className="ww-foot">
          <Link href="/services" className="ww-link">Explore all services <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      {/* 03 How we work */}
      <section className="ww-sec" data-theme="light">
        <div className="ww-panel" data-theme="dark">
          <span className="ww-panel__floor" aria-hidden="true" />
          <span className="ww-panel__glow" aria-hidden="true" />
          <header className="ww-head ww-head--dark reveal-up">
            <div>
              <Tag>03 / How we work</Tag>
              <h2 className="ww-title">Working across borders,<br /><span className="ww-grad ww-grad--neon">without the complexity.</span></h2>
            </div>
            <div className="ww-stack">
              <p className="ww-body">A successful international project needs more than video calls. It needs clear communication, an organised process and a shared understanding of the outcome.</p>
              <p className="ww-body">We&apos;ve structured our way of working to make collaboration straightforward, regardless of where your team is based.</p>
            </div>
          </header>
          <p className="ww-mini">A process built around your team</p>
          <ScrollProgress className="ww-steps">
            <span className="ww-steps__track" aria-hidden="true"><span /></span>
            <ol>
              {STEPS.map((s, i) => (
                <li key={s.title} style={{ ["--i" as string]: i }}>
                  <span className="ww-steps__node" aria-hidden="true" />
                  <span className="ww-steps__n">{pad(i + 1)}</span>
                  <h3 className="ww-steps__title">{s.title}</h3>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
          </ScrollProgress>
          <Link href="/process" className="ww-link ww-link--light">Discover our process <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      {/* 04 Audience */}
      <section className="ww-sec ww-split" data-theme="light">
        <span className="ww-aura ww-aura--b" aria-hidden="true" />
        <header className="reveal-up">
          <Tag>04 / Built around your audience</Tag>
          <h2 className="ww-title">Designed for different markets.<br /><span className="ww-grad">Built around your audience.</span></h2>
          <AudiencePreview />
        </header>
        <div className="ww-prose reveal-up">
          <p>Every market has its own expectations, behaviours and cultural context. A website that works for one audience may need a different approach for another.</p>
          <p>We consider your audience, language, content, industry and business objectives before shaping the experience.</p>
          <p>Whether your project requires an English-language website, multilingual content, right-to-left layouts or a digital presence serving audiences across several regions, we plan those requirements from the beginning.</p>
          <p>Our approach is not to apply the same template everywhere. It&apos;s to create the right digital experience for the people you&apos;re trying to reach.</p>
        </div>
      </section>

      {/* 05 Reach */}
      <section className="ww-sec" data-theme="light">
        <header className="ww-head reveal-up">
          <div>
            <Tag>05 / Our reach</Tag>
            <h2 className="ww-title">Based in Dubai.<br /><span className="ww-grad">Connected to the world.</span></h2>
          </div>
          <p className="ww-body">Dubai is our home and the foundation of our international perspective. We work with businesses across established and emerging markets through remote collaboration and clearly defined project delivery.</p>
        </header>
        <div className="reveal-up"><TimeBar /></div>
        <ul className="ww-markets">
          <li className="ww-market ww-market--home reveal-up">
            <span className="ww-market__k">Our studio / UAE</span>
            <h3 className="ww-market__name">{STUDIO.name}</h3>
            <p>Our home market. Supporting businesses with brand identity, website design, digital experiences and creative development.</p>
            <LocalTime tz={STUDIO.tz} city={STUDIO.city} studio />
          </li>
          {MARKETS.map((m) => (
            <li key={m.name} className="ww-market reveal-up">
              <span className="ww-market__k">{m.kicker}</span>
              <h3 className="ww-market__name">{m.name}</h3>
              <p>{m.body}</p>
              <LocalTime tz={m.tz} city={m.city} />
            </li>
          ))}
        </ul>
        <p className="ww-note">Darwin Corp&apos;s studio is based in Dubai. International projects are delivered remotely; we do not represent these markets as locations of physical offices.</p>
      </section>

      {/* 06 Connected */}
      <section className="ww-sec" data-theme="light">
        <div className="ww-split ww-split--flush">
          <header className="reveal-up">
            <Tag>06 / Connected by design</Tag>
            <h2 className="ww-title">One creative partner.<br /><span className="ww-grad">Connected capabilities.</span></h2>
          </header>
          <div className="ww-prose reveal-up">
            <p>Businesses often work with separate providers for branding, design, development and motion. That can create disconnected experiences and unnecessary complexity.</p>
            <p className="ww-lead">At Darwin, these capabilities work together.</p>
            <p>Your brand identity informs your website. Your website experience reflects your business strategy. Your visual language carries through to motion, content and digital products.</p>
            <p>The result is a more consistent experience, from the first impression to the smallest interaction.</p>
          </div>
        </div>
        <ScrollProgress className="ww-connect">
          <span className="ww-connect__line" aria-hidden="true"><span /></span>
          <ol>
            {["One direction.", "One connected process.", "Work built to evolve."].map((t, i) => (
              <li key={t} style={{ ["--i" as string]: i }}>
                <span className="ww-connect__node" aria-hidden="true" />
                <span className="ww-connect__n">{pad(i + 1)}</span>
                <p className="ww-connect__t">{t}</p>
              </li>
            ))}
          </ol>
        </ScrollProgress>
      </section>

      {/* 07 FAQ */}
      <section className="ww-sec ww-faq" data-theme="light">
        <header className="reveal-up">
          <Tag>07 / Good to know</Tag>
          <h2 className="ww-title">Frequently<br />asked questions</h2>
          <a href="mailto:hello@thedarwin.co" className="ww-mail">hello@thedarwin.co <span aria-hidden="true">↗</span></a>
        </header>
        <div className="ww-qa reveal-up">
          {FAQ.map((f, i) => (
            <details key={f.q} open={i === 0}>
              <summary>
                <span className="ww-qa__n">{pad(i + 1)}</span>
                <span className="ww-qa__q">{f.q}</span>
                <span className="ww-qa__plus" aria-hidden="true" />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Start a project */}
      <section className="ww-sec ww-sec--cta" data-theme="light">
        <div className="ww-cta" data-theme="dark">
          <span className="ww-cta__sun" aria-hidden="true" />
          <span className="ww-panel__floor" aria-hidden="true" />
          <div className="ww-cta__inner">
            <Tag>Wherever you are, let&apos;s begin.</Tag>
            <h2 className="ww-cta__title reveal-up">Your next idea could<br /><span className="ww-grad ww-grad--neon">come from anywhere.</span></h2>
            <div className="ww-cta__row">
              <div className="reveal-up">
                <p className="ww-serif ww-serif--light">Let&apos;s make something worth choosing.</p>
                <p className="ww-body">You bring the ambition. We&apos;ll bring the creative thinking, design and technology to make it happen.</p>
                <p className="ww-body">Whether you&apos;re building a new brand, developing a website or rethinking your digital presence, let&apos;s explore what&apos;s possible.</p>
              </div>
              <CtaButton href="/start-a-project">Start a project</CtaButton>
            </div>
          </div>
        </div>
      </section>

      <ContactFooter hideCta />
    </main>
  );
}
