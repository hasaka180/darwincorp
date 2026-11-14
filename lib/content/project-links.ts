import type { ContentLink } from "./types";

/**
 * Per-case context for /cases/[slug]:
 *   heading  optional SEO h1 that replaces the CMS title (Darwin's own work only)
 *   links    the services the case relates to, shown in the enquiry panel
 *   cta      optional serif/pixel headline for that panel
 * Cases not listed here still get the panel, with default copy and links.
 */
export type ProjectContext = {
  heading?: string;
  links: ContentLink[];
  cta?: { serif: string; pixel: string };
};

const BRAND: ContentLink = { label: "Brand identity", href: "/services/brand-identity" };
const LOGO: ContentLink = { label: "Logo & visual identity", href: "/services/logo-visual-identity" };
const WEB: ContentLink = { label: "Website development", href: "/services/website-development" };
const INTERACTIVE: ContentLink = { label: "Interactive websites", href: "/services/interactive-web-design" };
const MOTION: ContentLink = { label: "Motion design", href: "/services/motion-design" };
const SOCIAL: ContentLink = { label: "Social creative", href: "/services/social-media-design" };
const BRAND_PRICING: ContentLink = { label: "Branding pricing", href: "/pricing/branding" };

export const DEFAULT_CASE_LINKS: ContentLink[] = [BRAND, WEB, BRAND_PRICING];

export const PROJECT_CONTEXT: Record<string, ProjectContext> = {
  // Darwin's own work
  "nadz-home-healthcare": { heading: "Healthcare Branding & Website Design for Nadz", links: [{ label: "Healthcare websites", href: "/industries/healthcare" }, BRAND, WEB] },
  realpha: { heading: "Brand Identity & Digital Presence for reAlpha", links: [{ label: "Real estate websites", href: "/industries/real-estate" }, BRAND, MOTION] },
  "nexera-robotics": { heading: "Brand Identity Design for Nexera Robotics", links: [{ label: "Startups & technology", href: "/industries/startups" }, LOGO, BRAND] },
  "the-cooking-guild": { heading: "Packaging & Brand Identity for The Cooking Guild", links: [BRAND, { label: "UI/UX design", href: "/services/ui-ux-design" }, SOCIAL] },
  "summa-forte": { heading: "Sports Performance Brand Identity & Packaging for Summa Forte", links: [BRAND, BRAND_PRICING] },

  // Studies of other brands' work: the panel offers the same craft for the reader's brand.
  "mclaren-rebrand-2026-brand-identity": { links: [BRAND, LOGO, BRAND_PRICING], cta: { serif: "Planning a brand refresh", pixel: "of your own?" } },
  "arsenal-rocastle-typeface-brand-identity": { links: [BRAND, LOGO, BRAND_PRICING], cta: { serif: "Heritage, turned into", pixel: "a modern brand system." } },
  "lando-norris-branding-case-study": { links: [BRAND, INTERACTIVE, MOTION, WEB], cta: { serif: "Personality, speed,", pixel: "a website to match." } },
  "brisbane-2032-logo-olympic-identity": { links: [LOGO, BRAND, BRAND_PRICING] },
  "air-india-rebrand-new-logo-brand-identity": { links: [BRAND, LOGO, BRAND_PRICING], cta: { serif: "Ready to reimagine", pixel: "your brand?" } },
  "atlanta-falcons-retro-logo-controversy-branding": { links: [LOGO, BRAND, { label: "When to rebrand", href: "/journal/when-to-rebrand" }] },
  "mbappe-on-brand-partnership": { links: [BRAND, SOCIAL, { label: "AI creative production", href: "/services/ai-creative-production" }] },
  "sydney-sweeney-novig-ad-controversy": { links: [SOCIAL, BRAND, MOTION] },
};
