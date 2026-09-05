import type { Metadata } from "next";
import LinksPageClient from "./LinksPageClient";

const TITLE = "Links - Hasaka";
const DESCRIPTION =
  "Every Hasaka and Darwin Corp property in one place: the studio, the portfolio, Dubaiography, the creative repository, Glitch Decoded and Born Cinema.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/links" },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function LinksPage() {
  return <LinksPageClient />;
}
