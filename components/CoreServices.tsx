"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type Service = {
  id: string;
  name: string;
  tagline: string;
  blurb: string;
  capabilities: string[];
  accent: string;
  icon: ReactNode;
  video: string;
  poster: string;
};

const Arrow = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h13M12 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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

// Everyday's toolbox — short monogram tiles in each tool's brand colours.
type Tool = { label: string; color: string; bg: string };
const TOOLS: Tool[] = [
  { label: "Fr", color: "#ffffff", bg: "#0e0e10" },
  { label: "Ae", color: "#9999ff", bg: "#00005b" },
  { label: "Ai", color: "#ff9a00", bg: "#330000" },
  { label: "Ps", color: "#31a8ff", bg: "#001e36" },
  { label: "Pr", color: "#ea77ff", bg: "#2a0a3a" },
  { label: "Fig", color: "#f24e1e", bg: "#0e0e10" },
  { label: "DR", color: "#d8d8d8", bg: "#161616" },
  { label: "MJ", color: "#ffffff", bg: "#0e0e10" },
  { label: "CC", color: "#ffffff", bg: "#0e0e10" },
  { label: "Jt", color: "#ffffff", bg: "#0e0e10" },
  { label: "Rw", color: "#ffffff", bg: "#0e0e10" },
  { label: "C4D", color: "#7d9bff", bg: "#0e0e10" },
  { label: "Bl", color: "#ea7600", bg: "#0e0e10" },
  { label: "Sp", color: "#ff6b9a", bg: "#0e0e10" },
];

const SERVICES: Service[] = [
  {
    id: "brand",
    name: "Brand Identity",
    tagline: "Visual Systems · Logo Design · Brand Strategy",
    blurb:
      "We design brands, systems, and experiences that feel intentional from the first tap to the last interaction.",
    capabilities: [
      "Identity Branding",
      "UX Design / Research",
      "UI Design",
      "UX Copywriting",
      "Art Direction",
      "Creative Direction",
      "Interactive Design",
    ],
    accent: "#3b6fff",
    icon: ICON.brand,
    video: "/video/brand-identity.mp4",
    poster: "/video/brand-identity.png",
  },
  {
    id: "web",
    name: "Website Development",
    tagline: "Web Design · Development · Webflow",
    blurb:
      "From concept to launch, we build fast, accessible sites and products engineered to scale with your brand.",
    capabilities: [
      "Web Design",
      "CMS & Headless",
      "Frontend Engineering",
      "Performance",
      "Webflow",
      "Motion & Interaction",
      "Maintenance",
    ],
    accent: "#3b6fff",
    icon: ICON.web,
    video: "/video/website.mp4",
    poster: "/video/website.jpg",
  },
  {
    id: "ai",
    name: "AI Creatives",
    tagline: "AI Art Direction · Motion Design · Generative AI",
    blurb:
      "We blend art direction with generative tooling to produce striking, on-brand visuals at the speed of culture.",
    capabilities: [
      "AI Art Direction",
      "3D & Render",
      "Generative Imagery",
      "Concept Development",
      "Motion Design",
      "Prompt Systems",
      "Post Production",
    ],
    accent: "#ff5b3a",
    icon: ICON.ai,
    video: "/video/ai-generative.mp4",
    poster: "/video/ai-generative.png",
  },
];

function ServiceCard({ s, onOpen }: { s: Service; onOpen: () => void }) {
  const vref = useRef<HTMLVideoElement>(null);

  const play = () => vref.current?.play().catch(() => {});
  const stop = () => vref.current?.pause();

  return (
    <button
      type="button"
      className="service"
      style={{ "--accent": s.accent } as CSSProperties}
      onMouseEnter={play}
      onMouseLeave={stop}
      onFocus={play}
      onBlur={stop}
      onClick={onOpen}
      aria-label={`Open ${s.name}`}
    >
      <span className="service__media">
        <video ref={vref} muted loop playsInline preload="none" poster={s.poster}>
          <source src={s.video} type="video/mp4" />
        </video>
      </span>
      <span className="service__scrim" />
      <span className="service__body">
        <span className="service__icon">{s.icon}</span>
        <span className="service__title">{s.name}</span>
        <span className="service__tags">{s.tagline}</span>
        <span className="service__rule" />
      </span>
      <span className="service__go" aria-hidden="true">
        {Arrow}
      </span>
    </button>
  );
}

