"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const ProcessStageScene = dynamic(() => import("./ProcessStageScene"), { ssr: false });

type Step = {
  title: string;
  headline: string;
  days: string;
  desc: string;
  tags: { label: string; hot?: boolean }[];
};

const STEPS: Step[] = [
  {
    title: "Research",
    headline: "Understand people.\nUncover possibilities.",
    days: "1 Week",
    desc: "We dig into people, market, and context to uncover the real opportunities worth pursuing.",
    tags: [
      { label: "Market Research", hot: true },
      { label: "User Interviews" },
      { label: "Competitor Analysis" },
      { label: "Data Synthesis" },
    ],
  },
  {
    title: "Strategy",
    headline: "A clear direction.\nA stronger foundation.",
    days: "1 Week",
    desc: "We define the right problems to solve and set a clear, confident direction for the work ahead.",
    tags: [
      { label: "Goals" },
      { label: "Positioning", hot: true },
      { label: "Roadmap" },
      { label: "Functional Scope" },
    ],
  },
  {
    title: "Concept",
    headline: "Bold ideas.\nMade tangible.",
    days: "2 Weeks",
    desc: "We explore bold ideas and shape them into clear, ownable creative directions.",
    tags: [
      { label: "Ideation" },
      { label: "Moodboards" },
      { label: "Concepts", hot: true },
      { label: "Direction" },
    ],
  },
  {
    title: "Design",
    headline: "Every detail.\nConsidered.",
    days: "3 Weeks",
    desc: "We craft elegant, intuitive interfaces and systems with obsessive attention to detail.",
    tags: [
      { label: "Wireframes" },
      { label: "UI Design", hot: true },
      { label: "Prototype" },
      { label: "Design System" },
    ],
  },
  {
    title: "Build",
    headline: "Built with care.\nReady for the real world.",
    days: "4 Weeks",
    desc: "We bring it to life through tight collaboration, engineering, and relentless iteration.",
    tags: [
      { label: "Development", hot: true },
      { label: "Integration" },
      { label: "QA" },
      { label: "Iteration" },
    ],
  },
  {
    title: "Launch",
    headline: "A purposeful launch.\nAn evolving partnership.",
    days: "Ongoing",
    desc: "We ship with purpose, then keep improving based on real-world impact and data.",
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
  const stickyRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const objectRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const distance = section.offsetHeight - sticky.offsetHeight;
      const progress = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / Math.max(1, distance)));
      // Hold the opening and closing poses; each stage has equal reading time.
      progressRef.current = Math.min(5, Math.max(0, progress * 6 - 0.5));
      setActive(Math.round(progressRef.current));
      sticky.style.setProperty("--process-progress", String(progress));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(section);
    observer.observe(sticky);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const goToStep = (index: number) => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    // Native document scrolling also works when Lenis is unavailable.
    window.scrollTo({ top: top + ((index + 0.5) / 6) * (section.offsetHeight - sticky.offsetHeight), behavior: "instant" });
  };

  return (
    <section ref={sectionRef} className="proc" aria-label="Our process">
      <div ref={stickyRef} className="proc__sticky" data-step={STEPS[active].title}>
        <div className="proc__bg" aria-hidden="true">
          <ProcessStageScene progressRef={progressRef} anchorRef={objectRef} />
          <span className="proc__scrim" />
        </div>
        <header className="proc__masthead">
          <span className="proc__kicker">
            [ How we work ]
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 16.5 5.5 10l1.4-1.4L12 13.7l5.1-5.1L18.5 10 12 16.5Z" />
            </svg>
          </span>
          <span>From first question to what’s next</span>
        </header>
        <div className="proc__layout">
          <div className="proc__stories">
            {STEPS.map((step, index) => (
              <article key={step.title} className={`proc__story${active === index ? " is-active" : ""}${index < active ? " is-past" : ""}`} aria-hidden={active !== index}>
                <div className="proc__eyebrow"><span>{step.title}</span><span>{step.days}</span></div>
                <h2 className="proc__headline">{step.headline}</h2>
                <p className="proc__summary">{step.desc}</p>
                <div className="proc__deliverables">
                  {step.tags.map(tag => <span key={tag.label} className={tag.hot ? "is-highlighted" : undefined}>{tag.label}</span>)}
                </div>
              </article>
            ))}
          </div>
          <nav className="proc__rail" aria-label="Process stages">
            <span className="proc__rail-line" aria-hidden="true" />
            {STEPS.map((step, index) => (
              <button key={step.title} type="button" className={`proc__stop${active === index ? " is-active" : ""}`} aria-label={`Step ${index + 1}: ${step.title}`} aria-current={active === index ? "step" : undefined} onClick={() => goToStep(index)}>
                <span className="proc__stop-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="proc__stop-dot" />
                <span className="proc__stop-label">{step.title}</span>
              </button>
            ))}
          </nav>
          <div ref={objectRef} className="proc__object" aria-hidden="true">
            <div className="proc__object-caption"><span>Figure {String(active + 1).padStart(2, "0")}</span><span>{STEPS[active].title} / Darwin</span></div>
          </div>
        </div>
        <footer className="proc__footnote">
          <span className="proc__scroll-cue"><span>↓</span> Scroll to explore</span>
          <span>{String(active + 1).padStart(2, "0")} <span className="proc__muted">/ 06</span></span>
          <span>{active < 5 ? `Up next — ${STEPS[active + 1].title}` : "Always moving forward"}</span>
        </footer>
      </div>
    </section>
  );
}
