export type ContentLink = { label: string; href: string; description?: string };
export type PageSection = { title: string; body: string; items?: string[] };
export type LandingPage = {
  slug: string; title: string; heading: string; eyebrow: string; description: string;
  image: string; imageAlt: string; intro: string; sections: PageSection[];
  scope: { title: string; body: string; items: string[] };
  faqs: { q: string; a: string }[]; related: ContentLink[]; projects?: string[];
};
