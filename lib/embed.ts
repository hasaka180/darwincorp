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

/**
 * Turns an Instagram post, reel or IGTV link into its embed page. Kept apart
 * from embedUrl because a post is not a 16:9 player: it needs a frame that
 * grows to whatever height Instagram reports (see PostEmbed).
 */
export function instagramEmbed(src: string): string | null {
  let u: URL
  try { u = new URL(src) } catch { return null }
  if (!/^(www\.)?(instagram\.com|instagr\.am)$/.test(u.hostname)) return null
  // Also accepts the newer /{username}/p/{code}/ form.
  const m = /^\/(?:[\w.]+\/)?(p|reels?|tv)\/([\w-]+)/.exec(u.pathname)
  if (!m) return null
  const kind = m[1] === 'reels' ? 'reel' : m[1]
  return `https://www.instagram.com/${kind}/${m[2]}/embed/captioned/?cr=1&v=14`
}

/**
 * Turns an X (Twitter) post link into its embed page, which plays any video
 * in the post. dnt=true asks X not to use the embed for personalisation.
 */
export function tweetEmbed(src: string): string | null {
  let u: URL
  try { u = new URL(src) } catch { return null }
  if (!/^((www|mobile)\.)?(x|twitter)\.com$/.test(u.hostname)) return null
  // /{user}/status/{id}, /i/status/{id} or /i/web/status/{id}, with or without /video/1 after.
  const m = /^\/(?:\w+|i(?:\/web)?)\/status(?:es)?\/(\d+)/.exec(u.pathname)
  return m ? `https://platform.twitter.com/embed/Tweet.html?id=${m[1]}&dnt=true` : null
}

/** A file the <video> element can actually play. */
export const VIDEO_FILE = /\.(mp4|webm|mov|m4v|ogv)(?:[?#]|$)/i
