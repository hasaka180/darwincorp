import Hero from "@/components/Hero";
import StatusWidget from "@/components/StatusWidget";
import Preloader from "@/components/Preloader";
import StudioSection from "@/components/StudioSection";
import FeaturedWork, { type FeaturedItem } from "@/components/FeaturedWork";
import CoreServices from "@/components/CoreServices";
import WhatWeDo from "@/components/WhatWeDo";
import About from "@/components/About";
import Testimonials from "@/components/Testimonials";
import BestOfWeek from "@/components/BestOfWeek";
import ContactFooter from "@/components/ContactFooter";
import { getItems, type CaseStudy } from "@/lib/cases";
import { SERVICES } from "@/lib/services";

export const revalidate = 600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thedarwin.co";

/**
 * Organization schema for the homepage. Gives Google an explicit site name,
 * logo and service list rather than leaving it to infer them, which is what
 * feeds the brand result in search.
 */
const ORG_LD = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${SITE_URL}/#organization`,
  name: "Darwin Corp",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  image: `${SITE_URL}/opengraph-image.png`,
  description:
    "Darwin Corp is a Dubai studio creating brands, digital experiences and stories designed to evolve with people, culture and technology.",
  email: "hello@thedarwin.co",
  telephone: "+971555355897",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Dubai",
    addressCountry: "AE",
  },
  areaServed: "Worldwide",
  sameAs: [
    "https://www.instagram.com/thedarwin_co/",
    "https://www.facebook.com/thedarwincorp",
    "https://www.linkedin.com/company/darwinco/",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Services",
    itemListElement: SERVICES.map((s) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: s.title,
        description: s.summary,
        url: `${SITE_URL}/services/${s.slug}`,
      },
    })),
  },
};

export default async function Home() {
  const all = await getItems();
  const cases = all.filter((i): i is CaseStudy => "sections" in i);
  // Featured items take the prominent slots; fill the rest to keep the grid full.
  const ordered = [...cases.filter((c) => c.featured), ...cases.filter((c) => !c.featured)];
  const featuredItems: FeaturedItem[] = ordered.slice(0, 6).map((c) => ({
    title: c.title,
    slug: c.slug,
    tags: c.services ?? [],
    cover: c.cover,
    accent: c.accent,
  }));

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_LD) }}
      />
      <Preloader />
      <Hero />
      <StudioSection />
      <FeaturedWork items={featuredItems} />
      <CoreServices />
      <WhatWeDo />
      <About />
      <Testimonials />
      <BestOfWeek />
      <ContactFooter />
      <StatusWidget />
    </main>
  );
}
