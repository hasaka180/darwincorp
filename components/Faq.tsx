"use client";

import { useState } from "react";

export type QA = { q: string; a: string };

export default function Faq({ items }: { items: QA[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="faq">
      {items.map((it, i) => (
        <div key={it.q} className={`faq__item ${open === i ? "is-open" : ""}`}>
          <button
            className="faq__q"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            <span>{it.q}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5v14" strokeLinecap="round" />
            </svg>
          </button>
          <div className="faq__a">
            <p>{it.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
