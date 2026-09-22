import { getPublishedItems as getItems, getPublishedItem as getItem } from "@/lib/published-content";
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { itemType, type CaseStudy } from '@/lib/cases'
import CaseStudyView from '@/components/CaseStudyView'
import ModalCloseButton from '@/components/ModalCloseButton'
import styles from '@/components/CaseStudyModal.module.css'
import StructuredData from '@/components/StructuredData'
import { breadcrumbData } from '@/lib/seo'
import { PROJECT_CONTEXT } from '@/lib/content/project-links'
import { LinkCards } from '@/components/ExplorePage'

export const revalidate = 600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thedarwin.co'

const abs = (src?: string) =>
  !src ? undefined : src.startsWith('http') ? src : `${SITE_URL}${src.startsWith('/') ? '' : '/'}${src}`

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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: PROJECT_CONTEXT[c.slug]?.heading || c.title,
    description: c.intro || `${c.title}, a case study by Darwin Corp.`,
    image: abs(c.cover) ? [abs(c.cover)] : undefined,
    author: { '@type': 'Organization', name: 'Darwin Corp' },
    publisher: { '@type': 'Organization', name: 'Darwin Corp', url: SITE_URL },
    url: shareUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': shareUrl },
    about: c.client || undefined,
  }

  // FAQPage JSON-LD (AEO) when the case has FAQs.
  const faqLd =
    c.faqs && c.faqs.length > 0
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
      {c.jsonLd && c.jsonLd.trim() && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: c.jsonLd }} />
      )}
      <ModalCloseButton className={styles.close} fallback={back} />
      <CaseStudyView data={c} shareUrl={shareUrl} heading={PROJECT_CONTEXT[c.slug]?.heading} />
      {PROJECT_CONTEXT[c.slug] && <section className="subpage" data-theme="light" style={{ minHeight: 0, paddingTop: 60, paddingBottom: 80 }}>
        <h2>Explore the related expertise.</h2><LinkCards links={PROJECT_CONTEXT[c.slug].links} />
      </section>}
    </div>
  )
}
