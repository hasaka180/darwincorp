import type { Metadata } from "next";
import { Instrument_Serif, Handjet, Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import FloatingActions from "@/components/FloatingActions";
import Navbar from "@/components/Navbar";
import ScrollReveal from "@/components/ScrollReveal";
import CookieConsent from "@/components/CookieConsent";
import AdSense from "@/components/AdSense";
import GoogleTagManager from "@/components/GoogleTagManager";
import PromoPopup from "@/components/PromoPopup";
import StructuredData from "@/components/StructuredData";
import { SITE_DESCRIPTION, organizationData } from "@/lib/seo";

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

const DESCRIPTION = SITE_DESCRIPTION;

// Dubai stays in the title: the UAE converts best of any market (5% CTR vs
// 1.3% in the US), and dropping it would trade that for nothing. "Worldwide"
// stops the homepage reading as local-only.
const TITLE = "Darwin Corp - Motion-Driven Creative Studio | Dubai & Worldwide";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
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
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_AE",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  // Verifies the site for AdSense without loading the ad script (see AdSense.tsx).
  other: { "google-adsense-account": "ca-pub-5661938637436853" },
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
        <GoogleTagManager />
        <StructuredData data={organizationData} />
        <SmoothScroll />
        <ScrollReveal />
        <Navbar />
        {children}
        <FloatingActions />
        <CookieConsent />
        <AdSense />
        <PromoPopup />
      </body>
    </html>
  );
}
