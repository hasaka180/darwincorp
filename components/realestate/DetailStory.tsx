"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Placeholder from "./Placeholder";

const STEPS = [
  { k: "Exterior", title: "The first view.", body: "The property introduces itself through its architecture, before any number appears on screen." },
  { k: "Interior", title: "Step inside.", body: "The exterior gives way to the rooms themselves: light, proportion and material." },
  { k: "Floor plan", title: "Understand the space.", body: "A floor plan fades in so the visitor can see how the rooms connect." },
  { k: "Neighbourhood", title: "Know the area.", body: "A map places the home among schools, beaches, dining and the routes that matter." },
  { k: "Specifications", title: "The facts, calmly.", body: "Size, bedrooms, handover and service charges, set in a restrained layout that is easy to scan." },
];

const SPECS = [["Built-up area", "5,400 sq ft"], ["Bedrooms", "4"], ["Bathrooms", "5"], ["Plot", "8,200 sq ft"], ["Completion", "Ready"], ["Parking", "3 spaces"]];

// Scroll-told property page: the text steps scroll past while the visual
// stage stays pinned and changes to match whichever step is centred.
export default function DetailStory() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i)); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    refs.current.forEach(el => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="re-detail">
      <div className="re-detail__stage" aria-hidden="true">
        <div className="re-detail__frame">
          <div className={`re-detail__layer ${active === 0 ? "is-on" : ""}`}><Placeholder label="Exterior: Coastal Residence facade" tone="sea" /></div>
          <div className={`re-detail__layer ${active === 1 ? "is-on" : ""}`}><Placeholder label="Interior: double-height living room" tone="sand" /></div>
          <div className={`re-detail__layer re-detail__layer--plan ${active === 2 ? "is-on" : ""}`}>
            <svg viewBox="0 0 400 260" className="re-plan">
              <rect x="20" y="20" width="360" height="220" />
              <path d="M20 120h150M170 20v220M260 20v110M260 130h120M170 180h90M260 180v60" />
              <text x="60" y="75">Living</text><text x="60" y="185">Kitchen</text>
              <text x="190" y="80">Master</text><text x="290" y="80">Bed 2</text>
              <text x="290" y="170">Bed 3</text><text x="185" y="215">Study</text>
            </svg>
          </div>
          <div className={`re-detail__layer re-detail__layer--map ${active === 3 ? "is-on" : ""}`}>
            <svg viewBox="0 0 400 260" className="re-map">
              <path className="re-map__coast" d="M0 200 C80 170 140 230 220 190 S340 150 400 170 V260 H0Z" />
              <path className="re-map__road" d="M30 20 L200 120 L380 60 M200 120 L230 250" />
              <circle className="re-map__pin" cx="200" cy="120" r="9" />
              <circle cx="110" cy="70" r="4" /><text x="120" y="74">School · 6 min</text>
              <circle cx="300" cy="95" r="4" /><text x="250" y="116">Dining · 4 min</text>
              <circle cx="140" cy="190" r="4" /><text x="60" y="176">Beach · 2 min</text>
            </svg>
          </div>
          <div className={`re-detail__layer re-detail__layer--specs ${active === 4 ? "is-on" : ""}`}>
            <dl className="re-specs">
              {SPECS.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
          </div>
          <span className="re-detail__tag">{STEPS[active].k}</span>
        </div>
      </div>

      <ol className="re-detail__steps">
        {STEPS.map((s, i) => (
          <li key={s.k} data-i={i} ref={el => { refs.current[i] = el; }} className={i === active ? "is-active" : ""}>
            <span className="re-detail__n">0{i + 1} · {s.k}</span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
            {i === STEPS.length - 1 && (
              <Link href="/start-a-project" className="re-btn re-btn--dark re-detail__enquire">Arrange a viewing →</Link>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
