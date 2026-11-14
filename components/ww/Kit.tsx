import Link from "next/link";
import type { ReactNode } from "react";
import { ScrollProgress } from "@/components/worldwide/Interactive";
import HeroVideo from "./HeroVideo";
import "@/app/locations/worldwide/worldwide.css";
import "./kit.css";

/**
 * The homepage design language as building blocks, first drawn for
 * /locations/worldwide: white base, one contained column, framed dark hero,
 * Handjet + Instrument Serif headings, [ bracket ] labels, the iridescent
 * pill button and the synthwave panels. Pages wrap their content in
 * <main className="ww"> so the tokens apply.
 */

export const pad = (n: number) => String(n).padStart(2, "0");

export function Tag({ children }: { children: ReactNode }) {
  return <span className="ww-tag-label">[ {children} ]</span>;
}

/** Instrument Serif line over a Handjet line, both in capitals. */
export function Mix({ serif, pixel, as: H = "h2", className = "ww-title" }: { serif: ReactNode; pixel: ReactNode; as?: "h1" | "h2"; className?: string }) {
  return <H className={`${className} ww-mix`}><span className="ww-mix__serif">{serif}</span><span className="ww-mix__pixel">{pixel}</span></H>;
}

/** The homepage's iridescent pill button. */
export function CtaButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="cta-btn ww-cta-btn" href={href}>
      <span className="cta-btn__fluid" aria-hidden="true" />
      <span className="cta-btn__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 12h13M12 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="cta-btn__text">{children}</span>
    </Link>
  );
}

