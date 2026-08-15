import Link from "next/link";
import ContactFooter from "@/components/ContactFooter";
import { SERVICES } from "@/lib/services";

export const metadata = { title: "Services — Darwin Corp" };

export default function ServicesPage() {
  return (
    <main>
      <section className="subpage" data-theme="light">
        <header className="subpage__head reveal-up">
          <span className="subpage__eyebrow">Services</span>
          <h1 className="subpage__title">What we do.</h1>
        </header>

        <div className="svc-rows">
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className="svc-row reveal-up"
            >
              <div className="svc-row__text">
                <h2 className="svc-row__title">
                  <span className="svc-row__num">[ {s.num} ]</span> {s.title}
                </h2>
                <p className="svc-row__desc">{s.summary}</p>
                <span className="svc-row__preview">
                  Explore
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
              <div className="svc-row__media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.cover} alt={s.title} loading="lazy" />
              </div>
            </Link>
          ))}
        </div>
      </section>
      <ContactFooter />
    </main>
  );
}
