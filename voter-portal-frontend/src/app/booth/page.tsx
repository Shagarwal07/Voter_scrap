"use client";

import { MapPin, Construction } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function BoothLocatorPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 md:py-16 flex flex-col items-center">
      
      <div className="mb-10 text-center">
        <span className="inline-block px-3 py-1 bg-[#1E2A42] text-[#E9E1CC] font-courier font-bold text-xs tracking-widest uppercase mb-4 border border-[#1E2A42] shadow-[2px_2px_0_rgba(107,105,68,1)]">
          {t("LOCATION SERVICES", "स्थान सेवाएं")}
        </span>
        <h2 className="text-4xl md:text-5xl font-black text-[#1E2A42] font-fraunces mb-4">
          {t("Take Me To My Booth", "मुझे मेरे बूथ पर ले चलें")}
        </h2>
      </div>

      <div className="w-full bg-[#E9E1CC] border-[3px] border-[#1E2A42] shadow-[8px_8px_0_rgba(30,42,66,1)] p-10 md:p-16 relative overflow-hidden flex flex-col items-center justify-center text-center">
        
        {/* Background Decorative Graphic */}
        <MapPin className="absolute -right-10 -bottom-10 w-64 h-64 text-[#1E2A42] opacity-5 -rotate-12 pointer-events-none" />

        <div className="bg-[#A2382B] p-4 rounded-full border-4 border-[#1E2A42] shadow-[4px_4px_0_rgba(30,42,66,1)] mb-6 z-10 animate-pulse">
          <Construction className="w-12 h-12 text-[#E9E1CC]" />
        </div>
        
        <h3 className="font-fraunces font-black text-3xl md:text-4xl text-[#1E2A42] mb-4 z-10">
          {t("Feature Coming Soon", "सुविधा जल्द आ रही है")}
        </h3>
        
        <p className="text-[#4A4536] text-lg font-lora max-w-lg z-10">
          {t("The official booth location data is currently being verified and updated. Please check back closer to election day.", "आधिकारिक बूथ स्थान डेटा वर्तमान में सत्यापित और अपडेट किया जा रहा है। कृपया चुनाव के दिन के करीब वापस जांचें।")}
        </p>
        
        <div className="mt-8 font-courier font-bold text-xs tracking-widest text-[#1E2A42] uppercase border-b-2 border-dashed border-[#1E2A42] pb-1 z-10">
          {t("DATA PENDING VERIFICATION", "डेटा सत्यापन लंबित")}
        </div>
      </div>
    </div>
  );
}
