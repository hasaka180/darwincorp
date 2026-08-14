import CoreServices from "@/components/CoreServices";
import WhatWeDo from "@/components/WhatWeDo";
import ContactFooter from "@/components/ContactFooter";

export const metadata = { title: "Services — Darwin Corp" };

export default function ServicesPage() {
  return (
    <main>
      <CoreServices />
      <WhatWeDo />
      <ContactFooter />
    </main>
  );
}
