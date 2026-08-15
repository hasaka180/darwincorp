import type { CSSProperties } from 'react'
import styles from './CaseStudyModal.module.css'
import ShareButtons from './ShareButtons'
import Faq from './Faq'
import type { CaseStudy, Section } from '@/lib/cases'

const VIDEO_RE = /\.(mp4|webm|mov|m4v)(\?|#|$)/i

function SectionBlock({ section }: { section: Section }) {
  switch (section.type) {
    case 'text':
      return (
        <div className={`${styles.text} ${section.align === 'center' ? styles.center : ''} ${section.note ? styles.noteBlock : ''}`}>
          {section.eyebrow && <div className={styles.eyebrow}>{section.eyebrow}</div>}
          {section.heading && <h2 className={styles.heading}>{section.heading}</h2>}
          {section.body && <p className={styles.body}>{section.body}</p>}
        </div>
      )
    case 'image':
      return (
        <figure className={`${styles.media} ${section.full ? styles.full : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={section.src} alt={section.caption ?? ''} loading="lazy" decoding="async" />
          {section.caption && <figcaption>{section.caption}</figcaption>}
        </figure>
      )
    case 'video':
      return (
        <figure className={`${styles.media} ${section.full ? styles.full : ''}`}>
          <video src={section.src} poster={section.poster} autoPlay muted loop playsInline />
        </figure>
      )
    case 'columns':
      return (
        <div className={styles.columns} style={{ gridTemplateColumns: `repeat(${section.items.length || 1}, 1fr)` }}>
          {section.items.map((it, i) => (
            <div key={i} className={styles.col}>
              {it.heading && <h4>{it.heading}</h4>}
              {it.body && <p>{it.body}</p>}
            </div>
          ))}
        </div>
      )
    case 'grid':
      return (
        <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${section.columns ?? 2}, 1fr)` }}>
          {section.items.map((it, i) => (
            <figure key={i} className={styles.gridItem}>
              {VIDEO_RE.test(it.src) ? (
                <video src={it.src} autoPlay muted loop playsInline preload="metadata" />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={it.src} alt={it.caption ?? ''} loading="lazy" decoding="async" />
              )}
              {it.caption && <figcaption>{it.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )
    default:
      return null
  }
}

/** Presentational case-study sheet rendered as a full page. */
export default function CaseStudyView({ data, shareUrl }: { data: CaseStudy; shareUrl?: string }) {
  return (
    <article
      className={styles.sheet}
      style={{
        ...(data.bg ? { ['--sb' as string]: data.bg } : {}),
        ...(data.fg ? { ['--sf' as string]: data.fg } : {}),
      } as CSSProperties}
    >
      <header className={styles.hero} style={{ background: data.cover ? undefined : data.accent ?? '#1a1a1a' }}>
        {data.cover && <div className={styles.heroMedia} style={{ backgroundImage: `url(${data.cover})` }} />}
        <div className={styles.heroInner}>
          {data.category && <div className={styles.heroCat}>{data.category}</div>}
          <h1 className={styles.heroTitle}>{data.title}</h1>
          {data.intro && <p className={styles.heroIntro}>{data.intro}</p>}
        </div>
      </header>

      <div className={styles.meta}>
        {data.client && <div><span>Client</span>{data.client}</div>}
        {data.year && <div><span>Year</span>{data.year}</div>}
        {data.services && data.services.length > 0 && <div><span>Services</span>{data.services.join(', ')}</div>}
      </div>

      <div className={styles.sections}>
        {(data.summaryTitle || data.summaryDescription) && (
          <div className={styles.text}>
            {data.summaryTitle && <h2 className={styles.heading}>{data.summaryTitle}</h2>}
            {data.summaryDescription && <p className={styles.body}>{data.summaryDescription}</p>}
          </div>
        )}

        {data.sections.map((s) => <SectionBlock key={s.id} section={s} />)}

        {data.faqs && data.faqs.length > 0 && (
          <div className={styles.text}>
            <h2 className={styles.heading}>Frequently asked questions</h2>
            <Faq items={data.faqs} />
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <span>Darwin Corp - Selected Work</span>
        {shareUrl && <ShareButtons url={shareUrl} title={data.title} />}
      </footer>
    </article>
  )
}
