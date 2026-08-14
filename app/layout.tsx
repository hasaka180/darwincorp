import type { Metadata } from "next";
import { Instrument_Serif, Handjet, Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import FloatingActions from "@/components/FloatingActions";
import Navbar from "@/components/Navbar";

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

export const metadata: Metadata = {
  title: "Darwin — The Mirror of Imagination",
  description:
    "An immersive 3D hero with a mouse-reactive jellyfish, glass navigation, and full-page menus.",
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
        <Navbar />
        {children}
        <FloatingActions />
      </body>
    </html>
  );
}