/** Framed dark hero like the home and worldwide heroes, with a media card in place of the 3D scene. */
export function MediaHero({ crumbs, tag, serif, display, sub, body, media, secondary }: {
  crumbs: { label: string; href: string }[];
  tag: string; serif: string; display: string; sub: string; body: string;
  media: { video: string; poster: string; alt: string };
  secondary: { label: string; href: string };
}) {
  return (
    <section className="ww-hero svx-hero">
      <div className="ww-hero__frame">
        <span className="ww-panel__floor svx-hero__floor" aria-hidden="true" />
        <span className="svx-hero__glow" aria-hidden="true" />
        <nav className="svx-crumbs" aria-label="Breadcrumb">
          <ol>{crumbs.map((c, i) => <li key={c.href}>{i === crumbs.length - 1 ? <span aria-current="page">{c.label}</span> : <Link href={c.href}>{c.label}</Link>}</li>)}</ol>
        </nav>
        <figure className="svx-hero__media blur-in">
          <HeroVideo src={media.video} poster={media.poster} label={media.alt} />
        </figure>
        <div className="ww-hero__copy svx-hero__copy">
          <Tag>{tag}</Tag>
          <h1 className="ww-hero__title">
            <span className="ww-hero__serif blur-in">{serif}</span>
            <span className="ww-hero__display blur-in">{display}</span>
          </h1>
          <p className="ww-hero__sub blur-in">{sub}</p>
          <p className="ww-hero__body blur-in">{body}</p>
          <div className="ww-hero__actions blur-in">
            <CtaButton href="/start-a-project">Start a project</CtaButton>
            <Link href={secondary.href} className="ww-ghost">{secondary.label} <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Five-step process on the full-width dark panel. */
export function ProcessPanel({ tag, serif, pixel, intro, steps }: {
  tag: string; serif: string; pixel: string; intro: string[];
  steps: { title: string; body: string; result?: string }[];
}) {
  return (
    <section className="ww-sec ww-sec--bleed">
      <div className="ww-panel ww-panel--bleed" data-theme="dark">
        <span className="ww-panel__floor" aria-hidden="true" />
        <span className="ww-panel__glow" aria-hidden="true" />
        <header className="ww-head ww-head--dark reveal-up">
          <div><Tag>{tag}</Tag><Mix serif={serif} pixel={pixel} /></div>
          <div className="ww-stack">{intro.map((p) => <p key={p} className="ww-body">{p}</p>)}</div>
        </header>
        <ScrollProgress className="ww-steps">
          <span className="ww-steps__track" aria-hidden="true"><span /></span>
          <ol>
            {steps.map((s, i) => (
              <li key={s.title} style={{ ["--i" as string]: i }}>
                <span className="ww-steps__node" aria-hidden="true" />
                <span className="ww-steps__n">{pad(i + 1)}</span>
                <h3 className="ww-steps__title">{s.title}</h3>
                <p>{s.body}</p>
                {s.result && <p className="svx-steps__result">{s.result}</p>}
              </li>
            ))}
          </ol>
        </ScrollProgress>
        <Link href="/process" className="ww-link ww-link--light">Discover our process <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}

export type WorkItem = { slug?: string; href?: string; title: string; category: string; cover: string; services: string[]; note?: string };

/** Project cards: Darwin's own work, linked to its case study. */
export function WorkGrid({ items }: { items: WorkItem[] }) {
  return (
    <ul className="svx-work">
      {items.map((p) => (
        <li key={p.title} className="reveal-up">
          <Link href={p.href ?? `/cases/${p.slug}`} className="svx-work__card">
            <span className="svx-work__img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.cover} alt={`${p.title}, ${p.category.toLowerCase()} project by Darwin Corp`} loading="lazy" decoding="async" />
              <span className="ww-card__go" aria-hidden="true">↗</span>
            </span>
            <span className="ww-market__k">{p.category}{p.note ? ` · ${p.note}` : ""}</span>
            <h3 className="svx-work__title">{p.title}</h3>
            <span className="svx-work__svc">{p.services.join(" · ")}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Numbered deliverables list, two columns on desktop. */
export function Deliverables({ items }: { items: string[] }) {
  return <ol className="svx-list">{items.map((d, i) => <li key={d}><span>{pad(i + 1)}</span>{d}</li>)}</ol>;
}

export function FaqBlock({ tag, items }: { tag: string; items: { q: string; a: string }[] }) {
  return (
    <section className="ww-sec ww-faq" data-theme="light">
      <header className="reveal-up">
        <Tag>{tag}</Tag>
        <Mix serif="Frequently" pixel="asked questions" />
        <a href="mailto:hello@thedarwin.co" className="ww-mail">hello@thedarwin.co <span aria-hidden="true">↗</span></a>
      </header>
      <div className="ww-qa reveal-up">
        {items.map((f, i) => (
          <details key={f.q} open={i === 0}>
            <summary>
              <span className="ww-qa__n">{pad(i + 1)}</span>
              <span className="ww-qa__q">{f.q}</span>
              <span className="ww-qa__plus" aria-hidden="true" />
            </summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** The sunset "Start a project" panel that closes the worldwide page. */
export function CtaPanel({ tag, serif, pixel, line, body, links, track }: {
  tag: string; serif: string; pixel: string; line: string; body: string[];
  links?: { label: string; href: string }[];
  /** data-track value, so enquiry clicks from this panel can be told apart. */
  track?: string;
}) {
  return (
    <section className="ww-sec ww-sec--cta" data-theme="light" data-track={track}>
      <div className="ww-cta" data-theme="dark">
        <span className="ww-cta__sun" aria-hidden="true" />
        <span className="ww-panel__floor" aria-hidden="true" />
        <div className="ww-cta__inner">
          <Tag>{tag}</Tag>
          <Mix serif={serif} pixel={pixel} className="ww-cta__title reveal-up" />
          <div className="ww-cta__row">
            <div className="reveal-up">
              <p className="ww-serif ww-serif--light">{line}</p>
              {body.map((p) => <p key={p} className="ww-body">{p}</p>)}
              {links && links.length > 0 && (
                <ul className="svx-cta-links">
                  {links.map((l) => <li key={l.href}><Link href={l.href} className="ww-ghost">{l.label} <span aria-hidden="true">→</span></Link></li>)}
                </ul>
              )}
            </div>
            <CtaButton href="/start-a-project">Start a project</CtaButton>
          </div>
        </div>
      </div>
    </section>
  );
}
