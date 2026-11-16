"use client";

import { useState } from "react";
import { Search, Map, Users, ArrowRight, FileText, MapPin, Activity, Loader2 } from "lucide-react";
import Link from "next/link";
import AdCarousel from "@/components/AdCarousel";
import { useLanguage } from "@/context/LanguageContext";

export default function Home() {
  const { t } = useLanguage();
  const [isNavigatingSearch, setIsNavigatingSearch] = useState(false);

  const features = [
    {
      title: t("Ward 5 Polling Details", "वार्ड 5 मतदान विवरण"),
      description: t("Check Ward 5 completed polling turnout and verify voter status with keypad.", "वार्ड 5 का संपन्न मतदान रुझान देखें और कीपैड से मतदाता स्थिति जांचें।"),
      icon: <Activity className="h-6 w-6 text-[#A2382B]" />,
      href: "/live-turnout",
      badge: t("DONE", "संपन्न"),
    },
    {
      title: t("Ward Voter Lists", "वार्ड मतदाता सूची"),
      description: t("Directly download PDF voter lists for your specific ward instantly.", "अपने वार्ड के लिए सीधे पीडीएफ मतदाता सूची तुरंत डाउनलोड करें।"),
      icon: <FileText className="h-6 w-6 text-[#1E2A42]" />,
      href: "/ward-pdfs",
    },
    {
      title: t("Candidate Directory", "प्रत्याशी निर्देशिका"),
      description: t("Explore profiles of all candidates (Umidvaar) standing in your ward.", "अपने वार्ड में खड़े सभी प्रत्याशियों (उम्मीदवारों) के प्रोफाइल देखें।"),
      icon: <Users className="h-6 w-6 text-[#A2382B]" />,
      href: "/candidates",
    },
    {
      title: t("Ward Map", "वार्ड नक्शा"),
      description: t("Visualize constituency boundaries and find your polling booth.", "निर्वाचन क्षेत्र की सीमाओं की कल्पना करें और अपना मतदान केंद्र खोजें।"),
      icon: <Map className="h-6 w-6 text-[#2F5B36]" />,
      href: "/map",
    },
    {
      title: t("Booth Locator", "बूथ खोजक"),
      description: t("Find your designated polling station on Google Maps.", "Google Maps पर अपना निर्दिष्ट मतदान केंद्र खोजें।"),
      icon: <MapPin className="h-6 w-6 text-[#1E2A42]" />,
      href: "/booth",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-6 md:py-12 flex flex-col gap-8 md:gap-12">
      
      {/* 0. Notification Panel: Ward 5 Polling Details Concluded */}
      <section className="bg-[#1E2A42] border-[3px] border-[#A2382B] p-4 sm:p-5 shadow-[6px_6px_0_rgba(162,56,43,1)] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="w-3 h-3 rounded-full bg-[#22c55e] mt-1.5 shrink-0 animate-pulse"></span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#A2382B] text-[#E9E1CC] font-courier font-black text-[10px] tracking-widest uppercase px-1.5 py-0.5 border border-[#E9E1CC]/20">
                  {t("OFFICIAL UPDATE", "आधिकारिक सूचना")}
                </span>
                <span className="font-courier text-[#E9E1CC]/60 text-xs">
                  Ward 5 (Agrawal Colony)
                </span>
              </div>
              <h3 className="font-fraunces font-bold text-lg sm:text-xl text-[#E9E1CC] leading-snug">
                {t("Ward 5 Municipal Polling Concluded", "वार्ड 5 नगर परिषद मतदान संपन्न")}
              </h3>
              <p className="font-lora text-xs sm:text-sm text-[#E9E1CC]/80 mt-1 max-w-2xl leading-relaxed">
                {t("Voting for Ward 5 is completed. Total 865 of 1308 votes cast (66.13% Turnout). Certified historical results and analytics are available.", "वार्ड 5 का मतदान शांतिपूर्ण संपन्न हो चुका है। कुल 1308 में से 865 मत डाले गए (66.13% मतदान)। प्रमाणित आंकड़े एवं विवरण उपलब्ध हैं।")}
              </p>
            </div>
          </div>
          <Link
            href="/live-turnout"
            className="w-full sm:w-auto text-center font-courier font-bold text-xs uppercase tracking-widest bg-[#E9E1CC] text-[#1E2A42] px-4 py-2.5 hover:bg-[#A2382B] hover:text-[#E9E1CC] transition-colors shrink-0 shadow-[2px_2px_0_rgba(0,0,0,0.3)]"
          >
            {t("View Turnout Details", "मतदान विवरण देखें")} &rarr;
          </Link>
        </div>
      </section>

      {/* 1. Hero Search Section */}
      <section className="bg-[#E9E1CC] border-[3px] border-[#1E2A42] p-6 sm:p-10 shadow-[8px_8px_0_rgba(30,42,66,1)] relative overflow-hidden">
        <div className="max-w-2xl">
          <div className="inline-block bg-[#1E2A42] text-[#E9E1CC] font-courier font-bold text-xs tracking-widest uppercase px-2.5 py-1 mb-4 shadow-[2px_2px_0_rgba(162,56,43,1)]">
            {t("CIVIC SEARCH ENGINE", "नागरिक खोज इंजन")}
          </div>
          <h2 className="font-fraunces font-black text-3xl sm:text-4xl md:text-5xl text-[#1E2A42] mb-4 leading-tight">
            {t("Find Your Polling Details in Seconds", "सेकंडों में अपना मतदान विवरण खोजें")}
          </h2>
          <p className="font-lora text-[#4A4536] text-base sm:text-lg mb-8 leading-relaxed">
            {t("Access digitized electoral rolls, explore ward candidates, or download official booth PDFs.", "डिजिटल मतदाता सूची खोजें, वार्ड प्रत्याशियों की जानकारी लें, या आधिकारिक बूथ पीडीएफ डाउनलोड करें।")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={() => {
              if (isNavigatingSearch) return;
              setIsNavigatingSearch(true);
              window.location.href = process.env.NEXT_PUBLIC_SEARCH_APP_URL || "http://localhost:3001";
            }}
            disabled={isNavigatingSearch}
            className="flex-1 bg-[#1E2A42] text-[#E9E1CC] font-bold py-4 px-6 hover:bg-[#A2382B] transition-colors uppercase tracking-widest text-xs font-courier flex items-center justify-center group shadow-[4px_4px_0_rgba(30,42,66,1)] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none disabled:opacity-80 disabled:cursor-wait cursor-pointer"
          >
            {isNavigatingSearch ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin text-[#E9E1CC]" />
                <span>{t("Connecting to Database...", "डेटाबेस से जुड़ रहे हैं...")}</span>
              </>
            ) : (
              <>
                <Search className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                <span>{t("Search Master Database", "मास्टर डेटाबेस खोजें")}</span>
                <ArrowRight className="ml-auto w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          <Link
            href="/ward-pdfs"
            className="flex-1 bg-[#2F5B36] text-[#E9E1CC] font-bold py-4 px-6 hover:bg-[#1E2A42] transition-colors uppercase tracking-widest text-xs font-courier flex items-center justify-center group shadow-[4px_4px_0_rgba(30,42,66,1)] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none"
          >
            <FileText className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
            {t("Voters PDF", "मतदाता पीडीएफ")}
          </Link>
        </div>
      </section>

      {/* 2. Available Modules Section */}
      <section>
        <div className="flex items-end gap-3 sm:gap-[14px] mb-6 pb-2.5 border-b-[2px] border-[#1E2A42]">
          <span className="font-courier text-[12px] font-bold tracking-[0.14em] text-[#1E2A42] bg-[#E1D7BC] border border-[#1E2A42] px-2 py-[3px] whitespace-nowrap">{t("INDEX", "अनुक्रमणिका")}</span>
          <h2 className="font-fraunces font-bold text-2xl md:text-3xl m-0 text-[#24211A]">{t("Available Modules", "उपलब्ध मॉड्यूल")}</h2>
        </div>

        <div className="flex overflow-x-auto gap-4 md:gap-6 pb-6 snap-x snap-mandatory px-2 -mx-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {features.map((feature, idx) => (
            <Link
              key={idx}
              href={feature.href}
              className="block group min-w-[240px] flex-1 snap-start shrink-0"
            >
              <div className="bg-[#E9E1CC] border-[2px] border-[#1E2A42] p-4 sm:p-5 shadow-[4px_4px_0_rgba(30,42,66,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_rgba(30,42,66,1)] transition-all h-full flex flex-col justify-center">
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="p-2.5 bg-[#E1D7BC] border-2 border-[#1E2A42] shrink-0 shadow-inner">
                    {feature.icon}
                  </div>
                  {feature.badge && (
                    <span className="font-courier text-[10px] font-black tracking-[0.14em] text-[#E9E1CC] bg-[#A2382B] border-2 border-[#1E2A42] px-2 py-1 uppercase shadow-[2px_2px_0_rgba(30,42,66,1)] shrink-0 ml-2 text-center max-w-[80px]">
                      {feature.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black font-fraunces text-[#1E2A42] group-hover:text-[#A2382B] transition-colors leading-tight m-0">
                  {feature.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Sponsor Section (AdCarousel) */}
      <section className="mt-8">
        <div className="flex items-end gap-3 sm:gap-[14px] mb-6 pb-2.5 border-b-[2px] border-[#1E2A42]">
          <span className="font-courier text-[12px] font-bold tracking-[0.14em] text-[#1E2A42] bg-[#E1D7BC] border border-[#1E2A42] px-2 py-[3px] whitespace-nowrap">{t("SUPPORTED BY", "द्वारा समर्थित")}</span>
          <h2 className="font-fraunces font-bold text-2xl md:text-3xl m-0 text-[#24211A]">{t("Our Sponsors", "हमारे प्रायोजक")}</h2>
        </div>
        <AdCarousel />
      </section>

    </div>
  );
}
