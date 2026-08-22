'use client'

import type { CSSProperties } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { JournalPost } from '@/lib/cases'
import ShareButtons from './ShareButtons'
import Faq from './Faq'
import styles from './CaseStudyModal.module.css'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * Formats a `YYYY-MM-DD` string without going through Date, so the server and
 * the browser can't disagree about the day when their timezones differ.
 */
function formatDate(value?: string): string | undefined {
  if (!value) return undefined
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!m) return value
  const [, y, mo, d] = m
  const month = MONTHS[Number(mo) - 1]
  if (!month) return value
  return `${Number(d)} ${month} ${y}`
}

/** ~200 words a minute, rounded up, which is the usual blog convention. */
function readingTime(body?: string): number | undefined {
  if (!body) return undefined
  const words = body.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

/** Presentational journal post, rendered as a full page. */
export default function JournalView({
  data,
  shareUrl,
}: {
  data: JournalPost
  shareUrl?: string
}) {
  const date = formatDate(data.date)
  const mins = readingTime(data.body)

  return (
    <article
      className={styles.sheet}
      style={
        {
          ...(data.bg ? { ['--sb' as string]: data.bg } : {}),
          ...(data.fg ? { ['--sf' as string]: data.fg } : {}),
        } as CSSProperties
      }
    >
      <header className={styles.hero} style={{ background: data.cover ? undefined : '#1a1a1a' }}>
        {data.cover && (
          <div className={styles.heroMedia} style={{ backgroundImage: `url(${data.cover})` }} />
        )}
        <div className={styles.heroInner}>
          {data.category && <div className={styles.heroCat}>{data.category}</div>}
          <h1 className={styles.heroTitle}>{data.title}</h1>
          {data.excerpt && <p className={styles.heroIntro}>{data.excerpt}</p>}
        </div>
      </header>

      <div className={styles.meta}>
        {data.author && (
          <div>
            <span>Written by</span>
            {data.author}
          </div>
        )}
        {date && (
          <div>
            <span>Published</span>
            {date}
          </div>
        )}
        {mins && (
          <div>
            <span>Read</span>
            {mins} min
          </div>
        )}
      </div>

      <div className={styles.sections}>
        {(data.summaryTitle || data.summaryDescription) && (
          <div className={styles.text}>
            {data.summaryTitle && <h2 className={styles.heading}>{data.summaryTitle}</h2>}
            {data.summaryDescription && <p className={styles.body}>{data.summaryDescription}</p>}
          </div>
        )}

        {data.body && (
          <div className={`${styles.text} ${styles.prose}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.body}</ReactMarkdown>
          </div>
        )}

        {data.faqs && data.faqs.length > 0 && (
          <div className={styles.text}>
            <h2 className={styles.heading}>Frequently asked questions</h2>
            <Faq items={data.faqs} />
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <span>Darwin Corp - Journal</span>
        {shareUrl && <ShareButtons url={shareUrl} title={data.title} />}
      </footer>
    </article>
  )
}
