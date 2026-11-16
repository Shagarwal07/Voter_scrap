"use client";

import { useState, useRef } from "react";
import { Map as MapIcon, Activity, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useLanguage } from "@/context/LanguageContext";
import { WARD_CATEGORIES } from "@/data/nagar_parishad/wardCategories";
import wardStats from "@/data/nagar_parishad/ward_stats.json";

const WardMapClient = dynamic(() => import("@/components/WardMapClient"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] flex items-center justify-center bg-[#E1D7BC]">
      <span className="font-courier tracking-widest text-[#1E2A42] font-bold">LOADING GEODATA...</span>
    </div>
  ),
});

const TOTAL_WARDS = 55;
const STATUSES = ["SECURE", "VERIFIED", "PENDING_AUDIT", "LIVE"];

interface WardStat {
  ward: number;
  total: number;
  male: number;
  female: number;
  other: number;
}

export default function WardMapPage() {
  const { t } = useLanguage();
  const inspectorRef = useRef<HTMLDivElement>(null);
  const [activeWardId, setActiveWardId] = useState<number | null>(null);

  const handleWardSelect = (id: number | null) => {
    setActiveWardId(id);
    if (id !== null && window.innerWidth < 1024 && inspectorRef.current) {
      setTimeout(() => {
        inspectorRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const allWards = wardStats as unknown as WardStat[];
  const activeWard = activeWardId 
    ? (allWards.find((w) => w.ward === activeWardId) || null)
    : null;

  const getCategory = (id: number) => WARD_CATEGORIES[id]?.en || "General";
  const getStatus = (id: number) => STATUSES[id % STATUSES.length];

  return (
    <div className="max-w-6xl mx-auto px-5 py-8 md:py-12">
      <div className="mb-8 border-b-[3px] border-double border-[#1E2A42] pb-4">
        <span className="font-courier text-[12px] font-bold tracking-[0.14em] text-[#E9E1CC] bg-[#1E2A42] px-2 py-[3px] inline-block mb-3">GEOGRAPHIC OVERVIEW</span>
        <h2 className="font-fraunces font-black text-3xl md:text-5xl m-0 text-[#1E2A42]">{t("Ward Map", "वार्ड नक्शा")}</h2>
      </div>

      <p className="text-[#4A4536] font-lora mb-10 max-w-3xl text-lg">
        {t("Explore the map of all 55 electoral wards. Select a ward pin below to view its localized demographic data.", "सभी 55 चुनावी वार्डों का नक्शा देखें। इसके स्थानीय जनसांख्यिकीय डेटा को देखने के लिए नीचे दिए गए वार्ड पिन का चयन करें।")}
      </p>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Side: The Schematic Grid Map */}
        <div className="flex-[2] w-full">
          <div className="bg-[#1E2A42] border-[3px] border-[#1E2A42] shadow-[6px_6px_0_rgba(30,42,66,0.3)] relative overflow-hidden group">
            {/* Grid Lines Background */}
            <div className="absolute inset-0 opacity-10" 
              style={{ backgroundImage: 'linear-gradient(#E9E1CC 1px, transparent 1px), linear-gradient(90deg, #E9E1CC 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>
            
            <div className="relative z-10 p-6 md:p-10">
              <div className="flex justify-between items-center mb-8 border-b border-[#E9E1CC]/20 pb-4">
                <div className="font-courier text-[#E9E1CC] font-bold tracking-widest text-sm flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-[#A2382B]" />
                  {t("WARD MAP: ACTIVE", "वार्ड नक्शा: सक्रिय")}
                </div>
                <div className="font-courier text-[#E9E1CC]/60 text-xs">
                  {t("TOTAL:", "कुल:")} {TOTAL_WARDS}
                </div>
              </div>

              <div className="w-full border-t-[3px] border-[#1E2A42] relative">
                <WardMapClient activeWardId={activeWardId} setActiveWardId={handleWardSelect} />
              </div>
              <div className="mt-4 text-[10px] md:text-xs font-courier font-bold text-[#E9E1CC]/60 text-right uppercase tracking-widest">
                {t("Data Source:", "डेटा स्रोत:")} esuchiroll.rajasthan.gov.in
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Details Panel */}
        <div ref={inspectorRef} className="flex-[1] w-full lg:sticky lg:top-8 scroll-mt-20">
          <div className="bg-[#E9E1CC] border-[3px] border-[#1E2A42] shadow-[6px_6px_0_rgba(30,42,66,1)] h-full flex flex-col">
            <div className="bg-[#1E2A42] p-4 text-[#E9E1CC] flex justify-between items-center border-b-[3px] border-[#1E2A42]">
              <span className="font-courier font-bold tracking-widest uppercase text-sm flex items-center">
                <MapIcon className="w-4 h-4 mr-2" /> {t("Ward Details", "वार्ड विवरण")}
              </span>
            </div>

            <div className="p-6 md:p-8 flex-1">
              {!activeWard ? (
                <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center opacity-50">
                  <Activity className="w-12 h-12 mb-4 text-[#1E2A42]" />
                  <p className="font-courier font-bold text-sm tracking-widest uppercase">{t("AWAITING WARD", "वार्ड चयन की")}<br/>{t("SELECTION", "प्रतीक्षा है")}</p>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-6">
                    <span className="font-courier text-xs font-bold tracking-widest text-[#A2382B] uppercase">{t("WARD IDENTIFIER", "वार्ड पहचानकर्ता")}</span>
                    <h3 className="font-fraunces font-black text-4xl md:text-5xl text-[#1E2A42] mt-1">{t("Ward", "वार्ड")} {activeWard.ward}</h3>
                    <div className="inline-block mt-3 px-2 py-1 bg-[#1E2A42] text-[#E9E1CC] font-courier text-xs tracking-widest">
                      {t("CATEGORY:", "श्रेणी:")} {getCategory(activeWard.ward).toUpperCase()}
                    </div>
                  </div>

                  <div className="space-y-4 font-courier text-sm">
                    <div className="flex justify-between border-b border-[#1E2A42]/20 pb-2">
                      <span className="text-[#4A4536] font-bold">{t("LIVE POPULATION", "लाइव जनसंख्या")}</span>
                      <span className="font-bold text-[#1E2A42]">
                        {activeWard.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-[#1E2A42]/20 pb-2">
                      <span className="text-[#4A4536] font-bold text-xs flex items-center gap-2"><Users className="w-3 h-3"/> {t("MALE", "पुरुष")}</span>
                      <span className="text-[#1E2A42]">
                        {activeWard.male.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-[#1E2A42]/20 pb-2">
                      <span className="text-[#4A4536] font-bold text-xs flex items-center gap-2"><Users className="w-3 h-3"/> {t("FEMALE", "महिला")}</span>
                      <span className="text-[#1E2A42]">
                        {activeWard.female.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-[#1E2A42]/20 pb-2">
                      <span className="text-[#4A4536] font-bold">{t("STATUS", "स्थिति")}</span>
                      <span className={`font-bold ${getStatus(activeWard.ward) === 'PENDING_AUDIT' ? 'text-[#A2382B]' : 'text-[#2F5B36]'}`}>
                        {getStatus(activeWard.ward)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t-[3px] border-double border-[#1E2A42] flex flex-col gap-3">
                    <Link
                      href={`/ward-pdfs?ward=${activeWard.ward}`}
                      className="w-full bg-[#1E2A42] text-[#E9E1CC] font-bold py-3.5 px-6 hover:bg-[#A2382B] transition-colors uppercase tracking-widest text-xs font-courier flex items-center justify-between group shadow-[3px_3px_0_rgba(30,42,66,1)] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none"
                    >
                      {t("GET ELECTORAL ROLL", "मतदाता सूची प्राप्त करें")}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href={`/booth?ward=${activeWard.ward}`}
                      className="w-full bg-[#2F5B36] text-[#E9E1CC] font-bold py-3.5 px-6 hover:bg-[#1E2A42] transition-colors uppercase tracking-widest text-xs font-courier flex items-center justify-between group shadow-[3px_3px_0_rgba(30,42,66,1)] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none"
                    >
                      {t("LOCATE POLLING BOOTHS", "मतदान केंद्र खोजें")}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
