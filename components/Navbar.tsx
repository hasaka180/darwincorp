"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useOnLightBg } from "@/components/useOnLightBg";
import { useScrolled } from "@/components/useScrolled";

type Tile = { img: string; title: string; sub: string };
type Menu = { id: string; label: string; icon: ReactNode; tiles: Tile[] };

/* ------------------------------- icons -------------------------------- */
const I = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9h14v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  ),
  bars: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M6 20V10M12 20V4M18 20v-7" strokeLinecap="round" />
    </svg>
  ),
  pulse: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 12h4l2.5-6 4 14 2.5-8H21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.4" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4" />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 3 3 8l9 5 9-5-9-5Z" strokeLinejoin="round" />
      <path d="M3 13l9 5 9-5" strokeLinejoin="round" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  ),
};

/* ------------------------------- data --------------------------------- */
const tile = (seed: string, title: string, sub: string): Tile => ({
  img: `https://picsum.photos/seed/${seed}/720/520`,
  title,
  sub,
});

const MENUS: Menu[] = [
  {
    id: "home",
    label: "Overview",
    icon: I.home,
    tiles: [
      tile("dar-talent", "Our creative talent", "Meet your dedicated team"),
      tile("dar-ai", "AI excellence", "Your shortcut to AI's creative advantage"),
      tile("dar-tech", "Our technology", "The tech powering your creative edge"),
    ],
  },
  {
    id: "create",
    label: "Create",
    icon: I.plus,
    tiles: [
      tile("dar-new1", "Start a project", "Spin up a brief in minutes"),
      tile("dar-new2", "Templates", "Launch from a curated starting point"),
      tile("dar-new3", "Brand kit", "Keep every asset on-brand"),
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: I.bars,
    tiles: [
      tile("dar-an1", "Performance", "Track what's resonating"),
      tile("dar-an2", "Audience", "Understand who you reach"),
      tile("dar-an3", "Trends", "Spot momentum early"),
    ],
  },
  {
    id: "insights",
    label: "Insights",
    icon: I.pulse,
    tiles: [
      tile("dar-in1", "Signals", "Real-time creative intelligence"),
      tile("dar-in2", "Experiments", "Test, learn, iterate"),
      tile("dar-in3", "Reports", "Share the story with one link"),
    ],
  },
  {
    id: "library",
    label: "Library",
    icon: I.grid,
    tiles: [
      tile("dar-lib1", "Collections", "Everything in one place"),
      tile("dar-lib2", "Assets", "Reusable, searchable, ready"),
      tile("dar-lib3", "History", "Every version, recoverable"),
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    icon: I.layers,
    tiles: [
      tile("dar-ws1", "Teams", "Collaborate without friction"),
      tile("dar-ws2", "Pipelines", "From idea to launch"),
      tile("dar-ws3", "Integrations", "Connect your stack"),
    ],
  },
  {
    id: "search",
    label: "Search",
    icon: I.search,
    tiles: [
      tile("dar-se1", "Discover", "Find anything, instantly"),
      tile("dar-se2", "Saved", "Pick up where you left off"),
      tile("dar-se3", "Suggested", "Curated just for you"),
    ],
  },
];

/* ------------------------------ component ----------------------------- */
export default function Navbar() {
  const [open, setOpen] = useState<string | null>(null);
  const active = MENUS.find((m) => m.id === open) || null;
  const onLight = useOnLightBg();
  const scrolled = useScrolled();
  // Dark treatment when a full-page menu is open OR the bar sits over #E9E9E9.
  const dark = Boolean(active) || onLight;
  // Hide the logo once scrolling (but keep it while a menu is open).
  const hideBrand = scrolled && !active;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = open ? "hidden" : "";
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <a
        className={`brand ${dark ? "is-dark" : ""} ${hideBrand ? "is-hidden" : ""}`}
        href="#"
        aria-label="Darwin home"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dark ? "/darwin_black.svg" : "/darwin.svg"} alt="Darwin" />
      </a>

      <nav className={`nav ${dark ? "is-light" : ""}`}>
        {MENUS.map((m) => (
          <button
            key={m.id}
            className={`nav__icon ${open === m.id ? "is-active" : ""}`}
            aria-label={m.label}
            onClick={() => setOpen((cur) => (cur === m.id ? null : m.id))}
          >
            {m.icon}
          </button>
        ))}
      </nav>

      <div
        className={`mega ${active ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!active}
      >
        {active && (
          <div className="mega__inner">
            <header className="mega__head">
              <span className="mega__eyebrow">{active.label}</span>
              <button
                className="mega__close"
                aria-label="Close menu"
                onClick={() => setOpen(null)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <div className="mega__grid">
              {active.tiles.map((t) => (
                <a key={t.title} className="card" href="#">
                  <div className="card__media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.img} alt={t.title} loading="lazy" />
                  </div>
                  <h3 className="card__title">{t.title}</h3>
                  <p className="card__sub">{t.sub}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
