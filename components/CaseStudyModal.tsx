'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import styles from './CaseStudyModal.module.css'
import type { CaseStudy, Section } from '@/lib/cases'

const VIDEO_RE = /\.(mp4|webm|mov|m4v)(\?|#|$)/i

function SectionBlock({ section }: { section: Section }) {
  switch (section.type) {
    case 'text':
      return (
        <div className={`${styles.text} ${section.align === 'center' ? styles.center : ''} ${section.note ? styles.noteBlock : ''}`}>
          {section.eyebrow && <div className={styles.eyebrow}>{section.eyebrow}</div>}
          {section.heading && <h3 className={styles.heading}>{section.heading}</h3>}
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

export default function CaseStudyModal({ slug, onClose }: { slug: string | null; onClose: () => void }) {
  const [data, setData] = useState<CaseStudy | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // lock body scroll + escape to close while open
  useEffect(() => {
    if (!slug) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [slug, onClose])

  // fetch the case content when opened
  useEffect(() => {
    if (!slug) { setData(null); return }
    setLoading(true)
    setError(null)
    fetch(`/api/cases/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Case not found'))))
      .then((d: CaseStudy) => setData(d))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [slug])

  if (!slug || !mounted) return null

  return createPortal(
    <div className={styles.overlay} role="dialog" aria-modal="true" data-lenis-prevent onClick={onClose}>
      <div
        className={styles.sheet}
        onClick={(e) => e.stopPropagation()}
        style={{
          ...(data?.bg ? { ['--sb' as string]: data.bg } : {}),
          ...(data?.fg ? { ['--sf' as string]: data.fg } : {}),
        } as CSSProperties}
      >
        <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>

        {loading && <div className={styles.state}>Loading…</div>}
        {error && <div className={styles.state}>{error}</div>}

        {data && (
          <>
            {/* ── Hero ── */}
            <header
              className={styles.hero}
              style={{ background: data.cover ? undefined : data.accent ?? '#1a1a1a' }}
            >
              {data.cover && (
                <div className={styles.heroMedia} style={{ backgroundImage: `url(${data.cover})` }} />
              )}
              <div className={styles.heroInner}>
                {data.category && <div className={styles.heroCat}>{data.category}</div>}
                <h1 className={styles.heroTitle}>{data.title}</h1>
                {data.intro && <p className={styles.heroIntro}>{data.intro}</p>}
              </div>
            </header>

            {/* ── Meta strip ── */}
            <div className={styles.meta}>
              {data.client && <div><span>Client</span>{data.client}</div>}
              {data.year && <div><span>Year</span>{data.year}</div>}
              {data.services && data.services.length > 0 && (
                <div><span>Services</span>{data.services.join(', ')}</div>
              )}
            </div>

            {/* ── Builder sections ── */}
            <div className={styles.sections}>
              {data.sections.map((s) => <SectionBlock key={s.id} section={s} />)}
            </div>

            <footer className={styles.footer}>
              <span>Hasaka™ — Selected Work</span>
              <button className={styles.footerClose} onClick={onClose}>Close ✕</button>
            </footer>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
