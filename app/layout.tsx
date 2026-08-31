import type { Metadata } from "next";
import { Instrument_Serif, Handjet, Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import FloatingActions from "@/components/FloatingActions";
import Navbar from "@/components/Navbar";
import ScrollReveal from "@/components/ScrollReveal";
import CookieConsent from "@/components/CookieConsent";
import PromoPopup from "@/components/PromoPopup";
import MotionDebug from "@/components/MotionDebug";

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});

const handjet = Handjet({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-handjet",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

// The site answers on www; the apex redirects there, so canonical and share
// URLs point at www to avoid sending crawlers through a redirect.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thedarwin.co";

const DESCRIPTION =
  "Darwin Corp is a Dubai studio creating brands, digital experiences and stories designed to evolve with people, culture and technology.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Darwin Corp - Brand, Web and AI Creative Studio in Dubai",
    template: "%s - Darwin Corp",
  },
  description: DESCRIPTION,
  applicationName: "Darwin Corp",
  alternates: { canonical: "/" },
  // opengraph-image.png / twitter-image.png in this directory supply the
  // image tags automatically, including dimensions.
  openGraph: {
    type: "website",
    siteName: "Darwin Corp",
    url: SITE_URL,
    title: "Darwin Corp - Brand, Web and AI Creative Studio in Dubai",
    description: DESCRIPTION,
    locale: "en_AE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Darwin Corp - Brand, Web and AI Creative Studio in Dubai",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${instrument.variable} ${handjet.variable} ${inter.variable}`}
    >
      <body>
        <SmoothScroll />
        <ScrollReveal />
        <Navbar />
        {children}
        <FloatingActions />
        <CookieConsent />
        <PromoPopup />
        <MotionDebug />
      </body>
    </html>
  );
}
