# Darwin website expansion

60 new public routes: 9 detailed services, 9 industries, 6 locations, 2 pricing pages,
3 directory pages, 4 studio/resources pages, a project enquiry page, 4 journal
categories and 22 editorial guides.

## Content and editing

- Landing copy: lib/content/services.ts, industries.ts, locations.ts and resources.ts.
- Editorial copy: lib/content/guides.json; category mapping: lib/content/journal.ts.
- Public reads: lib/published-content.ts merges bundled content with the existing
  CMS. A CMS entry with a matching slug overrides bundled content. No new content
  is written to the external CMS by this implementation. To retire a bundled page,
  remove it from these source files as well as any corresponding CMS record.
- Existing project copy and media were read from the public Darwin portfolio on
  2026-09-22 and stored in lib/content/portfolio.json. The five records are existing
  published Darwin work. No new performance metrics were added.
- Botanical artwork was copied from motion.thedarwin.co; see
  public/assets/motion/README.md.
- /studio remains the existing protected content editor. The public studio
  profile is /about.
- The enquiry page reuses /api/lead. Budget and requested timing are included in
  the message; it uses the existing mail configuration.
- New pages have server-rendered content, canonical URLs, social metadata,
  breadcrumbs and relevant Service or Article schema. The global organization
  record identifies the Dubai studio.
- Journal dates reflect the authored September 22, 2026 edition. If publication
  occurs later, update dates in lib/content/journal.ts.

## Business inputs still needed

- Approved website and branding prices, currency, payment terms and typical
  timelines. Pages currently offer custom quotations without invented figures.
- Confirmation of active international target markets. The Netherlands, Sweden,
  Finland and Australia pages explicitly describe remote delivery from Dubai.
- Any additional approved client outcomes, testimonials or project visuals.
- Search Console access is required for post-deployment monitoring and sitemap
  submission; these account actions have not been performed.

## Validation

Run npm run build, then node scripts/check-expanded-pages.mjs.
If a development server is already running, use an isolated build:

    DARWIN_BUILD_DIR=.next-verify npm run build
    DARWIN_BUILD_DIR=.next-verify node scripts/check-expanded-pages.mjs

Browser review covers desktop/mobile layouts, keyboard FAQs, content with
JavaScript disabled, unknown routes, and mocked enquiry success/failure/retry.
Final audit passed for all 60 new pages and 1,421 internal links.
Mocked form checks send no email. Actual mail delivery remains dependent on the
existing server configuration.

## Added routes

- /about
- /faq
- /industries
- /industries/architecture
- /industries/education
- /industries/healthcare
- /industries/hospitality
- /industries/interior-design
- /industries/nonprofits
- /industries/personal-brands
- /industries/real-estate
- /industries/startups
- /journal/ai-creative-production
- /journal/apple-product-launch-design
- /journal/brand-identity-cost-dubai
- /journal/brand-identity-vs-logo-design
- /journal/category/brand-intelligence
- /journal/category/branding
- /journal/category/design-technology
- /journal/category/website-design
- /journal/headless-cms-explained
- /journal/how-to-choose-a-branding-agency
- /journal/luxury-minimalist-web-design
- /journal/motion-design-website-experience
- /journal/nextjs-vs-wordpress
- /journal/nike-digital-experiences
- /journal/on-brand-identity-visual-language
- /journal/premium-brand-small-budget
- /journal/search-accessible-websites
- /journal/signs-you-need-a-website-redesign
- /journal/webgl-3d-brand-experiences
- /journal/website-design-cost-dubai
- /journal/website-redesign-cost
- /journal/what-is-an-interactive-website
- /journal/what-makes-a-brand-premium
- /journal/what-makes-a-website-premium
- /journal/when-to-rebrand
- /journal/wordpress-vs-custom-websites
- /locations
- /locations/australia
- /locations/dubai
- /locations/finland
- /locations/netherlands
- /locations/sweden
- /locations/uae
- /pricing
- /pricing/branding
- /pricing/websites
- /process
- /services/ai-creative-production
- /services/creative-web-development
- /services/custom-web-development
- /services/interactive-web-design
- /services/logo-visual-identity
- /services/motion-design
- /services/social-media-design
- /services/ui-ux-design
- /services/website-redesign
- /start-a-project
- /technologies
