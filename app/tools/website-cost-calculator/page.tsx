import Link from "next/link";
import ContactFooter from "@/components/ContactFooter";
import StructuredData from "@/components/StructuredData";
import { PageBreadcrumbs } from "@/components/ExplorePage";
import WebsiteCostCalculator from "@/components/tools/WebsiteCostCalculator";
import { PRICES, SITE_TYPES, formatRange } from "@/lib/tools/website-cost";
import { absoluteUrl, breadcrumbData, pageMetadata, SITE_URL } from "@/lib/seo";
import styles from "@/components/ExplorePage.module.css";

const PATH = "/tools/website-cost-calculator";
const TITLE = "Website Cost Calculator Dubai";
const DESCRIPTION = "How much does a website cost in Dubai? Estimate a new website or redesign in AED, from starter sites to e-commerce, with add-ons and branding. Free, instant and no sign-up.";

export const metadata = pageMetadata(TITLE, DESCRIPTION, PATH);

const { starter, business, ecommerce } = SITE_TYPES;
const r = formatRange;

// Answers quote the live price list, so they never drift from the calculator.
const FAQS = [
  { q: "How much does a website cost in Dubai?", a: `With Darwin, a starter website of up to 5 pages is ${r(starter.price)}, a business website of 10–15 pages is ${r(business.price)} and an e-commerce site is ${r(ecommerce.price)}. Extra pages, a second language, copywriting, booking and motion add to that, and the calculator above totals them for you.` },
  { q: "Is the estimate a quote?", a: "No. It is an indicative range based on typical projects. Your proposal is quoted against the agreed scope, review stages and deliverables, which can move the figure in either direction." },
  { q: "How much does an Arabic version add?", a: `A second language adds about ${Math.round(PRICES.languageShare * 100)}% of the build, and at least ${r({ low: PRICES.languageMin, high: PRICES.languageMin })}. It covers the right-to-left layout, the second content set and testing both versions. Translation itself is quoted separately.` },
  { q: "How much does a website redesign cost?", a: "A redesign is priced like a new build of the same size, because the design and development work is similar. Reusing existing content can save on copywriting, while migrating a large amount of content can add to the scope." },
  { q: "Are hosting, domains and maintenance included?", a: "They are listed separately in the proposal. Recurring costs can include hosting, the domain, CMS or app plans and ongoing support, and who is responsible for each is agreed before launch." },
];

const FACTORS = [
  { title: "Pages and templates", body: "The number of pages, and how many need their own layout, is the biggest driver. Ten pages built from three templates cost less than ten unique designs." },
  { title: "Content", body: "Whether you supply the words and images or need them written and produced. Copywriting is priced per page so it scales with the site." },
  { title: "Functionality", body: "A CMS, booking, payments, an online shop or integrations with the tools you already use. Ready-made tools cost far less than custom systems." },
  { title: "Languages", body: "A bilingual Arabic and English site needs a right-to-left layout and a second content set, not just a translated menu." },
  { title: "Motion and 3D", body: "Signature animation and interactive 3D make a site memorable, and are scoped around the actual concept." },
  { title: "Brand readiness", body: "A site built on a clear identity moves faster. If the brand needs work first, it can be designed alongside the website." },
];

export default function Page() {
  const crumbs = [{ label: "Home", href: "/" }, { label: "Tools", href: "/tools" }, { label: "Website Cost Calculator", href: PATH }];
  return <main className={styles.page}>
    <StructuredData data={breadcrumbData(crumbs)} />
    <StructuredData data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "Website Cost Calculator", url: absoluteUrl(PATH), description: DESCRIPTION,
      applicationCategory: "BusinessApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: 0, priceCurrency: "AED" }, provider: { "@id": `${SITE_URL}/#organization` } }} />
    <StructuredData data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />

    <section className={styles.index} data-theme="light" style={{ minHeight: 0 }}>
      <PageBreadcrumbs items={crumbs} />
      <span className={styles.eyebrow}>Darwin Corp · Tools</span>
      <h1>What will your website cost?</h1>
      <p className={styles.lead}>Answer six quick questions for an instant estimate in AED, based on how we price real projects in Dubai and the UAE. When it looks right, send it to us for an exact proposal.</p>
    </section>

    <section className={styles.section} data-theme="light" style={{ paddingTop: 0 }}>
      <WebsiteCostCalculator />
    </section>

    <section className={styles.section} data-theme="light">
      <div className={styles.sectionHead}><span className={styles.eyebrow}>What affects the price</span><p className={styles.intro}>The right budget follows the job your website needs to do.</p></div>
      <div className={styles.features}>{FACTORS.map((f, i) => <article key={f.title}>
        <span className={styles.number}>{String(i + 1).padStart(2, "0")}</span><h2>{f.title}</h2><p>{f.body}</p>
      </article>)}</div>
    </section>

    <section className={styles.section} data-theme="light"><span className={styles.eyebrow}>Good questions</span><h2 className={styles.sectionTitle}>Website costs, answered.</h2>
      <div className={styles.faqs}>{FAQS.map(faq => <details key={faq.q}><summary>{faq.q}<span aria-hidden="true">+</span></summary><p>{faq.a}</p></details>)}</div>
    </section>

    <section className={styles.cta} data-theme="dark"><span className={styles.eyebrow}>Your next chapter</span><h2>Let’s make something<br /><em>worth choosing.</em></h2><Link className={styles.button} href="/start-a-project">Tell us about your project ↗</Link></section>
    <ContactFooter hideCta />
  </main>;
}
