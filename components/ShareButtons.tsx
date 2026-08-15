'use client'

import { useCallback, useState } from 'react'
import styles from './ShareButtons.module.css'

type Props = { url: string; title: string }

/**
 * Social share row. X / LinkedIn / Facebook / WhatsApp use each network's
 * web share intent. Instagram has no web share endpoint, so that button uses
 * the native Web Share sheet on mobile (which lists Instagram) and falls back
 * to copying the link on desktop. The link's preview (thumbnail, title,
 * description) comes from the page's OpenGraph tags, not these buttons.
 */
export default function ShareButtons({ url, title }: Props) {
  const [copied, setCopied] = useState(false)
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)

  const intents = [
    { key: 'x', label: 'X', href: `https://x.com/intent/tweet?url=${u}&text=${t}`, icon: <XIcon /> },
    { key: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, icon: <LinkedInIcon /> },
    { key: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, icon: <FacebookIcon /> },
    { key: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${t}%20${u}`, icon: <WhatsAppIcon /> },
  ]

  const shareInstagram = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — nothing more we can do */
    }
  }, [title, url])

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>Share</span>
      <div className={styles.row}>
        {intents.map((s) => (
          <a
            key={s.key}
            className={styles.btn}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${s.label}`}
            title={`Share on ${s.label}`}
          >
            {s.icon}
          </a>
        ))}
        <button
          type="button"
          className={styles.btn}
          onClick={shareInstagram}
          aria-label="Share on Instagram or copy link"
          title="Instagram / copy link"
        >
          <InstagramIcon />
        </button>
        {copied && <span className={styles.copied}>Link copied</span>}
      </div>
    </div>
  )
}

/* ── brand icons (currentColor) ── */
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
    </svg>
  )
}
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.2 24 24 23.23 24 22.28V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  )
}
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.08 24 18.09 24 12.07z" />
    </svg>
  )
}
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.37 9.37 0 0 1-1.44-5 9.43 9.43 0 0 1 16.1-6.67 9.37 9.37 0 0 1 2.76 6.68c0 5.18-4.23 9.4-9.42 9.4zm8.02-17.42A11.32 11.32 0 0 0 12.04.5C5.8.5.72 5.57.72 11.81c0 2.04.53 4.03 1.55 5.79L.62 23.5l6.05-1.59a11.27 11.27 0 0 0 5.37 1.37h.01c6.23 0 11.31-5.07 11.32-11.31a11.25 11.25 0 0 0-3.31-7.99z" />
    </svg>
  )
}
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.78.3-1.44.71-2.1 1.37C1.38 2.66.97 3.32.67 4.1.37 4.86.17 5.74.11 7.01.05 8.29.04 8.7.04 11.96s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.78.71 1.44 1.37 2.1.66.66 1.32 1.07 2.1 1.37.76.3 1.64.5 2.91.56 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.78-.3 1.44-.71 2.1-1.37.66-.66 1.07-1.32 1.37-2.1.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.78-.71-1.44-1.37-2.1A5.82 5.82 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-10.41a1.44 1.44 0 1 0 0-2.88 1.44 1.44 0 0 0 0 2.88z" />
    </svg>
  )
}
