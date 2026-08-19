"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useOnLightBg } from "@/components/useOnLightBg";
import { useScrolled } from "@/components/useScrolled";

/* ------------------------------- icons -------------------------------- */
const I = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9h14v-9" strokeLinecap="round" strokeLinejoin="round" />
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
  pulse: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 12h4l2.5-6 4 14 2.5-8H21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  bars: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M6 20V10M12 20V4M18 20v-7" strokeLinecap="round" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="5.5" width="18" height="13" rx="2.4" />
      <path d="m4 8 8 5.5L20 8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

type NavLink = { href: string; label: string; icon: ReactNode };
const LINKS: NavLink[] = [
  { href: "/", label: "Home", icon: I.home },
  { href: "/work", label: "Work", icon: I.grid },
  { href: "/cases", label: "Cases", icon: I.layers },
  { href: "/journal", label: "Journal", icon: I.pulse },
  { href: "/services", label: "Services", icon: I.bars },
  { href: "/contact", label: "Contact", icon: I.mail },
];

export default function Navbar() {
  const pathname = usePathname();
  const onLight = useOnLightBg();
  const scrolled = useScrolled();

  // Hide the studio (admin) and ad landing pages behind a chrome-free view.
  if (pathname?.startsWith("/studio") || pathname?.startsWith("/lp")) return null;

  const dark = onLight;

  return (
    <>
      <Link
        className={`brand ${dark ? "is-dark" : ""} ${scrolled ? "is-hidden" : ""}`}
        href="/"
        aria-label="Darwin home"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dark ? "/darwin_black.svg" : "/darwin.svg"} alt="Darwin" />
      </Link>

      <nav className={`nav ${dark ? "is-light" : ""}`} aria-label="Primary">
        {LINKS.map((l) => {
          const active =
            l.href === "/" ? pathname === "/" : pathname?.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`nav__icon ${active ? "is-active" : ""}`}
              aria-label={l.label}
              title={l.label}
            >
              {l.icon}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
