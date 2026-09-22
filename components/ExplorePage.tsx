import Link from "next/link";
import ContactFooter from "@/components/ContactFooter";
import StructuredData from "@/components/StructuredData";
import { absoluteUrl, breadcrumbData, SITE_URL } from "@/lib/seo";
import type { ContentLink, LandingPage } from "@/lib/content/types";
import portfolio from "@/lib/content/portfolio.json";
import styles from "./ExplorePage.module.css";

export function LinkCards({ links }: { links: ContentLink[] }) {
  return <div className={styles.links}>{links.map((link, i) => <Link className={styles.linkCard} key={link.href} href={link.href}>
    <span className={styles.number}>{String(i + 1).padStart(2, "0")} <span aria-hidden="true">↗</span></span>
    <h3>{link.label}</h3>{link.description && <p>{link.description}</p>}
  </Link>)}</div>;
}

export function PageBreadcrumbs({ items }: { items: ContentLink[] }) {
  return <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><ol>{items.map((item, i) => <li key={item.href}>
    {i === items.length - 1 ? <span aria-current="page">{item.label}</span> : <Link href={item.href}>{item.label}</Link>}
  </li>)}</ol></nav>;
}

export function ExploreIndex({ title, heading, description, path, links, children }: {
  title: string; heading: string; description: string; path: string; links: ContentLink[]; children?: React.ReactNode;
}) {
  const crumbs = [{ label: "Home", href: "/" }, { label: title, href: path }];
  return <main className={styles.page}>
    <StructuredData data={breadcrumbData(crumbs)} />
    <section className={styles.index} data-theme="light">
      <PageBreadcrumbs items={crumbs} />
      <span className={styles.eyebrow}>Darwin Corp · {title}</span>
      <h1>{heading}</h1><p className={styles.lead}>{description}</p>
      <LinkCards links={links} />{children}
    </section><ContactFooter />
  </main>;
}

export default function ExplorePage({ page, path, parent, service = false, children }: {
  page: LandingPage; path: string; parent: ContentLink; service?: boolean; children?: React.ReactNode;
}) {
  const crumbs = [{ label: "Home", href: "/" }, ...(parent.href === "/" ? [] : [parent]), { label: page.title, href: path }];
  const projects = portfolio.filter(p => page.projects?.includes(p.slug));
  return <main className={styles.page}>
    <StructuredData data={breadcrumbData(crumbs)} />
    {service && <StructuredData data={{ "@context": "https://schema.org", "@type": "Service", name: page.title, description: page.description,
      url: absoluteUrl(path), provider: { "@id": `${SITE_URL}/#organization` } }} />}
    <section className={styles.hero} data-theme="light">
      <PageBreadcrumbs items={crumbs} />
      <div className={styles.heroGrid}><div>
        <span className={styles.eyebrow}>{page.eyebrow}</span>
        <h1>{page.heading}</h1><p className={styles.lead}>{page.description}</p>
        <div className={styles.actions}><Link className={styles.button} href="/start-a-project">Start a project <span aria-hidden="true">↗</span></Link><Link className={styles.textLink} href="#overview">Explore the approach ↓</Link></div>
      </div><figure className={styles.heroMedia}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={page.image} alt={page.imageAlt} fetchPriority="high" />
        <figcaption>Darwin Corp <span>Designed to evolve.</span></figcaption>
      </figure></div>
    </section>
    <section className={styles.section} data-theme="light" id="overview">
      <div className={styles.sectionHead}><span className={styles.eyebrow}>The thinking</span><p className={styles.intro}>{page.intro}</p></div>
      <div className={styles.features}>{page.sections.map((section, i) => <article key={section.title}>
        <span className={styles.number}>{String(i + 1).padStart(2, "0")}</span><h2>{section.title}</h2><p>{section.body}</p>
        {section.items && <ul>{section.items.map(item => <li key={item}>{item}</li>)}</ul>}
      </article>)}</div>
    </section>
    <section className={styles.dark} data-theme="dark"><div><span className={styles.eyebrow}>From idea to delivery</span><h2>{page.scope.title}</h2><p>{page.scope.body}</p><Link className={styles.textLink} href="/process">Our process ↗</Link></div>
      <ul className={styles.scope}>{page.scope.items.map((item, i) => <li key={item}><span>{String(i + 1).padStart(2, "0")}</span>{item}</li>)}</ul>
    </section>
    {children}
    {projects.length > 0 && <section className={styles.section} data-theme="light"><span className={styles.eyebrow}>Selected Darwin work</span><h2 className={styles.sectionTitle}>Ideas put into practice.</h2>
      <div className={styles.projects}>{projects.map(project => <Link key={project.slug} href={`/cases/${project.slug}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={project.cover} alt={`${project.title} project by Darwin Corp`} loading="lazy" />
        <span>{project.category}</span><h3>{project.title} ↗</h3><p>{project.services.join(" · ")}</p>
      </Link>)}</div>
    </section>}
    {page.faqs.length > 0 && <section className={styles.section} data-theme="light"><span className={styles.eyebrow}>Good questions</span><h2 className={styles.sectionTitle}>Before we begin.</h2>
      <div className={styles.faqs}>{page.faqs.map(faq => <details key={faq.q}><summary>{faq.q}<span aria-hidden="true">+</span></summary><p>{faq.a}</p></details>)}</div>
    </section>}
    <section className={styles.section} data-theme="light"><span className={styles.eyebrow}>Keep exploring</span><h2 className={styles.sectionTitle}>The bigger picture.</h2><LinkCards links={page.related} /></section>
    <section className={styles.cta} data-theme="dark"><span className={styles.eyebrow}>Your next chapter</span><h2>Let’s make something<br /><em>worth choosing.</em></h2><Link className={styles.button} href="/start-a-project">Tell us about your project ↗</Link></section>
    <ContactFooter hideCta />
  </main>;
}
