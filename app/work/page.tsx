import FeaturedWork from "@/components/FeaturedWork";
import ContactFooter from "@/components/ContactFooter";

export const metadata = { title: "Work — Darwin Corp" };

export default function WorkPage() {
  return (
    <main>
      <FeaturedWork />
      <ContactFooter />
    </main>
  );
}
