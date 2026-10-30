/**
 * Price list and estimate logic for the website cost calculator
 * (/tools/website-cost-calculator). All figures are AED. Change a price here
 * and the calculator, its FAQ answers and the summary sent with an enquiry
 * all follow.
 *
 * A `from` price is a starting point with no agreed ceiling, so it adds the
 * same amount to both ends of the range and the result is flagged as
 * including starting prices.
 */

export type Range = { low: number; high: number }

export const SITE_TYPES = {
  starter: { label: 'Starter website', detail: 'Up to 5 pages', price: { low: 5000, high: 7000 }, pagesIncluded: 5, cmsIncluded: false },
  business: { label: 'Business website', detail: '10–15 pages', price: { low: 12000, high: 15000 }, pagesIncluded: 15, cmsIncluded: true },
  ecommerce: { label: 'E-commerce', detail: 'Online shop, up to 100 products', price: { low: 18000, high: 25000 }, pagesIncluded: 15, cmsIncluded: true },
} as const
export type SiteType = keyof typeof SITE_TYPES

export const PRICES = {
  extraPage: 1000,
  cms: 1500, // Starter only; included in Business and E-commerce
  languageShare: 0.3, // a second language (usually Arabic) adds 30% of the build…
  languageMin: 3000, // …and never less than this
  copyPerPage: 500,
  booking: {
    none: { label: 'No booking', price: 0, from: false },
    tool: { label: 'Ready-made booking tool', detail: 'Calendly, Fresha or similar', price: 1000, from: false },
    custom: { label: 'Custom booking with payments', price: 4000, from: true },
  },
  motion: { price: 5000, from: true },
  branding: {
    none: { label: 'No branding', price: { low: 0, high: 0 } },
    essentials: { label: 'Logo essentials', detail: 'Logo, colours, fonts and a one-page guide', price: { low: 5000, high: 5000 } },
    full: { label: 'Full brand identity', detail: 'Strategy, logo system, guidelines and key layouts', price: { low: 12000, high: 18000 } },
  },
} as const
export type Booking = keyof typeof PRICES.booking
export type Branding = keyof typeof PRICES.branding

export type Answers = {
  project: 'new' | 'redesign'
  type: SiteType
  pages: number
  cms: boolean
  language: boolean
  booking: Booking
  motion: boolean
  copy: boolean
  branding: Branding
  largeCatalogue: boolean
}

export const DEFAULT_ANSWERS: Answers = {
  project: 'new', type: 'business', pages: 12, cms: false, language: false,
  booking: 'none', motion: false, copy: false, branding: 'none', largeCatalogue: false,
}

export type Line = { label: string; low: number; high: number; from?: boolean }
export type Estimate = { lines: Line[]; total: Range; hasFrom: boolean; quoteOnly: string[] }

const round500 = (n: number) => Math.round(n / 500) * 500

export function estimate(a: Answers): Estimate {
  const site = SITE_TYPES[a.type]
  const lines: Line[] = [{ label: `${site.label} (${site.detail.toLowerCase()})`, ...site.price }]

  const extra = Math.max(0, a.pages - site.pagesIncluded)
  if (extra) lines.push({ label: `${extra} extra page${extra > 1 ? 's' : ''}`, low: extra * PRICES.extraPage, high: extra * PRICES.extraPage })

  if (!site.cmsIncluded && a.cms) lines.push({ label: 'CMS, so you can edit content yourself', low: PRICES.cms, high: PRICES.cms })

  // The language uplift applies to the build so far: pages, templates and CMS.
  if (a.language) {
    const build = lines.reduce((r, l) => ({ low: r.low + l.low, high: r.high + l.high }), { low: 0, high: 0 })
    const share = (n: number) => round500(Math.max(PRICES.languageMin, n * PRICES.languageShare))
    lines.push({ label: 'Second language (Arabic or other)', low: share(build.low), high: share(build.high) })
  }

  if (a.copy) {
    const c = a.pages * PRICES.copyPerPage
    lines.push({ label: `Copywriting for ${a.pages} page${a.pages > 1 ? 's' : ''}`, low: c, high: c })
  }

  const booking = PRICES.booking[a.booking]
  if (booking.price) lines.push({ label: booking.label, low: booking.price, high: booking.price, from: booking.from })

  if (a.motion) lines.push({ label: '3D and motion', low: PRICES.motion.price, high: PRICES.motion.price, from: true })

  const brand = PRICES.branding[a.branding]
  if (brand.price.high) lines.push({ label: brand.label, ...brand.price })

  const total = lines.reduce((r, l) => ({ low: r.low + l.low, high: r.high + l.high }), { low: 0, high: 0 })
  const quoteOnly = a.type === 'ecommerce' && a.largeCatalogue ? ['A catalogue over 100 products is quoted separately.'] : []
  return { lines, total, hasFrom: lines.some(l => l.from), quoteOnly }
}

export const aed = (n: number) => `AED ${n.toLocaleString('en-US')}`
export const formatRange = (r: Range) => (r.low === r.high ? aed(r.low) : `${aed(r.low)} – ${r.high.toLocaleString('en-US')}`)

/** Plain-text summary sent with a proposal request. */
export function summary(a: Answers, e: Estimate): string {
  return [
    `Website cost calculator: ${a.project === 'redesign' ? 'redesign of an existing site' : 'new website'}`,
    `Pages: ${a.pages}`,
    ...e.lines.map(l => `- ${l.label}: ${formatRange(l)}${l.from ? ' (from)' : ''}`),
    ...e.quoteOnly.map(q => `- ${q}`),
    `Estimate: ${formatRange(e.total)}${e.hasFrom ? ' (includes starting prices)' : ''}`,
  ].join('\n')
}
