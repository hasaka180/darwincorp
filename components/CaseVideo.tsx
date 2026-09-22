'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './CaseStudyModal.module.css'

/* Every case video on the page, so unmuting one can silence the rest. */
const players = new Set<HTMLVideoElement>()

const SpeakerOn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 5 6 9H2v6h4l5 4V5z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
)

const SpeakerOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 5 6 9H2v6h4l5 4V5z" />
    <path d="m16 9 5 6" />
    <path d="m21 9-5 6" />
  </svg>
)

/**
 * Case-study video: autoplays silently like a showreel (browsers block
 * autoplay with sound), with a toggle so the viewer can hear the audio.
 */
export default function CaseVideo({
  src,
  poster,
  preload,
}: {
  src: string
  poster?: string
  preload?: 'none' | 'metadata' | 'auto'
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [on, setOn] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    players.add(el)

    const sync = () => setOn(!el.muted)
    el.addEventListener('volumechange', sync)

    /* Don't let a video the viewer has scrolled past keep playing audio. */
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void el.play().catch(() => {})
        else el.pause()
      },
      { threshold: 0.25 },
    )
    io.observe(el)

    return () => {
      players.delete(el)
      el.removeEventListener('volumechange', sync)
      io.disconnect()
    }
  }, [])

  const toggle = useCallback(() => {
    const el = ref.current
    if (!el) return
    if (!el.muted) {
      el.muted = true
      return
    }
    players.forEach((p) => {
      if (p !== el) p.muted = true
    })
    el.muted = false
    /* The click is the gesture that lets the browser play audio. */
    el.play().catch(() => {
      el.muted = true
    })
  }, [])

  return (
    <div className={styles.videoWrap}>
      <video ref={ref} src={src} poster={poster} preload={preload} autoPlay muted loop playsInline />
      <button
        type="button"
        className={styles.soundBtn}
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? 'Mute video' : 'Unmute video'}
      >
        {on ? <SpeakerOn /> : <SpeakerOff />}
      </button>
    </div>
  )
}
