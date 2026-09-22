import type { JournalPost } from "@/lib/cases";
import guides from "./guides.json";

export const JOURNAL_CATEGORIES = [
  { slug: "brand-intelligence", title: "Brand intelligence", description: "Independent observations on brand strategy, visual language and digital experiences." },
  { slug: "website-design", title: "Website design", description: "Practical guides to planning, commissioning and improving a business website." },
  { slug: "branding", title: "Branding", description: "Identity, positioning and the decisions that make a brand consistent and recognisable." },
  { slug: "design-technology", title: "Design & technology", description: "A business perspective on development, content systems, motion and creative tools." },
];

export const EDITORIAL_POSTS: JournalPost[] = guides.map(guide => ({
  type: "journal", slug: guide.slug, title: guide.title, excerpt: guide.excerpt,
  category: JOURNAL_CATEGORIES.find(c => c.slug === guide.category)!.title,
  date: "2026-09-22",
  cover: ({ branding: "/video/brand-identity.png", "brand-intelligence": "/assets/motion/botanical.webp", "design-technology": "/video/ai-generative.jpg", "website-design": "/video/website.jpg" } as Record<string, string>)[guide.category],
  body: `${guide.body}\n\n## Explore with Darwin\n\n${guide.related.map(([label, href]) => `- [${label}](${href})`).join("\n")}`,
}));
