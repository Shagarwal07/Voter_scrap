import type { Metadata } from "next";
import { Fraunces, Lora, Courier_Prime, Kalam, Martel } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/context/LanguageContext";
import PwaRegistry from "@/components/PwaRegistry";
import InstallPrompt from "@/components/InstallPrompt";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const courier = Courier_Prime({
  variable: "--font-courier",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const kalam = Kalam({
  variable: "--font-kalam",
  weight: ["400", "700"],
  subsets: ["devanagari"],
});

const martel = Martel({
  variable: "--font-martel",
  weight: ["400", "700", "900"],
  subsets: ["devanagari"],
});

export const metadata: Metadata = {
  title: "Community Voter Portal | Unofficial Search & Electoral Rolls",
  description: "A fast, intelligent search platform for digitized electoral rolls. Explore candidate profiles, download ward PDFs, and seamlessly search the master database.",
  keywords: ["voter", "electoral roll", "search", "database", "hindi", "candidates"],
  manifest: "/manifest.json",
  openGraph: {
    title: "Community Voter Portal",
    description: "Intelligent search platform for digitized electoral rolls.",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${lora.variable} ${courier.variable} ${kalam.variable} ${martel.variable} antialiased relative bg-[#E9E1CC] text-[#24211A] font-lora`}
      >
        <LanguageProvider>
          <div className="iws-noise-overlay fixed inset-0 pointer-events-none z-10"></div>
          <div className="relative z-20 flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow pt-4 pb-4">
              {children}
            </main>
            <Footer />
          </div>
          <PwaRegistry />
          <InstallPrompt />
        </LanguageProvider>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
        <Analytics />
      </body>
    </html>
  );
}
