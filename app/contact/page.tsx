import ContactSection from "@/components/ContactSection";
import ContactFooter from "@/components/ContactFooter";

export const metadata = {
  title: "Contact",
  description:
    "Start a branding, website or AI creative project with Darwin Corp in Dubai. We reply within one business day.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main>
      <ContactSection />
      <ContactFooter hideCta />
    </main>
  );
}
