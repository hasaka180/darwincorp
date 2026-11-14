"use client";

import { useMemo, useState } from "react";
import Placeholder from "./Placeholder";

type Kind = "Villa" | "Apartment" | "Penthouse";
type Property = { name: string; area: string; beds: number; kind: Kind; price: string; tone: "dusk" | "sand" | "stone" | "night" | "sea" };

// Illustrative inventory for the demonstration. Not real listings or prices.
const PROPERTIES: Property[] = [
  { name: "Coastal Residence", area: "Palm Jumeirah", beds: 4, kind: "Villa", price: "AED 12.8M", tone: "sea" },
  { name: "The Skyline", area: "Downtown Dubai", beds: 2, kind: "Apartment", price: "AED 3.4M", tone: "night" },
  { name: "The Courtyard", area: "Dubai Hills", beds: 3, kind: "Villa", price: "AED 7.2M", tone: "stone" },
  { name: "Marina Light", area: "Dubai Marina", beds: 1, kind: "Apartment", price: "AED 1.9M", tone: "sea" },
  { name: "The Crown", area: "Downtown Dubai", beds: 4, kind: "Penthouse", price: "AED 18.5M", tone: "dusk" },
  { name: "Garden House", area: "Dubai Hills", beds: 5, kind: "Villa", price: "AED 9.6M", tone: "sand" },
];

const KINDS = ["All", "Villa", "Apartment", "Penthouse"] as const;
const BEDS = [["Any", 0], ["2+", 2], ["3+", 3], ["4+", 4]] as const;
const AREAS = ["All locations", ...Array.from(new Set(PROPERTIES.map(p => p.area)))];

export default function Finder() {
  const [kind, setKind] = useState<(typeof KINDS)[number]>("All");
  const [beds, setBeds] = useState(0);
  const [area, setArea] = useState(AREAS[0]);

  const shown = useMemo(() => new Set(PROPERTIES.filter(p =>
    (kind === "All" || p.kind === kind) && p.beds >= beds && (area === AREAS[0] || p.area === area)
  ).map(p => p.name)), [kind, beds, area]);

  return (
    <div className="re-finder">
      <div className="re-finder__controls">
        <fieldset>
          <legend>Property type</legend>
          <div className="re-seg">
            {KINDS.map(k => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>{k === "All" ? "All" : `${k}s`}</button>)}
          </div>
        </fieldset>
        <fieldset>
          <legend>Bedrooms</legend>
          <div className="re-seg">
            {BEDS.map(([l, v]) => <button key={l} type="button" aria-pressed={beds === v} onClick={() => setBeds(v)}>{l}</button>)}
          </div>
        </fieldset>
        <label className="re-finder__select">
          <span>Location</span>
          <select value={area} onChange={e => setArea(e.target.value)}>
            {AREAS.map(a => <option key={a}>{a}</option>)}
          </select>
        </label>
      </div>

      <p className="re-finder__count" aria-live="polite">
        {shown.size} concept {shown.size === 1 ? "property" : "properties"}
      </p>

      <ul className="re-finder__grid">
        {PROPERTIES.map(p => (
          <li key={p.name} className={`re-card ${shown.has(p.name) ? "" : "is-hidden"}`} aria-hidden={!shown.has(p.name)}>
            <Placeholder label={`${p.kind} exterior: ${p.name}`} tone={p.tone} />
            <div className="re-card__body">
              <h4>{p.name}</h4>
              <p>{p.area} · {p.beds} {p.beds === 1 ? "Bed" : "Beds"} · {p.kind}</p>
              <span className="re-card__price">{p.price}</span>
            </div>
          </li>
        ))}
      </ul>
      {shown.size === 0 && <p className="re-finder__empty">Nothing matches yet. A real site would suggest the nearest alternatives here.</p>}

      <p className="re-disclaimer">Illustrative properties and prices only. This is not a live real estate inventory.</p>
    </div>
  );
}
