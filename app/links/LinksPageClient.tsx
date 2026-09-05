"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import LinksMonitorScene from "@/components/LinksMonitorScene";
import "./links.css";

type IconName = "layers" | "eye" | "film" | "linkedin" | "facebook" | "instagram" | "arrow";

type Thumb =
  | { type: "image"; src: string }
  | { type: "logo"; src: string }
  | { type: "icon"; icon: IconName };

type LinkItem = {
  index: string;
  title: string;
  subtitle: string;
  href: string;
  thumb: Thumb;
  accent: "blue" | "red" | "amber";
};

const LINKS: LinkItem[] = [
  {
    index: "01",
    title: "DARWIN CORP",
    subtitle: "Designed to evolve.",
    href: "https://thedarwin.co/",
    thumb: { type: "logo", src: "/darwin.svg" },
    accent: "blue",
  },
  {
    index: "02",
    title: "HASAKA.IO",
    subtitle: "Portfolio. 3D. Web. Ideas.",
    href: "https://hasaka.io/",
    thumb: { type: "image", src: "/assets/hasaka.webp" },
    accent: "blue",
  },
  {
    index: "03",
    title: "DUBAIOGRAPHY",
    subtitle: "Dubai news, people, places.",
    href: "https://dubaiography.com/",
    thumb: { type: "image", src: "/assets/dubaiography.webp" },
    accent: "blue",
  },
  {
    index: "04",
    title: "MOTION REPOSITORY",
    subtitle: "Free assets. Textures. More.",
    href: "https://motion.thedarwin.co/",
    thumb: { type: "icon", icon: "layers" },
    accent: "blue",
  },
  {
    index: "05",
    title: "GLITCH DECODED",
    subtitle: "Unpopular truths, decoded.",
    href: "https://www.glitchdecoded.com/",
    thumb: { type: "icon", icon: "eye" },
    accent: "red",
  },
  {
    index: "06",
    title: "BORN CINEMA",
    subtitle: "Be a creator.",
    href: "http://borncinema.com/",
    thumb: { type: "icon", icon: "film" },
    accent: "amber",
  },
];

const SOCIALS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/darwinco/", icon: "linkedin" as const },
  { label: "Facebook", href: "https://www.facebook.com/thedarwincorp", icon: "facebook" as const },
  { label: "Instagram", href: "https://www.instagram.com/thedarwin_co/", icon: "instagram" as const },
];

function Icon({ name }: { name: IconName }) {
  switch (name) {
    case "layers":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3 3 8l9 5 9-5-9-5Z" strokeLinejoin="round" />
          <path d="M3 13l9 5 9-5" strokeLinejoin="round" />
        </svg>
      );
    case "eye":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7Z" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "film":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="4.5" width="18" height="15" rx="1.4" />
          <path d="M7.5 4.5v15M16.5 4.5v15M3 9h4.5M16.5 9H21M3 15h4.5M16.5 15H21" />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.94 8.5H3.56V20.4h3.38V8.5ZM5.25 3.6a1.96 1.96 0 1 0 0 3.92 1.96 1.96 0 0 0 0-3.92ZM20.44 20.4h-3.37v-6.24c0-1.49-.03-3.4-2.07-3.4-2.08 0-2.4 1.62-2.4 3.3v6.34H9.24V8.5h3.24v1.63h.05c.45-.85 1.55-1.75 3.2-1.75 3.43 0 4.06 2.26 4.06 5.2v6.82Z" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.9 21v-7.7h2.6l.4-3h-3v-1.9c0-.87.24-1.46 1.5-1.46h1.6V4.2c-.28-.04-1.24-.12-2.35-.12-2.32 0-3.9 1.42-3.9 4.02v2.24H8.1v3h2.65V21h3.15Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="4.6" />
          <circle cx="12" cy="12" r="4.1" />
          <circle cx="17.15" cy="6.85" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "arrow":
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  const date = now
    ? now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).toUpperCase()
    : "";
  const time = now ? now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
  return { date, time };
}

/** What's shown on the CRT glass. Rendered through a portal into the 3D scene. */
function ScreenContent({ time }: { time: string }) {
  return (
    <>
      <div className="linksos__inner">
        <header className="linksos__head">
          <div>
            <p className="linksos__os">HASAKA_OS <span>v1.0</span></p>
            <p className="linksos__tag">Same human, more ideas.</p>
          </div>
          <span className="linksos__time" suppressHydrationWarning>{time}</span>
        </header>

        <nav className="linksos__list" aria-label="Links">
          {LINKS.map((item, i) => (
            <div key={item.href} className="linksos__slot" style={{ "--i": i } as CSSProperties}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`linksos__row linksos__row--${item.accent}`}
              >
                <span className="linksos__thumb" aria-hidden="true">
                  {item.thumb.type === "image" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumb.src} alt="" loading="lazy" />
                  )}
                  {item.thumb.type === "logo" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumb.src} alt="" className="linksos__thumb-logo" loading="lazy" />
                  )}
                  {item.thumb.type === "icon" && <Icon name={item.thumb.icon} />}
                  <span className="linksos__index">{item.index}</span>
                </span>
                <span className="linksos__copy">
                  <span className="linksos__title">{item.title}</span>
                  <span className="linksos__subtitle">{item.subtitle}</span>
                </span>
                <span className="linksos__go" aria-hidden="true">
                  <Icon name="arrow" />
                </span>
              </a>
            </div>
          ))}
        </nav>

        <p className="linksos__ticker">
          <span>ART</span> / <span>DESIGN</span> / <span>TECHNOLOGY</span> / <span>A BETTER TOMORROW</span> _
        </p>
      </div>

      <div className="linksos__scan" aria-hidden="true" />
      <div className="linksos__boot" aria-hidden="true" />
    </>
  );
}

export default function LinksPageClient() {
  const { date, time } = useClock();
  const [screenEl, setScreenEl] = useState<HTMLDivElement | null>(null);
  const onScreenElement = useCallback((el: HTMLDivElement | null) => setScreenEl(el), []);

  return (
    <main className="linksos">
      <div className="linksos__stage">
        <div className="linksos__device">
          <LinksMonitorScene className="linksos__canvas" onScreenElement={onScreenElement} />
          {screenEl && createPortal(<ScreenContent time={time} />, screenEl)}

          {/* corner HUD, printed on the backdrop like the poster */}
          <div className="linksos__hud linksos__hud--tl">
            <p className="linksos__hud-title">HASAKA_OS</p>
            <p className="linksos__hud-sub">Same human,<br />more ideas.</p>
          </div>
          <div className="linksos__hud linksos__hud--tr" suppressHydrationWarning>
            <p className="linksos__hud-sub">{date}</p>
            <p className="linksos__hud-sub">{time}</p>
          </div>
          <div className="linksos__hud linksos__hud--bl">
            <p className="linksos__hud-sub">Connect<br />everywhere</p>
            <ul className="linksos__socials">
              {SOCIALS.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`Darwin Corp on ${s.label}`}>
                    <Icon name={s.icon} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="linksos__hud linksos__hud--br">
            <p className="linksos__hud-sub">Stay<br />creative<br />stay<br />curious</p>
          </div>
        </div>
      </div>
    </main>
  );
}
