import ContactSection from "@/components/ContactSection";
import ContactFooter from "@/components/ContactFooter";

export const metadata = { title: "Contact - Darwin Corp" };

export default function ContactPage() {
  return (
    <main>
      <ContactSection />
      <ContactFooter hideCta />
    </main>
  );
}
