"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Map, Users, FileText, Home, MapPin, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Header() {
  const { language, toggleLanguage, t } = useLanguage();
  const [isNavigatingSearch, setIsNavigatingSearch] = useState(false);

  return (
    <>
      {/* Floating Sticky Marquee Promotion */}
      <div className="sticky top-0 left-0 right-0 z-[100] w-full bg-[#1E2A42] border-b-2 border-double border-[#6B6944] py-2 md:py-3 overflow-hidden shadow-[0_4px_10px_rgba(30,42,66,0.2)]">
        <div className="animate-marquee inline-block text-[#E9E1CC] font-courier font-bold text-sm md:text-base tracking-[0.2em] uppercase whitespace-nowrap">
          <span className="mx-6 text-[#A2382B]">✦</span>
          {t("UNOFFICIAL VOTER PORTAL BY RK COACHING CLASSES , DESIGNED AND DEVELOPED BY", "RK कोचिंग क्लासेस द्वारा अनौपचारिक वोटर पोर्टल, IWS द्वारा डिज़ाइन और विकसित")} <a href="/about" className="text-[#E9E1CC] bg-[#A2382B]/20 border border-[#A2382B] px-2 py-0.5 ml-1 hover:bg-[#A2382B] hover:text-white transition-colors">IWS</a>
          <span className="mx-6 text-[#A2382B]">✦</span>
          {t("UNOFFICIAL VOTER PORTAL BY RK COACHING CLASSES , DESIGNED AND DEVELOPED BY", "RK कोचिंग क्लासेस द्वारा अनौपचारिक वोटर पोर्टल, IWS द्वारा डिज़ाइन और विकसित")} <a href="/about" className="text-[#E9E1CC] bg-[#A2382B]/20 border border-[#A2382B] px-2 py-0.5 ml-1 hover:bg-[#A2382B] hover:text-white transition-colors">IWS</a>
        </div>
      </div>

      <header className="max-w-6xl mx-auto w-full flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 xl:gap-6 px-5 pt-5 sm:pt-8 pb-4 sm:pb-6 border-b-[3px] border-double border-[#1E2A42]">
        <div className="flex flex-col items-start relative max-w-full">
          <Link href="/" className="flex items-center gap-2 sm:gap-4 group">
            <h1 className="text-[32px] sm:text-5xl md:text-6xl font-black text-[#1E2A42] font-fraunces tracking-tight leading-none cursor-pointer whitespace-nowrap mt-1">
              {t("Electoral Portal", "चुनाव पोर्टल")}
            </h1>

            {/* Red Unofficial Seal */}
            <svg className="w-14 h-14 sm:w-16 sm:h-16 md:w-[84px] md:h-[84px] opacity-90 mix-blend-multiply rotate-[-12deg] shrink-0 group-hover:rotate-0 transition-transform duration-500" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="rough-seal">
                  <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" result="n" />
                  <feDisplacementMap in="SourceGraphic" in2="n" scale="4" />
                </filter>
                <path id="seal-ringtop" d="M 30,100 A 70,70 0 0 1 170,100" />
                <path id="seal-ringbot" d="M 170,100 A 70,70 0 0 1 30,100" />
              </defs>
              <g filter="url(#rough-seal)" fill="none" stroke="#A2382B" strokeWidth="3.5">
                <circle cx="100" cy="100" r="92" />
                <circle cx="100" cy="100" r="80" />
              </g>
              <g filter="url(#rough-seal)" fill="#A2382B" fontFamily="Courier Prime, monospace" fontSize="13" letterSpacing="3">
                <text><textPath href="#seal-ringtop" startOffset="50%" textAnchor="middle">{t("UNOFFICIAL PORTAL", "अनौपचारिक पोर्टल")}</textPath></text>
                <text><textPath href="#seal-ringbot" startOffset="50%" textAnchor="middle">{t("UNVERIFIED DATA", "असत्यापित डेटा")}</textPath></text>
              </g>
              <g filter="url(#rough-seal)" fill="#A2382B" textAnchor="middle" fontFamily="Fraunces, serif">
                <text x="100" y="106" fontSize="22" fontWeight="800">UNOFFICIAL</text>
              </g>
            </svg>
          </Link>
          <div className="flex flex-col items-start gap-3 mt-2 sm:mt-4 max-w-full">
            <p className="text-[#4A4536] text-xs sm:text-base md:text-lg font-courier tracking-[0.1em] sm:tracking-[0.2em] uppercase font-bold">
              {t("For Helping Volunteers", "स्वयंसेवकों की मदद के लिए")}
            </p>
            {/* Brutalist Language Toggle Switch */}
            <div
              onClick={toggleLanguage}
              className="flex items-center cursor-pointer border-[2px] border-[#1E2A42] bg-white shadow-[3px_3px_0_rgba(30,42,66,1)] rounded-full p-1 w-[72px] h-8 relative transition-all hover:-translate-y-[1px] hover:shadow-[4px_4px_0_rgba(30,42,66,1)] active:translate-y-0 active:shadow-none shrink-0"
              title="Toggle English / Hindi"
            >
              <div className={`absolute top-1 bottom-1 w-7 bg-[#A2382B] rounded-full transition-all duration-300 shadow-inner ${language === 'en' ? 'left-1' : 'left-[34px]'}`}></div>
              <span className={`flex-1 text-center font-courier font-bold text-[10px] z-10 transition-colors duration-300 ${language === 'en' ? 'text-white' : 'text-[#1E2A42]'}`}>EN</span>
              <span className={`flex-1 text-center font-courier font-bold text-[10px] z-10 transition-colors duration-300 ${language === 'hi' ? 'text-white' : 'text-[#1E2A42]'}`}>HI</span>
            </div>
          </div>
        </div>

        <nav className="flex flex-nowrap overflow-x-auto gap-2 md:gap-3 items-center w-full xl:w-auto mt-5 xl:mt-0 self-start xl:self-auto font-courier text-xs pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <Link
            href="/"
            className="group w-full xl:w-auto justify-center px-2 py-2.5 md:px-3 md:py-2 bg-[#1E2A42] border-[1.5px] border-[#1E2A42] text-[#E9E1CC] font-bold flex items-center gap-1.5 rounded-full hover:bg-transparent hover:text-[#1E2A42] transition-all duration-300 uppercase tracking-widest whitespace-nowrap"
          >
            <Home className="w-4 h-4 shrink-0" />
            <span>{t("Home", "होम")}</span>
          </Link>
          <Link
            href="/ward-pdfs"
            className="group w-full xl:w-auto justify-center px-2 py-2.5 md:px-3 md:py-2 bg-[#1E2A42] border-[1.5px] border-[#1E2A42] text-[#E9E1CC] font-bold flex items-center gap-1.5 rounded-full hover:bg-transparent hover:text-[#1E2A42] transition-all duration-300 uppercase tracking-widest whitespace-nowrap"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>{t("Voters PDF", "मतदाता पीडीएफ")}</span>
          </Link>
          <Link
            href="/candidates"
            className="group w-full xl:w-auto justify-center px-2 py-2.5 md:px-3 md:py-2 bg-[#1E2A42] border-[1.5px] border-[#1E2A42] text-[#E9E1CC] font-bold flex items-center gap-1.5 rounded-full hover:bg-transparent hover:text-[#1E2A42] transition-all duration-300 uppercase tracking-widest whitespace-nowrap"
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>{t("Candidates", "प्रत्याशी")}</span>
          </Link>
          <Link
            href="/map"
            className="group w-full xl:w-auto justify-center px-2 py-2.5 md:px-3 md:py-2 bg-[#1E2A42] border-[1.5px] border-[#1E2A42] text-[#E9E1CC] font-bold flex items-center gap-1.5 rounded-full hover:bg-transparent hover:text-[#1E2A42] transition-all duration-300 uppercase tracking-widest whitespace-nowrap"
          >
            <Map className="w-4 h-4 shrink-0" />
            <span>{t("Map", "नक्शा")}</span>
          </Link>
          <Link
            href="/booth"
            className="group w-full xl:w-auto justify-center px-2 py-2.5 md:px-3 md:py-2 bg-[#2F5B36] border-[1.5px] border-[#2F5B36] text-[#E9E1CC] font-bold flex items-center gap-1.5 rounded-full hover:bg-[#2F5B36]/10 hover:text-[#2F5B36] transition-all duration-300 uppercase tracking-widest whitespace-nowrap"
          >
            <MapPin className="w-4 h-4 shrink-0" />
            <span>{t("My Booth", "मेरा बूथ")}</span>
          </Link>
          <Link
            href="/live-turnout"
            className="group w-full xl:w-auto justify-center px-2 py-2.5 md:px-3 md:py-2 bg-[#A2382B] border-[1.5px] border-[#A2382B] text-[#E9E1CC] font-bold flex items-center gap-1.5 rounded-full hover:bg-[#A2382B]/10 hover:text-[#A2382B] transition-all duration-300 uppercase tracking-widest whitespace-nowrap"
          >
            <span className="w-2 h-2 rounded-full bg-[#E9E1CC] group-hover:bg-[#A2382B] animate-pulse shrink-0"></span>
            <span>{t("Live Updates", "लाइव अपडेट")}</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              if (isNavigatingSearch) return;
              setIsNavigatingSearch(true);
              window.location.href = process.env.NEXT_PUBLIC_SEARCH_APP_URL || "http://localhost:3001";
            }}
            disabled={isNavigatingSearch}
            className="group col-span-2 md:col-span-1 xl:col-span-1 w-full xl:w-auto justify-center px-4 py-2.5 md:px-4 md:py-2 bg-[#1E2A42] border-[1.5px] border-[#1E2A42] text-[#E9E1CC] font-bold flex items-center gap-1.5 rounded-full hover:bg-transparent hover:text-[#1E2A42] transition-all duration-300 uppercase tracking-widest shadow-md hover:shadow-none whitespace-nowrap disabled:opacity-75 disabled:cursor-wait cursor-pointer"
          >
            {isNavigatingSearch ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#E9E1CC] group-hover:text-[#1E2A42]" />
                <span>{t("Connecting...", "जुड़ रहे हैं...")}</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 shrink-0" />
                <span>{t("Search Database", "डेटाबेस खोजें")}</span>
              </>
            )}
          </button>
        </nav>
      </header>
    </>
  );
}
