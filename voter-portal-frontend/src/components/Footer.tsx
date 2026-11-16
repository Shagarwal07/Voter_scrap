"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  // Use environment variable for the search app domain, fallback to local development search app
  const searchAppUrl = (process.env.NEXT_PUBLIC_SEARCH_APP_URL || "http://localhost:3001").replace(/\/$/, "");
  const { t } = useLanguage();

  return (
    <footer className="relative z-20 mt-4 pt-8 pb-8 flex flex-col items-center justify-center gap-6 text-[#4A4536] text-sm border-t-[3px] border-[#1E2A42] font-courier max-w-6xl mx-auto w-full px-4 md:px-8">
      <div className="flex flex-col md:flex-row justify-between w-full gap-8 border-b-2 border-dashed border-[#1E2A42]/30 pb-8">

        {/* Creator Info */}
        <div className="flex-[2] max-w-2xl">
          <div className="inline-block bg-[#1E2A42] text-[#E9E1CC] font-courier font-bold text-[10px] tracking-widest uppercase px-2 py-1 mb-3">
            {t("A TECHNICAL INITIATIVE", "एक तकनीकी पहल")}
          </div>
          <h3 className="font-fraunces font-bold text-xl text-[#1E2A42] mb-2">
            {t("Smart Voter Search Platform", "स्मार्ट वोटर सर्च प्लेटफॉर्म")}
          </h3>
          <p className="text-xs md:text-sm font-lora mb-4 text-[#1E2A42]/80 leading-relaxed">
            {t("Developed for public convenience by", "आमजन की सुविधा के लिए")} <strong>IWS (Imposter World Services)</strong> & <strong>Shubham Agrawal</strong> <span className="text-[#A2382B]">(S/o Rakesh Ji Agrawal, Booth President, Ward No. 5 - Agrawal Colony)</span>.
            {t("This tool aims to eliminate the hassle of finding voter details in massive PDFs, saving valuable time for citizens and volunteers on election day.", "यह टूल भारी-भरकम PDF में वोटर डिटेल्स खोजने की परेशानी को दूर करता है, जिससे चुनाव के दिन स्वयंसेवकों और नागरिकों का काफी समय बचता है।")}
          </p>
          <div className="flex flex-wrap gap-4 md:gap-8 font-courier text-xs font-bold tracking-widest text-[#1E2A42]">
            <div>
              <span className="text-[#A2382B] block mb-0.5 text-[10px]">{t("GENERAL CONTACT", "सामान्य संपर्क")}</span>
              +91 9414668795
            </div>
            <div>
              <span className="text-[#A2382B] block mb-0.5 text-[10px]">{t("TECHNICAL SUPPORT", "तकनीकी सहायता")}</span>
              +91 8890106858
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="flex-1 flex flex-col items-start md:items-end gap-3 font-bold tracking-widest uppercase text-xs pt-2">
          <Link href="/about" className="text-[#1E2A42] hover:text-[#A2382B] transition-colors border-b border-transparent hover:border-[#A2382B]">
            About Platform
          </Link>
          <Link href="/legal" className="text-[#1E2A42] hover:text-[#A2382B] transition-colors border-b border-transparent hover:border-[#A2382B]">
            Legal & Notices
          </Link>
        </div>

      </div>

      <div className="w-full flex justify-between items-center text-[10px] font-bold tracking-widest uppercase text-[#1E2A42]/70">
        <p>© 2026 Voter_Scrapper</p>
        <p>ALL RIGHTS RESERVED</p>
      </div>
    </footer>
  );
}
