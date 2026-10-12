/**
 * Turns a YouTube or Vimeo page link into its embeddable player URL.
 *
 * Lives here rather than in MarkdownBody so the structured video section can
 * use it too: importing from that module would drag react-markdown into every
 * bundle that renders a case video.
 */
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

/** A file the <video> element can actually play. */
export const VIDEO_FILE = /\.(mp4|webm|mov|m4v|ogv)(?:[?#]|$)/i