function ServiceDetail({
  service,
  others,
  open,
  onClose,
  onSwitch,
}: {
  service: Service | null;
  others: Service[];
  open: boolean;
  onClose: () => void;
  onSwitch: (id: string) => void;
}) {
  const vref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = vref.current;
    if (open && v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  }, [open, service?.id]);

  return (
    <div
      className={`service-detail ${open ? "is-open" : ""}`}
      style={service ? ({ "--accent": service.accent } as CSSProperties) : undefined}
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
    >
      {service && (
        <>
          <button className="detail__close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>

          <div className="service-detail__inner">
            <div className="detail__text">
              <h3 className="detail__title">{service.name}</h3>
              <p className="detail__desc">{service.blurb}</p>
              <div className="detail__caps">
                {service.capabilities.map((c) => (
                  <span className="detail__cap" key={c}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path d="M5 12h13M12 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="detail__media">
              <video
                ref={vref}
                key={service.id}
                muted
                loop
                playsInline
                autoPlay
                poster={service.poster}
              >
                <source src={service.video} type="video/mp4" />
              </video>
            </div>

            <div className="detail__switch">
              {others.map((o) => (
                <button
                  key={o.id}
                  className="detail__switch-item"
                  onClick={() => onSwitch(o.id)}
                >
                  {o.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function CoreServices() {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveId(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [activeId]);

  const active = SERVICES.find((s) => s.id === activeId) ?? null;
  const others = SERVICES.filter((s) => s.id !== activeId);

  return (
    <section ref={ref} className={`services ${inView ? "is-in" : ""}`}>
      <header className="services__head">
        <span className="services__eyebrow reveal">
          [ Services &amp; Expertise ]
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 16.5 5.5 10l1.4-1.4L12 13.7l5.1-5.1L18.5 10 12 16.5Z" />
          </svg>
        </span>
        <h2 className="services__title reveal" style={{ transitionDelay: "0.08s" }}>
          Digital Design Powerhouse
        </h2>
        <p className="services__sub reveal" style={{ transitionDelay: "0.16s" }}>
          Over the last decade, we&apos;ve refined a wide range of skills in
          digital design, offering services mastered to perfection and always
          driven by the purpose of motion.
        </p>
      </header>

      <div className="services__grid">
        {SERVICES.map((s, i) => (
          <div
            key={s.id}
            className="service-cell reveal"
            style={{ transitionDelay: `${0.24 + i * 0.1}s` }}
          >
            <ServiceCard s={s} onOpen={() => setActiveId(s.id)} />
          </div>
        ))}
      </div>

      <div className="toolbox reveal" style={{ transitionDelay: "0.5s" }}>
        <div className="toolbox__intro">
          <span className="toolbox__title">Everyday&apos;s Toolbox</span>
          <span className="toolbox__sub">Mastered for every project.</span>
        </div>
        <div className="toolbox__marquee">
          <div className="toolbox__track">
            {[...TOOLS, ...TOOLS].map((t, i) => (
              <span
                key={i}
                className="tool"
                style={{ color: t.color, background: t.bg }}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="collab reveal" style={{ transitionDelay: "0.6s" }}>
        <span className="collab__label">In collaboration with</span>
        <div className="collab__logos">
          {[
            { src: "/assets/claude.webp", alt: "Claude" },
            { src: "/assets/webflow.svg", alt: "Webflow" },
            { src: "/assets/higgsfield.png", alt: "Higgsfield" },
          ].map((l) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={l.alt} className="collab__logo" src={l.src} alt={l.alt} loading="lazy" />
          ))}
        </div>
      </div>

      <ServiceDetail
        service={active}
        others={others}
        open={Boolean(active)}
        onClose={() => setActiveId(null)}
        onSwitch={(id) => setActiveId(id)}
      />
    </section>
  );
}
