import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getItems, getItem, itemType, type JournalPost } from '@/lib/cases'
import JournalView from '@/components/JournalView'
import ModalCloseButton from '@/components/ModalCloseButton'
import styles from '@/components/CaseStudyModal.module.css'

export const revalidate = 600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thedarwin.co'

const abs = (src?: string) =>
  !src ? undefined : src.startsWith('http') ? src : `${SITE_URL}${src.startsWith('/') ? '' : '/'}${src}`

export async function generateStaticParams() {
  const items = await getItems('journal')
  return items.map((i) => ({ slug: i.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await getItem(slug)
  if (!data || itemType(data) !== 'journal') return {}
  const p = data as JournalPost
  const title = p.metaTitle ? { absolute: p.metaTitle } : p.title
  const description = p.metaDescription || p.excerpt || `${p.title}, from the Darwin Corp journal.`
  return {
    title,
    description,
    alternates: { canonical: `/journal/${p.slug}` },
    openGraph: {
      type: 'article',
      title: p.metaTitle || p.title,
      description,
      url: `/journal/${p.slug}`,
      publishedTime: p.date || undefined,
      authors: p.author ? [p.author] : undefined,
      images: p.cover ? [{ url: p.cover }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: p.metaTitle || p.title,
      description,
      images: p.cover ? [p.cover] : undefined,
    },
  }
}

export default async function JournalPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getItem(slug)
  if (!data || itemType(data) !== 'journal') notFound()
  const p = data as JournalPost
  const shareUrl = `${SITE_URL}/journal/${p.slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.title,
    description: p.metaDescription || p.excerpt || `${p.title}, from the Darwin Corp journal.`,
    image: abs(p.cover) ? [abs(p.cover)] : undefined,
    datePublished: p.date || undefined,
    author: p.author
      ? { '@type': 'Person', name: p.author }
      : { '@type': 'Organization', name: 'Darwin Corp' },
    publisher: { '@type': 'Organization', name: 'Darwin Corp', url: SITE_URL },
    url: shareUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': shareUrl },
  }

  // FAQPage JSON-LD (AEO) when the post has FAQs.
  const faqLd =
    p.faqs && p.faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: p.faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }
      : null

  return (
    <div className={styles.pageWrap}>
      {/* A post can supply its own JSON-LD in the studio; when it does, that
          replaces these defaults rather than duplicating them. */}
      {p.jsonLd && p.jsonLd.trim() ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: p.jsonLd }} />
      ) : (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          {faqLd && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
            />
          )}
        </>
      )}
      <ModalCloseButton className={styles.close} fallback="/journal" />
      <JournalView data={p} shareUrl={shareUrl} />
    </div>
  )
}
