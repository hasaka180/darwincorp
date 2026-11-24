import { getPublishedItems as getItems, getPublishedItem as getItem } from "@/lib/published-content";
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { itemType, type CaseStudy } from '@/lib/cases'
import CaseStudyView from '@/components/CaseStudyView'
import ModalCloseButton from '@/components/ModalCloseButton'
import styles from '@/components/CaseStudyModal.module.css'
import StructuredData from '@/components/StructuredData'
import { breadcrumbData, ORGANIZATION_ID, SITE_URL } from '@/lib/seo'
import { DEFAULT_CASE_LINKS, PROJECT_CONTEXT } from '@/lib/content/project-links'
import { CtaPanel } from '@/components/ww/Kit'

export const revalidate = 86400


const abs = (src?: string) =>
  !src ? undefined : src.startsWith('http') ? src : `${SITE_URL}${src.startsWith('/') ? '' : '/'}${src}`

/**
 * Article schema requires a publication date. The CMS only stores a `year`,
 * which may be a single year or a range like "2024-2026", so take the latest
 * four-digit year it contains.
 */
const datePublished = (year?: string) => {
  const years = year?.match(/\d{4}/g)
  return years?.length ? `${years[years.length - 1]}-01-01` : undefined
}

export async function generateStaticParams() {
  const items = await getItems()
  return items.filter((i) => itemType(i) !== 'journal').map((i) => ({ slug: i.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await getItem(slug)
  if (!data || itemType(data) === 'journal') return {}
  const c = data as CaseStudy
  const title = c.metaTitle ? { absolute: c.metaTitle } : c.title
  const description = c.metaDescription || c.intro || `${c.title}, a case study by Darwin Corp.`
  return {
    title,
    description,
    alternates: { canonical: `/cases/${c.slug}` },
    openGraph: {
      type: 'article',
      title: c.metaTitle || c.title,
      description,
      url: `/cases/${c.slug}`,
      images: c.cover ? [{ url: c.cover }] : undefined,
    },
    twitter: { card: 'summary_large_image', title: c.metaTitle || c.title, description, images: c.cover ? [c.cover] : undefined },
  }
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getItem(slug)
  if (!data || itemType(data) === 'journal') notFound()
  const c = data as CaseStudy
  const back = c.type === 'work' ? '/work' : '/cases'
  const shareUrl = `${SITE_URL}/cases/${c.slug}`
  const ctx = PROJECT_CONTEXT[c.slug]
  // Darwin's own projects vs. studies of other brands' work.
  const own = c.type === 'work'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: PROJECT_CONTEXT[c.slug]?.heading || c.title,
    description: c.intro || `${c.title}, a case study by Darwin Corp.`,
    image: abs(c.cover) ? [abs(c.cover)] : undefined,
    datePublished: datePublished(c.year),
    author: { '@id': ORGANIZATION_ID },
    publisher: { '@id': ORGANIZATION_ID },
    url: shareUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': shareUrl },
    about: c.client || undefined,
  }

  // JSON-LD written in the studio. Parsed here so a typo can't ship invalid
  // markup, and re-serialised so a stray "</script>" can't break the page.
  let studioLd: string | null = null
  if (c.jsonLd && c.jsonLd.trim()) {
    try {
      studioLd = JSON.stringify(JSON.parse(c.jsonLd)).replace(/</g, '\\u003c')
    } catch {
      studioLd = null
    }
  }

  // FAQPage JSON-LD when the case has FAQs, unless the studio JSON-LD already
  // carries one: two FAQPage blocks on one URL is a Search Console error.
  const faqLd =
    c.faqs && c.faqs.length > 0 && !studioLd?.includes('"FAQPage"')
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: c.faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }
      : null

  return (
    <div className={styles.pageWrap}>
      <StructuredData data={breadcrumbData([{ label: 'Home', href: '/' }, { label: 'Work', href: '/work' }, { label: c.title, href: `/cases/${c.slug}` }])} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}
      {studioLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: studioLd }} />
      )}
      <ModalCloseButton className={styles.close} fallback={back} />
      <CaseStudyView data={c} shareUrl={shareUrl} heading={ctx?.heading} />
      <div className="ww svx-case">
        <CtaPanel
          track="case_cta"
          tag={own ? 'Your brand next' : 'Related expertise'}
          serif={ctx?.cta?.serif ?? (own ? 'Your brand could be' : 'Want this level of craft')}
          pixel={ctx?.cta?.pixel ?? (own ? 'the next case study.' : 'for your brand?')}
          line="Let's make something worth choosing."
          body={[own
            ? 'Darwin Corp is a Dubai studio working with brands worldwide on identity, websites and motion. Tell us what you are building.'
            : 'Darwin Corp is a Dubai studio working with brands worldwide. We bring the same strategic thinking to brand identity, websites and motion for businesses of every size.']}
          links={ctx?.links ?? DEFAULT_CASE_LINKS}
        />
      </div>
    </div>
  )
}
