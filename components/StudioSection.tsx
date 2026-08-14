"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/* A few simple Logoipsum-style marks. */
const MARKS: ReactNode[] = [
  <svg key="m1" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="11" />
    <circle cx="9" cy="12" r="2.4" fill="#fff" />
    <circle cx="15" cy="12" r="2.4" fill="#fff" />
  </svg>,
  <svg key="m2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3c1.5 4 4.5 7 8 8-3.5 1-6.5 4-8 8-1.5-4-4.5-7-8-8 3.5-1 6.5-4 8-8Z" strokeLinejoin="round" />
  </svg>,
  <svg key="m3" viewBox="0 0 24 24" fill="currentColor">
    {Array.from({ length: 12 }).map((_, i) => (
      <rect key={i} x="11" y="1.5" width="2" height="6" rx="1" transform={`rotate(${i * 30} 12 12)`} />
    ))}
  </svg>,
  <svg key="m4" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="11" />
    <path d="M13 5l-6 8h4l-2 6 6-8h-4l2-6Z" fill="#fff" />
  </svg>,
  <svg key="m5" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="11" />
    <path d="M9 6h4a4 4 0 0 1 0 8H9V6Zm0 6h4a3 3 0 0 1 0 6H9v-6Z" fill="#fff" />
  </svg>,
  <svg key="m6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="7" cy="7" r="3.4" />
    <circle cx="17" cy="7" r="3.4" />
    <circle cx="7" cy="17" r="3.4" />
    <circle cx="17" cy="17" r="3.4" />
  </svg>,
];

function LogoCard({ mark }: { mark: ReactNode }) {
  return (
    <div className="logo-card">
      <span className="logo-card__mark">{mark}</span>
      <span className="logo-card__name">Logoipsum</span>
    </div>
  );
}

export default function StudioSection() {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

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
      { threshold: 0.18 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Duplicate the set so the marquee loops seamlessly.
  const loop = [...MARKS, ...MARKS];

  return (
    <section
      ref={ref}
      data-theme="light"
      className={`studio ${inView ? "is-in" : ""}`}
    >
      <div className="studio__meta">
        <span className="studio__meta-item reveal" style={{ transitionDelay: "0s" }}>
          <svg className="studio__star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2c.7 4.8 4.5 8.6 9.3 9.3-4.8.7-8.6 4.5-9.3 9.3-.7-4.8-4.5-8.6-9.3-9.3C7.5 10.6 11.3 6.8 12 2Z" />
          </svg>
          Inside The Studio
        </span>
        <span className="studio__meta-item reveal" style={{ transitionDelay: "0.08s" }}>
          (©19-26)
        </span>
        <span className="studio__meta-item reveal" style={{ transitionDelay: "0.16s" }}>
          (21.0278° N, 105.8342° E)
        </span>
      </div>

      <div className="studio__intro">
        <div className="studio__video reveal" style={{ transitionDelay: "0.1s" }}>
          <video
            poster="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&q=80&auto=format&fit=crop"
            controls
            playsInline
            preload="metadata"
            aria-label="Founder introduction"
          >
            {/* Drop your founder clip at public/founder-intro.mp4 */}
            <source src="/founder-intro.mp4" type="video/mp4" />
          </video>
        </div>

        <h2 className="studio__headline reveal" style={{ transitionDelay: "0.18s" }}>
          Driven by <em>Strategy,</em> fueled by imagination. We craft
          design-first solutions that help brands stand out in the digital age
        </h2>
      </div>

      <div className="studio__marquee reveal" style={{ transitionDelay: "0.3s" }}>
        <div className="studio__track">
          {loop.map((mark, i) => (
            <LogoCard key={i} mark={mark} />
          ))}
        </div>
      </div>
    </section>
  );
}
