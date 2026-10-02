import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const VIDEO_FILE = /\.(mp4|webm|mov|m4v|ogv)(?:[?#]|$)/i

/** Turns a YouTube or Vimeo page link into its embeddable player URL. */
export function embedUrl(src: string): string | null {
  let u: URL
  try { u = new URL(src) } catch { return null }
  const host = u.hostname.replace(/^www\.|^m\./, '')
  if (host === 'youtu.be') return yt(u.pathname.slice(1))
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') return yt(u.searchParams.get('v'))
    const m = /^\/(?:embed|shorts|live)\/([^/]+)/.exec(u.pathname)
    if (m) return yt(m[1])
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = /\/(\d+)/.exec(u.pathname)
    if (m) return `https://player.vimeo.com/video/${m[1]}`
  }
  return null
}
function yt(id: string | null): string | null {
  return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
}

// Markdown has no video syntax, so `![caption](url)` doubles as one: a video
// file renders as a player and a YouTube/Vimeo link as an embed. Wrappers are
// spans because react-markdown places images inside a <p>.
const components: Components = {
  img({ src, alt }) {
    const url = typeof src === 'string' ? src : ''
    const label = alt && alt !== 'video' ? alt : undefined
    const embed = embedUrl(url)
    if (embed) {
      return (
        <span className="md-embed">
          <iframe
            src={embed}
            title={label || 'Embedded video'}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </span>
      )
    }
    if (VIDEO_FILE.test(url)) {
      return <video className="md-video" src={url} aria-label={label} controls playsInline preload="metadata" />
    }
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt ?? ''} loading="lazy" />
  },
}

export default function MarkdownBody({ children }: { children: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{children}</ReactMarkdown>
}
