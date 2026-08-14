import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import StatusWidget from "@/components/StatusWidget";
import Preloader from "@/components/Preloader";
import StudioSection from "@/components/StudioSection";
import FeaturedWork from "@/components/FeaturedWork";
import CoreServices from "@/components/CoreServices";
import WhatWeDo from "@/components/WhatWeDo";
import About from "@/components/About";
import Testimonials from "@/components/Testimonials";
import BestOfWeek from "@/components/BestOfWeek";
import ContactFooter from "@/components/ContactFooter";

export default function Home() {
  return (
    <main>
      <Preloader />
      <Hero />
      <StudioSection />
      <FeaturedWork />
      <CoreServices />
      <WhatWeDo />
      <About />
      <Testimonials />
      <BestOfWeek />
      <ContactFooter />
      <Navbar />
      <StatusWidget />
    </main>
  );
}
