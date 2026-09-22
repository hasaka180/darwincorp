import type { ContentLink } from "./types";

export const PROJECT_CONTEXT: Record<string, { heading: string; links: ContentLink[] }> = {
  "nadz-home-healthcare": { heading: "Healthcare Branding & Website Design for Nadz", links: [{ label: "Healthcare websites", href: "/industries/healthcare" }, { label: "Brand identity", href: "/services/brand-identity" }, { label: "Custom websites", href: "/services/custom-web-development" }] },
  realpha: { heading: "Brand Identity & Digital Presence for reAlpha", links: [{ label: "Real estate websites", href: "/industries/real-estate" }, { label: "Brand identity", href: "/services/brand-identity" }, { label: "Motion design", href: "/services/motion-design" }] },
  "nexera-robotics": { heading: "Brand Identity Design for Nexera Robotics", links: [{ label: "Startups & technology", href: "/industries/startups" }, { label: "Logo and visual identity", href: "/services/logo-visual-identity" }] },
  "the-cooking-guild": { heading: "Packaging & Brand Identity for The Cooking Guild", links: [{ label: "Brand identity", href: "/services/brand-identity" }, { label: "UI/UX design", href: "/services/ui-ux-design" }, { label: "Social creative", href: "/services/social-media-design" }] },
  "summa-forte": { heading: "Sports Performance Brand Identity & Packaging for Summa Forte", links: [{ label: "Brand identity", href: "/services/brand-identity" }, { label: "Branding pricing", href: "/pricing/branding" }] },
};
