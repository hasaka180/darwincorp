import ContactFooter from "@/components/ContactFooter";

export const metadata = { title: "Services — Darwin Corp" };

const ICON = {
  brand: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 3.2L17.5 8 12 10.8 6.5 8 12 5.2Z" />
    </svg>
  ),
  web: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 5l-2 14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2c.7 4.8 4.5 8.6 9.3 9.3-4.8.7-8.6 4.5-9.3 9.3-.7-4.8-4.5-8.6-9.3-9.3C7.5 10.6 11.3 6.8 12 2Z" />
    </svg>
  ),
};

const SERVICES = [
  {
    icon: ICON.brand,
    title: "Brand Identity",
    tagline: "Visual Systems · Logo Design · Brand Strategy",
    desc: "We design brands, systems, and experiences that feel intentional from the first tap to the last interaction.",
    caps: ["Identity Branding", "UI Design", "Art Direction", "Creative Direction"],
  },
  {
    icon: ICON.web,
    title: "Website Development",
    tagline: "Web Design · Development · Webflow",
    desc: "From concept to launch, we build fast, accessible sites and products engineered to scale with your brand.",
    caps: ["Web Design", "Frontend Engineering", "Webflow", "CMS & Headless"],
  },
  {
    icon: ICON.ai,
    title: "AI Creatives",
    tagline: "AI Art Direction · Motion Design · Generative AI",
    desc: "We blend art direction with generative tooling to produce striking, on-brand visuals at the speed of culture.",
    caps: ["AI Art Direction", "Motion Design", "3D & Render", "Post Production"],
  },
];

export default function ServicesPage() {
  return (
    <main>
      <section className="subpage" data-theme="light">
        <header className="subpage__head">
          <span className="subpage__eyebrow">Services</span>
          <h1 className="subpage__title">What we do.</h1>
        </header>

        <div className="svc-grid">
          {SERVICES.map((s) => (
            <div key={s.title} className="svc-card">
              <span className="svc-card__icon">{s.icon}</span>
              <h3>{s.title}</h3>
              <p className="svc-card__tag">{s.tagline}</p>
              <p className="svc-card__desc">{s.desc}</p>
              <ul className="svc-card__caps">
                {s.caps.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <ContactFooter />
    </main>
  );
}
