"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type Tag = { label: string; hot?: boolean };
type Step = {
  title: string;
  days: string;
  desc: string;
  icon: ReactNode;
  tags: Tag[];
  mt: string; // staggered vertical offset for the body
};

const ICON = {
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.6-4.6" strokeLinecap="round" />
    </svg>
  ),
  target: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="11" cy="13" r="8" />
      <circle cx="11" cy="13" r="3.5" />
      <path d="m14 10 5-5M16 5h3v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  bulb: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M9.5 18h5M10.5 21h3" strokeLinecap="round" />
      <path d="M12 3a6 6 0 0 0-4 10.4c.8.8 1 1.4 1 2.6h6c0-1.2.2-1.8 1-2.6A6 6 0 0 0 12 3Z" strokeLinejoin="round" />
    </svg>
  ),
  pen: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 4 6 10l-1.5 6L10 14l6-6-4-4Z" strokeLinejoin="round" />
      <circle cx="17.5" cy="6.5" r="1.8" />
    </svg>
  ),
  people: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="8.5" cy="9" r="3" />
      <circle cx="16" cy="9.5" r="2.4" />
      <path d="M3.5 19c0-2.6 2.2-4.2 5-4.2s5 1.6 5 4.2M14.5 18.6c.2-2 1.7-3.2 3.8-3.2 1.6 0 2.9.7 3.4 2" strokeLinecap="round" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2c.6 4 3.4 6.8 7.4 7.4-4 .6-6.8 3.4-7.4 7.4-.6-4-3.4-6.8-7.4-7.4C8.6 8.8 11.4 6 12 2Z" />
    </svg>
  ),
};

// Per-phase white vector animations for the glass panels.
const VISUALS: ReactNode[] = [
  // 01 Research — scanning magnifier
  <svg key="v0" className="proc__vec" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
    <circle className="pv-dot pv-dot--a" cx="28" cy="30" r="1.8" />
    <circle className="pv-dot pv-dot--b" cx="72" cy="34" r="1.8" />
    <circle className="pv-dot pv-dot--c" cx="66" cy="70" r="1.8" />
    <g className="pv-search">
      <circle cx="0" cy="0" r="12" />
      <line x1="8.5" y1="8.5" x2="18" y2="18" />
    </g>
  </svg>,
  // 02 Strategy — arrow into target
  <svg key="v1" className="proc__vec" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
    <circle cx="50" cy="50" r="22" />
    <circle cx="50" cy="50" r="13" />
    <circle className="pv-bull" cx="50" cy="50" r="2.6" />
    <g className="pv-arrow">
      <line x1="28" y1="72" x2="47" y2="53" />
      <path d="M47 53 41.5 54M47 53 46 58.5" />
    </g>
  </svg>,
  // 03 Concept — lightbulb switching on
  <svg key="v2" className="proc__vec" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
    <g className="pv-rays">
      <line x1="50" y1="6" x2="50" y2="12" />
      <line x1="35" y1="10" x2="39" y2="16" />
      <line x1="65" y1="10" x2="61" y2="16" />
      <line x1="26" y1="23" x2="33" y2="26" />
      <line x1="74" y1="23" x2="67" y2="26" />
    </g>
    <g className="pv-bulb">
      <path d="M50 24a15 15 0 0 0-9.5 26.6c1.7 1.7 2.1 2.7 2.1 5.4h14.8c0-2.7.4-3.7 2.1-5.4A15 15 0 0 0 50 24Z" />
      <path d="M45 60h10M46.5 65h7" />
    </g>
  </svg>,
  // 04 Design — a curve being drawn
  <svg key="v3" className="proc__vec" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
    <path className="pv-draw" d="M22 66 C 34 32 58 32 70 64" pathLength={100} />
    <path d="M18 70 26 64 24 70Z" />
  </svg>,
  // 05 Build — blocks stacking up
  <svg key="v4" className="proc__vec" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
    <rect className="pv-block pv-block--1" x="35" y="58" width="30" height="11" rx="2.5" />
    <rect className="pv-block pv-block--2" x="35" y="44" width="30" height="11" rx="2.5" />
    <rect className="pv-block pv-block--3" x="35" y="30" width="30" height="11" rx="2.5" />
  </svg>,
  // 06 Launch — rocket lift-off
  <svg key="v5" className="proc__vec" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
    <g className="pv-rocket">
      <path d="M50 26c6.5 2.6 10.5 9 10.5 17L56 51H44l-4.5-8C39.5 35 43.5 28.6 50 26Z" />
      <circle cx="50" cy="40" r="3" />
      <path d="M44 51c-2.5 1.5-3.5 5-3.5 5s3.5-.6 5-2.2M56 51c2.5 1.5 3.5 5 3.5 5s-3.5-.6-5-2.2" />
    </g>
    <g className="pv-trail">
      <line x1="50" y1="60" x2="50" y2="66" />
      <line x1="44" y1="60" x2="44" y2="64" />
      <line x1="56" y1="60" x2="56" y2="64" />
    </g>
  </svg>,
];

