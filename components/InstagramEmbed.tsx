'use client'

import { useEffect, useRef, useState } from 'react'

const IG_ORIGIN = /^https:\/\/([\w-]+\.)*instagram\.com$/

/**
 * An Instagram post in a frame that grows to fit it. Instagram's embed page
 * reports its height to the parent window as {"type":"MEASURE"} messages, the
 * ones its own embed.js listens for, so the frame resizes without loading
 * that script. Until the first report it keeps a typical post height.
 */
export default function InstagramEmbed({ src, title }: { src: string; title?: string }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(640)

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!IG_ORIGIN.test(e.origin) || e.source !== ref.current?.contentWindow) return
      try {
        const msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        const h = Number(msg?.details?.height)
        if (msg?.type === 'MEASURE' && h > 0) setHeight(h)
      } catch { /* not one of Instagram's messages */ }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <span className="md-instagram">
      <iframe ref={ref} src={src} title={title || 'Instagram post'} height={height} loading="lazy" allow="encrypted-media" />
    </span>
  )
}
