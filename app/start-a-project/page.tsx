import ContactSection from "@/components/ContactSection";
import ContactFooter from "@/components/ContactFooter";
import StructuredData from "@/components/StructuredData";
import { breadcrumbData, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Start a Project", "Tell Darwin Corp about your brand, website or creative project. Share your requirements, budget and intended timeline with our Dubai studio.", "/start-a-project");
export default function Page() {
  return <main>
    <StructuredData data={breadcrumbData([{ label: "Home", href: "/" }, { label: "Start a project", href: "/start-a-project" }])} />
    <ContactSection projectBrief /><ContactFooter hideCta />
  </main>;
}
