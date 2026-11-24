import ContactSection from "@/components/ContactSection";
import ContactFooter from "@/components/ContactFooter";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Contact", "Start a branding, website or AI creative project with Darwin Corp, based in Dubai and working worldwide. We reply within one business day.", "/contact");

export default function ContactPage() {
  return (
    <main>
      <ContactSection />
      <ContactFooter hideCta />
    </main>
  );
}
