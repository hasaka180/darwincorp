export type Service = {
  slug: string;
  num: string;
  title: string;
  tagline: string;
  summary: string;
  cover: string;
  heroSubtitle: string;
  overview: string;
  capabilities: string[];
  features: { title: string; body: string }[];
};

export const SERVICES: Service[] = [
  {
    slug: "brand-identity",
    num: "01",
    title: "Brand Identity",
    tagline: "Visual Systems · Logo Design · Brand Strategy",
    summary:
      "Strategy-led identities and design systems that feel intentional from the first tap to the last interaction.",
    cover: "/video/brand-identity.png",
    heroSubtitle:
      "Distinctive, flexible brand systems — from strategy and naming to a full visual language built to scale.",
    overview:
      "We build brands from the name outward. Positioning, story, and a complete visual language — type, colour, marks, and motion — assembled into a system your team can run with across every surface.",
    capabilities: [
      "Brand Strategy",
      "Naming",
      "Logo & Marks",
      "Visual Systems",
      "Typography",
      "Guidelines",
      "Art Direction",
      "Collateral",
    ],
    features: [
      { title: "Strategy first", body: "We start with positioning, audience, and story — so the design has something true to express." },
      { title: "Systems, not logos", body: "A flexible identity system: type, colour, motion, and rules that hold up everywhere." },
      { title: "Built to last", body: "Guidelines and assets your team can run with, long after launch." },
    ],
  },
  {
    slug: "website-development",
    num: "02",
    title: "Website Development",
    tagline: "Web Design · Development · Webflow",
    summary:
      "Fast, accessible, motion-driven sites and products — engineered from concept to launch.",
    cover: "/video/website.jpg",
    heroSubtitle:
      "High-craft websites and web apps, designed and engineered to be fast, editable, and unmistakably yours.",
    overview:
      "From the first wireframe to a performant, editable build, we design and develop sites that load fast, feel alive, and are easy for your team to own — on Webflow, headless, or custom.",
    capabilities: [
      "Web Design",
      "Frontend Engineering",
      "Webflow",
      "CMS & Headless",
      "Performance",
      "Motion & Interaction",
      "SEO Foundations",
      "Maintenance",
    ],
    features: [
      { title: "Speed as a feature", body: "Performance-first builds — quick to load, smooth to use, kind to search." },
      { title: "Editable by you", body: "A CMS your team actually enjoys, so content stays fresh without a developer." },
      { title: "Motion with intent", body: "Interaction and motion that guide attention — never noise for its own sake." },
    ],
  },
  {
    slug: "ai-creatives",
    num: "03",
    title: "AI Creatives",
    tagline: "AI Art Direction · Motion Design · Generative AI",
    summary:
      "Striking, on-brand visuals at the speed of culture — art direction fused with generative tooling.",
    cover: "/video/ai-generative.png",
    heroSubtitle:
      "Generative campaigns, motion, and 3D — art-directed to stay on-brand and move at the speed of culture.",
    overview:
      "We blend human art direction with generative AI and 3D pipelines to produce campaign visuals, motion, and content fast — without losing the craft or the brand.",
    capabilities: [
      "AI Art Direction",
      "Generative Imagery",
      "Motion Design",
      "3D & Render",
      "Concept Development",
      "Prompt Systems",
      "Post Production",
      "Content at Scale",
    ],
    features: [
      { title: "Art-directed, not automated", body: "Generative tools in the hands of designers — taste stays in the loop." },
      { title: "On-brand at scale", body: "Systems and prompt kits that keep hundreds of assets consistent." },
      { title: "Fast to market", body: "Concept to finished frames in days, so you can move with the moment." },
    ],
  },
];

export const getService = (slug: string) =>
  SERVICES.find((s) => s.slug === slug);