const STEPS: Step[] = [
  {
    title: "Research",
    days: "1 Week",
    desc: "We dig into people, market, and context to uncover the real opportunities worth pursuing.",
    icon: ICON.search,
    mt: "6%",
    tags: [
      { label: "Market Research", hot: true },
      { label: "User Interviews" },
      { label: "Competitor Analysis" },
      { label: "Data Synthesis" },
    ],
  },
  {
    title: "Strategy",
    days: "1 Week",
    desc: "We define the right problems to solve and set a clear, confident direction for the work ahead.",
    icon: ICON.target,
    mt: "30%",
    tags: [
      { label: "Goals" },
      { label: "Positioning", hot: true },
      { label: "Roadmap" },
      { label: "Functional Scope" },
    ],
  },
  {
    title: "Concept",
    days: "2 Weeks",
    desc: "We explore bold ideas and shape them into clear, ownable creative directions.",
    icon: ICON.bulb,
    mt: "16%",
    tags: [
      { label: "Ideation" },
      { label: "Moodboards" },
      { label: "Concepts", hot: true },
      { label: "Direction" },
    ],
  },
  {
    title: "Design",
    days: "3 Weeks",
    desc: "We craft elegant, intuitive interfaces and systems with obsessive attention to detail.",
    icon: ICON.pen,
    mt: "34%",
    tags: [
      { label: "Wireframes" },
      { label: "UI Design", hot: true },
      { label: "Prototype" },
      { label: "Design System" },
    ],
  },
  {
    title: "Build",
    days: "4 Weeks",
    desc: "We bring it to life through tight collaboration, engineering, and relentless iteration.",
    icon: ICON.people,
    mt: "12%",
    tags: [
      { label: "Development", hot: true },
      { label: "Integration" },
      { label: "QA" },
      { label: "Iteration" },
    ],
  },
  {
    title: "Launch",
    days: "Ongoing",
    desc: "We ship with purpose, then keep improving based on real-world impact and data.",
    icon: ICON.spark,
    mt: "24%",
    tags: [
      { label: "Go-Live", hot: true },
      { label: "Analytics" },
      { label: "Optimization" },
      { label: "Evolve" },
    ],
  },
];

export default function WhatWeDo() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    let raf = 0;
    const update = () => {
      raf = 0;

      // Mobile: no horizontal scroll — just show everything.
      if (window.innerWidth <= 900) {
        track.style.transform = "";
        colRefs.current.forEach((c) => c?.classList.add("is-on"));
        return;
      }

      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      const p = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;

      const dist = Math.max(track.scrollWidth - window.innerWidth, 0);
      track.style.transform = `translate3d(${-p * dist}px, 0, 0)`;

      // Reveal each column as it slides into view.
      colRefs.current.forEach((col) => {
        if (col) {
          col.classList.toggle(
            "is-on",
            col.getBoundingClientRect().left < window.innerWidth * 0.82
          );
        }
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={sectionRef} className="proc">
      <div className="proc__sticky">
        <div className="proc__bg" aria-hidden="true" />
        <div ref={trackRef} className="proc__track">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              ref={(el) => {
                colRefs.current[i] = el;
              }}
              className="proc__col"
              style={{ "--mt": s.mt } as CSSProperties}
            >
              <div className="proc__visual" aria-hidden="true">
                <span className="proc__blob proc__blob--1" />
                <span className="proc__blob proc__blob--2" />
                {VISUALS[i]}
              </div>

              <div className="proc__content">
                <div className="proc__col-head">
                  <span className="proc__icon">{s.icon}</span>
                  <span className="proc__days">{s.days}</span>
                </div>
                <div className="proc__col-body">
                  <span className="proc__stepn">
                    Step {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="proc__title">{s.title}</h3>
                  <div className="proc__tags">
                    {s.tags.map((t) => (
                      <span
                        key={t.label}
                        className={`proc__tag ${t.hot ? "is-hot" : ""}`}
                      >
                        {t.label}
                      </span>
                    ))}
                  </div>
                  <p className="proc__desc">{s.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
