import Link from "next/link";
import { notFound } from "next/navigation";
import ContactFooter from "@/components/ContactFooter";
import { SERVICES, getService } from "@/lib/services";

export function generateStaticParams() {
  // brand-identity has its own bespoke page (app/services/brand-identity)
  return SERVICES.filter((s) => s.slug !== "brand-identity").map((s) => ({
    slug: s.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const svc = getService(slug);
  if (!svc) return { title: "Services" };
  return {
    title: `${svc.title} in Dubai`,
    description: svc.summary,
    alternates: { canonical: `/services/${slug}` },
  };
}

export default async function ServiceDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const svc = getService(slug);
  if (!svc) notFound();

  const others = SERVICES.filter((s) => s.slug !== svc.slug);

  return (
    <main className="svcp">
      <section className="svcp__hero" data-theme="light">
        <Link href="/services" className="svcp__back">← Services</Link>
        <span className="svcp__eyebrow">{svc.tagline}</span>
        <h1 className="svcp__title">{svc.title}</h1>
        <p className="svcp__sub">{svc.heroSubtitle}</p>
        <div className="svcp__cta">
          <Link href="/contact" className="svcp__btn svcp__btn--dark">Start a project</Link>
          <Link href="/work" className="svcp__btn svcp__btn--ghost">See our work</Link>
        </div>
      </section>

      <div className="svcp__cover reveal-up" data-theme="light">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={svc.cover} alt={svc.title} />
      </div>

      <section className="svcp__body" data-theme="light">
        <div className="svcp__overview reveal-up">
          <h2>What&apos;s included</h2>
          <p>{svc.overview}</p>
          <ul className="svcp__caps">
            {svc.capabilities.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>

        <div className="svcp__features">
          {svc.features.map((f, i) => (
            <div key={f.title} className="svcp__feature reveal-up">
              <span className="svcp__feature-n">0{i + 1}</span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>

        <div className="svcp__more reveal-up">
          <span className="svcp__more-label">More services</span>
          <div className="svcp__more-links">
            {others.map((o) => (
              <Link key={o.slug} href={`/services/${o.slug}`} className="svcp__more-link">
                {o.title}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h13M12 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ContactFooter />
    </main>
  );
}
