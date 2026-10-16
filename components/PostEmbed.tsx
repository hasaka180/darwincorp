'use client'

import { useEffect, useRef, useState } from 'react'

type Provider = 'instagram' | 'x'
type Msg = {
  type?: string
  details?: { height?: unknown }
  method?: string
  params?: { height?: unknown }[]
  'twttr.embed'?: unknown
}

function parse(data: unknown): Msg | undefined {
  if (typeof data === 'string') { try { return JSON.parse(data) } catch { return undefined } }
  return data && typeof data === 'object' ? (data as Msg) : undefined
}

// Each embed page reports its height to the parent window in its own format,
// the messages Instagram's embed.js and X's widgets.js listen for, so the
// frame can grow to fit without loading either script. Until the first report
// it keeps a typical post height.
const PROVIDERS: Record<Provider, { origin: RegExp; title: string; height: number; measure: (data: unknown) => number }> = {
  instagram: {
    origin: /^https:\/\/([\w-]+\.)*instagram\.com$/,
    title: 'Instagram post',
    height: 640,
    measure(data) {
      const m = parse(data)
      return m?.type === 'MEASURE' ? Number(m.details?.height) : 0
    },
  },
  x: {
    origin: /^https:\/\/platform\.twitter\.com$/,
    title: 'Post on X',
    height: 560,
    measure(data) {
      const m = parse(parse(data)?.['twttr.embed'])
      return m?.method === 'twttr.private.resize' ? Number(m.params?.[0]?.height) : 0
    },
  },
}

/** An Instagram or X post in a frame that grows to fit it. */
export default function PostEmbed({ provider, src, title }: { provider: Provider; src: string; title?: string }) {
  const p = PROVIDERS[provider]
  const ref = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(p.height)

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!p.origin.test(e.origin) || e.source !== ref.current?.contentWindow) return
      const h = p.measure(e.data)
      if (h > 0) setHeight(h)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [p])

  return (
    <span className={`md-post md-post--${provider}`}>
      <iframe ref={ref} src={src} title={title || p.title} height={height} loading="lazy" allow="encrypted-media; fullscreen" allowFullScreen />
    </span>
  )
}
