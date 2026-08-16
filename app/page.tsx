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

export const revalidate = 600;

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
