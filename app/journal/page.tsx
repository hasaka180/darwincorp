import BestOfWeek from "@/components/BestOfWeek";
import ContactFooter from "@/components/ContactFooter";

export const metadata = { title: "Journal — Darwin Corp" };

export default function JournalPage() {
  return (
    <main>
      <BestOfWeek />
      <ContactFooter />
    </main>
  );
}
