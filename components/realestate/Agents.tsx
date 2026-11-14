"use client";

import { useState } from "react";
import Photo from "./Photo";

// Concept profiles for the demonstration. These are not real people.
const AGENTS = [
  { name: "Agent A", role: "Senior Consultant", focus: ["Waterfront villas", "Off-plan launches"], areas: "Palm Jumeirah · Dubai Marina", langs: "English, Arabic" },
  { name: "Agent B", role: "Leasing Specialist", focus: ["Luxury apartments", "Corporate relocation"], areas: "Downtown Dubai · Business Bay", langs: "English, French" },
  { name: "Agent C", role: "Investment Advisor", focus: ["Portfolio acquisitions", "Yield analysis"], areas: "Dubai Hills · Emirates Hills", langs: "English, Hindi" },
];

export default function Agents() {
  const [open, setOpen] = useState(0);
  return (
    <div className="re-agents">
      {AGENTS.map((a, i) => (
        <article key={a.name} className={`re-agent ${open === i ? "is-open" : ""}`}>
          <button type="button" className="re-agent__head" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
            <Photo src={`agent-${"abc"[i]}`} alt="" tone={(["stone", "sand", "dusk"] as const)[i]} className="re-agent__photo" />
            <span className="re-agent__id">
              <strong>{a.name}</strong>
              <span>{a.role}</span>
            </span>
            <span className="re-agent__plus" aria-hidden="true">+</span>
          </button>
          <div className="re-agent__more">
            <div>
              <dl>
                <div><dt>Specialises in</dt><dd>{a.focus.join(" · ")}</dd></div>
                <div><dt>Areas covered</dt><dd>{a.areas}</dd></div>
                <div><dt>Languages</dt><dd>{a.langs}</dd></div>
                <div><dt>Registration</dt><dd>Licence number shown here</dd></div>
              </dl>
              <span className="re-agent__actions">
                <span className="re-chip">Call</span><span className="re-chip">WhatsApp</span><span className="re-chip">Book a consultation</span>
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
