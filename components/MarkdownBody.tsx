import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { VIDEO_FILE, embedUrl } from '@/lib/embed'

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
