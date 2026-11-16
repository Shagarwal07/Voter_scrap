"use client";

import { useState, useRef, useEffect, Suspense, useMemo } from "react";
import { Search, Download, FileText, Info, Eye, Loader2, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import { useLanguage } from "@/context/LanguageContext";
import { WARD_CATEGORIES } from "@/data/nagar_parishad/wardCategories";
import wardStatsData from "@/data/nagar_parishad/ward_stats.json";

interface WardStat {
  ward: number;
  total: number;
  male: number;
  female: number;
  other: number;
  status?: string;
}

const STATUSES = ["VERIFIED", "PENDING_AUDIT"];
const allWardStats = wardStatsData as unknown as WardStat[];

function WardPdfsContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const initialWard = searchParams.get('ward');
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeWardId, setActiveWardId] = useState<number | null>(initialWard ? parseInt(initialWard, 10) : null);
  const inspectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialWard) {
      const wardNum = parseInt(initialWard, 10);
      if (!isNaN(wardNum) && wardNum >= 1 && wardNum <= 55) {
        setActiveWardId(wardNum);
      }
    }
  }, [initialWard]);
  
  const handleWardClick = (id: number) => {
    setActiveWardId(id);
    if (window.innerWidth < 1024 && inspectorRef.current) {
      setTimeout(() => {
        inspectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  const [isRequesting, setIsRequesting] = useState(false);
  const [actionType, setActionType] = useState<'view' | 'download' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [viewPdfUrl, setViewPdfUrl] = useState<string | null>(null);
  const [pdfType, setPdfType] = useState<'with_photo' | 'without_photo'>('with_photo');

  const triggerSecurityCheck = (action: 'view' | 'download') => {
    setErrorMsg('');
    setIsRequesting(true);
    setActionType(action);
  };

  const handleTurnstileSuccess = async (token: string) => {
    try {
      const response = await fetch('/api/get-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ward: activeWardId, token, action: actionType, pdfType }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch PDF');
      }

      if (actionType === 'view') {
        setViewPdfUrl(data.url);
      } else {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsRequesting(false);
      setActionType(null);
    }
  };

  // Synchronous filter logic directly from static data
  const filteredWards = useMemo(() => {
    return allWardStats.filter((w) => {
      return (
        w.ward.toString().includes(searchQuery) ||
        `Ward ${w.ward}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [searchQuery]);

  const activeWard = useMemo(() => {
    if (!activeWardId) return null;
    const found = allWardStats.find((w) => w.ward === activeWardId);
    if (found) {
      return {
        ...found,
        status: STATUSES[activeWardId % STATUSES.length],
      };
    }
    return {
      ward: activeWardId,
      total: 0,
      male: 0,
      female: 0,
      other: 0,
      status: STATUSES[activeWardId % STATUSES.length],
    };
  }, [activeWardId]);

  const getCategory = (id: number) => WARD_CATEGORIES[id]?.en || "General";

  return (
    <div className="max-w-6xl mx-auto px-5 py-8 md:py-12">
      <div className="mb-8 border-b-[3px] border-double border-[#1E2A42] pb-4">
        <span className="font-courier text-[12px] font-bold tracking-[0.14em] text-[#1E2A42] bg-[#E1D7BC] border border-[#1E2A42] px-2 py-[3px] inline-block mb-3">
          {t("PDF DOWNLOADS", "पीडीएफ डाउनलोड")}
        </span>
        <h2 className="font-fraunces font-black text-3xl md:text-5xl m-0 text-[#1E2A42]">
          {t("Ward Electoral Rolls", "वार्ड मतदाता सूची")}
        </h2>
      </div>

      <p className="text-[#4A4536] font-lora mb-8 max-w-3xl">
        {t("Select a ward from the dashboard matrix below to inspect and download its electoral roll.", "निरीक्षण और इसकी मतदाता सूची डाउनलोड करने के लिए नीचे दिए गए डैशबोर्ड मैट्रिक्स से एक वार्ड का चयन करें।")}
      </p>

      {/* Main Dashboard Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Ward Matrix */}
        <div className="flex-[2]">
          <div className="bg-[#E9E1CC] border border-[#1E2A42] shadow-[5px_5px_0_rgba(30,42,66,1)] flex flex-col h-full">
            
            {/* Toolbar */}
            <div className="bg-[#1E2A42] p-3 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="font-courier font-bold text-[#E9E1CC] text-sm tracking-widest uppercase flex items-center">
                <span className="w-2 h-2 rounded-full bg-[#A2382B] mr-2 animate-pulse"></span>
                {t("Ward Matrix", "वार्ड मैट्रिक्स")}
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#E9E1CC]/50" />
                <input
                  type="text"
                  placeholder="Search Ward No..."
                  className="w-full bg-[#1E2A42] border border-[#E9E1CC]/30 py-1.5 pl-8 pr-3 text-[#E9E1CC] focus:outline-none focus:border-[#E9E1CC] transition-colors placeholder:text-[#E9E1CC]/40 text-xs font-courier"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Matrix Grid */}
            <div className="p-6">
              <div className="max-h-[350px] overflow-y-auto pr-2">
                {filteredWards.length > 0 ? (
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-8 xl:grid-cols-10 gap-2 md:gap-3">
                    {filteredWards.map((w) => (
                      <button
                        key={w.ward}
                        onClick={() => handleWardClick(w.ward)}
                        className={`
                          aspect-square flex items-center justify-center text-lg md:text-xl font-black font-fraunces border transition-all duration-200
                          ${activeWardId === w.ward 
                            ? 'bg-[#1E2A42] text-[#E9E1CC] border-[#1E2A42] shadow-inner scale-105 z-10' 
                            : 'bg-[#E1D7BC] text-[#1E2A42] border-[#1E2A42] hover:bg-[#D8CCA9] hover:translate-y-[-2px] hover:shadow-[2px_2px_0_rgba(30,42,66,1)]'
                          }
                        `}
                      >
                        {w.ward}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 font-courier text-[#A2382B] font-bold uppercase">
                    No Wards Matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Inspector Panel */}
        <div className="flex-1 lg:max-w-md" ref={inspectorRef}>
          <div className="bg-[#E9E1CC] border-[3px] border-double border-[#1E2A42] shadow-[5px_5px_0_rgba(30,42,66,1)] sticky top-24">
            <div className="bg-[#1E2A42] p-3 text-[#E9E1CC] font-courier font-bold text-sm tracking-widest uppercase flex items-center gap-2 border-b-2 border-[#E9E1CC]">
              <Info className="w-4 h-4" />
              {t("Unofficial Viewer (Balotra)", "अनौपचारिक दर्शक (बालोतरा)")}
            </div>
            
            <div className="p-6 min-h-[400px] flex flex-col">
              {activeWard ? (
                <>
                  <div className="flex justify-between items-start mb-6 pb-6 border-b border-dashed border-[#1E2A42]/30">
                    <div>
                      <h3 className="font-black font-fraunces text-4xl text-[#1E2A42] mb-1">{t("Ward", "वार्ड")} {activeWard.ward}</h3>
                      <span className="font-courier text-xs text-[#A2382B] font-bold tracking-widest uppercase border border-[#A2382B] px-2 py-0.5 inline-block bg-[#A2382B]/10">
                        {getCategory(activeWard.ward)}
                      </span>
                    </div>
                    <div className="p-3 border-[2px] border-[#1E2A42] bg-[#E1D7BC] shadow-[2px_2px_0_rgba(30,42,66,1)]">
                      <FileText className="h-8 w-8 text-[#1E2A42]" />
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-8 font-courier text-sm flex-1">
                    <div className="flex justify-between border-b border-[#E1D7BC] pb-2">
                      <span className="text-[#6B6944] font-bold uppercase tracking-widest">{t("Reg. Voters", "पंजीकृत मतदाता")}</span>
                      <span className="font-bold text-[#1E2A42] text-base">{activeWard.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#E1D7BC] pb-2">
                      <span className="text-[#6B6944] font-bold uppercase tracking-widest">{t("Status", "स्थिति")}</span>
                      <span className={`font-bold ${activeWard.status === 'VERIFIED' ? 'text-[#2F5B36]' : 'text-[#A2382B]'}`}>
                        {activeWard.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-auto">
                    <div className="flex bg-[#E1D7BC] p-1 border border-[#1E2A42] shadow-[2px_2px_0_rgba(30,42,66,1)] mb-1">
                      <button 
                        onClick={() => setPdfType('with_photo')}
                        className={`flex-1 py-2 text-xs font-courier font-bold tracking-widest uppercase transition-all ${pdfType === 'with_photo' ? 'bg-[#1E2A42] text-[#E9E1CC]' : 'text-[#1E2A42] hover:bg-[#D8CCA9]'}`}>
                        {t("With Photo", "फोटो सहित")}
                      </button>
                      <button 
                        onClick={() => setPdfType('without_photo')}
                        className={`flex-1 py-2 text-xs font-courier font-bold tracking-widest uppercase transition-all ${pdfType === 'without_photo' ? 'bg-[#1E2A42] text-[#E9E1CC]' : 'text-[#1E2A42] hover:bg-[#D8CCA9]'}`}>
                        {t("Without Photo", "बिना फोटो")}
                      </button>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => triggerSecurityCheck('view')}
                        disabled={isRequesting}
                        className="flex-1 flex items-center justify-center gap-2 h-12 bg-[#1E2A42] text-[#E9E1CC] font-courier font-bold tracking-widest text-xs sm:text-sm uppercase shadow-[3px_3px_0_rgba(30,42,66,1)] hover:bg-[#6B6944] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[2px_2px_0_rgba(30,42,66,1)] transition-all border border-[#1E2A42] disabled:opacity-50 disabled:cursor-not-allowed">
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                        {isRequesting && actionType === 'view' ? 'Verifying...' : t('View', 'देखें')}
                      </button>
                      <button 
                        onClick={() => triggerSecurityCheck('download')}
                        disabled={isRequesting}
                        className="flex-1 flex items-center justify-center gap-2 h-12 bg-[#A2382B] text-[#E9E1CC] font-courier font-bold tracking-widest text-xs sm:text-sm uppercase shadow-[3px_3px_0_rgba(30,42,66,1)] hover:bg-[#1E2A42] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[2px_2px_0_rgba(30,42,66,1)] transition-all border border-[#1E2A42] disabled:opacity-50 disabled:cursor-not-allowed">
                        <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                        {isRequesting && actionType === 'download' ? 'Verifying...' : t('Download', 'डाउनलोड')}
                      </button>
                    </div>
                    <Link
                      href={`/booth?ward=${activeWard.ward}`}
                      className="w-full flex items-center justify-center gap-2 h-12 bg-[#2F5B36] text-[#E9E1CC] font-courier font-bold tracking-widest text-xs sm:text-sm uppercase shadow-[3px_3px_0_rgba(30,42,66,1)] hover:bg-[#1E2A42] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[2px_2px_0_rgba(30,42,66,1)] transition-all border border-[#1E2A42]"
                    >
                      {t("Locate Polling Booths", "मतदान केंद्र खोजें")}
                    </Link>
                  </div>
                  
                  {errorMsg && (
                    <div className="mt-4 p-3 bg-[#A2382B]/10 border border-[#A2382B] text-[#A2382B] text-xs font-courier font-bold text-center uppercase tracking-wider">
                      {errorMsg}
                    </div>
                  )}

                  {isRequesting && (
                    <div className="hidden">
                      <Turnstile 
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
                        onSuccess={handleTurnstileSuccess}
                        options={{ action: 'submit' }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                  <div className="w-16 h-16 border-2 border-dashed border-[#1E2A42] rounded-full flex items-center justify-center mb-4">
                    <span className="font-fraunces text-2xl text-[#1E2A42]">?</span>
                  </div>
                  <p className="font-courier text-[#1E2A42] font-bold text-sm tracking-widest uppercase">
                    {t("Select a ward from the matrix", "विवरण देखने के लिए मैट्रिक्स")}<br/> {t("to view details.", "से एक वार्ड चुनें।")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* PDF View Modal */}
      {viewPdfUrl && (
        <div className="fixed inset-0 z-50 bg-[#24211A]/90 flex items-center justify-center p-4">
          <div className="bg-[#E9E1CC] border-[3px] border-[#1E2A42] w-full max-w-5xl h-[85vh] shadow-[10px_10px_0_rgba(30,42,66,1)] relative flex flex-col">
            <div className="flex items-center justify-between p-4 border-b-[3px] border-[#1E2A42] bg-[#E1D7BC]">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
                <span className="font-courier font-bold tracking-widest text-[#1E2A42] uppercase text-sm sm:text-base">
                  {t("Ward", "वार्ड")} {activeWardId} {t("Electoral Roll", "मतदाता सूची")}
                </span>
                <span className="font-courier text-[10px] sm:text-xs font-black tracking-widest text-[#A2382B] uppercase bg-[#A2382B]/10 px-2 py-1 border border-[#A2382B]">
                  Powered by RK COACHING CLASSES
                </span>
              </div>
              <button 
                onClick={() => setViewPdfUrl(null)}
                className="p-1 hover:bg-[#A2382B] hover:text-[#E9E1CC] text-[#1E2A42] transition-colors border-2 border-transparent hover:border-[#1E2A42]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 w-full bg-[#1E2A42]">
              <iframe 
                src={`${viewPdfUrl}#view=FitH`} 
                className="w-full h-full border-none" 
                title={`Ward ${activeWardId} PDF Viewer`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WardPdfsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#E9E1CC]">
        <Loader2 className="w-12 h-12 text-[#1E2A42] animate-spin" />
      </div>
    }>
      <WardPdfsContent />
    </Suspense>
  );
}
