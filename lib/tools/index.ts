import type { ContentLink } from '@/lib/content/types'

/** Live tools, listed on /tools and in the sitemap. Add the next one here when it ships. */
export const TOOLS: ContentLink[] = [
  {
    label: 'Website Cost Calculator',
    href: '/tools/website-cost-calculator',
    description: 'Estimate the cost of a new website or redesign in Dubai and the UAE, then request an exact proposal.',
  },
]

/** In progress, named on /tools without a link. */
export const UPCOMING_TOOLS = ['Website Brief Generator', 'Website Grader']
