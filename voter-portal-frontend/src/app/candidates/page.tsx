"use client";

import { useState, useMemo } from "react";
import { Users, Search, ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ReactTransliterate } from "react-transliterate";
import "react-transliterate/dist/index.css";
import { CandidateCard, Candidate } from "@/components/CandidateCard";
import candidatesData from "@/data/nagar_parishad/candidates.json";

type JsonCandidate = {
  ward_number: number;
  candidate_name: string;
  party_name: string;
  symbol_name: string;
  gender?: string;
};

const KNOWN_SYMBOLS: Record<string, string> = {
  "भारतीय जनता पार्टी": "/symbols/bjp.png",
  "इंडियन नेशनल कांग्रेस": "/symbols/congress.png",
  "कमल": "/symbols/bjp.png",
  "हाथ": "/symbols/congress.png",
  "झाडू": "/symbols/broom.jpg",
  "अलमारी": "/symbols/almirah.jpg",
  "बाल्टी": "/symbols/bucket.jpg",
  "सेब": "/symbols/apple.jpg",
  "टेलीफोन": "/symbols/telephone.jpg",
  "गैस का चूल्हा": "/symbols/gas_stove.jpg",
  "हारमोनियम": "/symbols/harmonium.jpg",
  "बाँसुरी": "/symbols/flute.jpg",
  "बोतल": "/symbols/bottle.jpg",
  "सिलाई की मशीन": "/symbols/sewing_machine.jpg",
};

const NORMALIZED_SYMBOLS: Record<string, string> = {};
Object.entries(KNOWN_SYMBOLS).forEach(([k, v]) => {
  NORMALIZED_SYMBOLS[k.normalize("NFC").trim()] = v;
});

export default function CandidatesPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWard, setSelectedWard] = useState<number | "ALL">("ALL");
  const [selectedParty, setSelectedParty] = useState<string>("ALL");

  const initialCandidates = candidatesData as JsonCandidate[];

  const ALL_PARTIES = useMemo(() => {
    const parties = new Set(initialCandidates.map((c) => c.party_name));
    return Array.from(parties).sort();
  }, [initialCandidates]);

  const mappedCandidates: Candidate[] = useMemo(() => {
    return initialCandidates.map((c, index) => {
      const sym = (c.symbol_name || "").normalize("NFC").trim();
      const party = (c.party_name || "").normalize("NFC").trim();
      const symbolToUse = NORMALIZED_SYMBOLS[sym] || NORMALIZED_SYMBOLS[party] || sym || "🌟";
      const avatarToUse = c.gender === "F" ? "/avatars/female.png" : "/avatars/male.jpg";
      const taglineToUse = c.gender === "F"
        ? `वार्ड ${c.ward_number} से आपकी प्रत्याशी`
        : `वार्ड ${c.ward_number} से आपके प्रत्याशी`;

      return {
        id: `ID NO. ${index + 1000}`,
        name: c.candidate_name,
        ward: c.ward_number,
        party: c.party_name,
        partySymbol: symbolToUse,
        tagline: taglineToUse,
        avatarUrl: avatarToUse,
        status: "ACTIVE",
      };
    });
  }, [initialCandidates]);

  const filteredCandidates = useMemo(() => {
    const cleanSearch = searchTerm.trim().replace(/\s+/g, " ").toLowerCase();

    return mappedCandidates.filter((c) => {
      const cleanName = c.name.trim().replace(/\s+/g, " ").toLowerCase();
      const matchesSearch = cleanSearch === "" || cleanName.includes(cleanSearch);
      const matchesWard = selectedWard === "ALL" || c.ward === selectedWard;
      const matchesParty = selectedParty === "ALL" || c.party === selectedParty;
      return matchesSearch && matchesWard && matchesParty;
    });
  }, [searchTerm, selectedWard, selectedParty, mappedCandidates]);

  return (
    <div className="max-w-6xl mx-auto px-5 py-8 md:py-12">
      <div className="mb-8 border-b-[3px] border-double border-[#1E2A42] pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="font-courier text-[12px] font-bold tracking-[0.14em] text-[#E9E1CC] bg-[#A2382B] px-2 py-[3px] inline-block mb-3">
            {t("CANDIDATE LIST", "प्रत्याशी सूची")}
          </span>
          <h2 className="font-fraunces font-black text-3xl md:text-5xl m-0 text-[#1E2A42]">
            {t("Representative Directory", "प्रतिनिधि निर्देशिका")}
          </h2>
        </div>
        <div className="font-courier text-[#1E2A42] font-bold border-2 border-[#1E2A42] px-3 py-1 flex items-center">
          <Users className="w-4 h-4 mr-2" /> {filteredCandidates.length} {t("CANDIDATES", "प्रत्याशी")}
        </div>
      </div>

      <p className="text-[#4A4536] font-lora mb-10 max-w-3xl text-lg">
        {t(
          "Review the profiles of all candidates registered for the upcoming election. Use the filters below to find representatives running in your specific ward.",
          "आगामी चुनाव के लिए पंजीकृत सभी प्रत्याशियों के प्रोफाइल की समीक्षा करें। अपने विशिष्ट वार्ड में चुनाव लड़ रहे प्रतिनिधियों को खोजने के लिए नीचे दिए गए फ़िल्टर का उपयोग करें।"
        )}
      </p>

      {/* FILTER SECTION */}
      <div className="bg-[#1E2A42] p-4 md:p-6 mb-10 shadow-[6px_6px_0_rgba(162,56,43,1)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search with Transliteration */}
          <div className="relative">
            <label className="block font-courier text-[#E9E1CC] text-xs font-bold tracking-widest mb-2">
              SEARCH NAME
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1E2A42]/50 z-10 pointer-events-none" />
              <ReactTransliterate
                value={searchTerm}
                onChangeText={(text) => setSearchTerm(text)}
                lang="hi"
                placeholder="e.g. Candidate / प्रत्याशी"
                containerClassName="w-full relative"
                className="w-full pl-10 pr-4 py-3 bg-[#E9E1CC] border-2 border-transparent focus:border-[#A2382B] outline-none font-lora text-[#1E2A42] placeholder-[#1E2A42]/40"
              />
            </div>
          </div>

          {/* Ward Filter */}
          <div className="relative">
            <label className="block font-courier text-[#E9E1CC] text-xs font-bold tracking-widest mb-2">
              FILTER BY WARD
            </label>
            <div className="relative">
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                className="w-full appearance-none px-4 py-3 bg-[#E9E1CC] border-2 border-transparent focus:border-[#A2382B] outline-none font-lora text-[#1E2A42]"
              >
                <option value="ALL">All Wards (1-55)</option>
                {Array.from({ length: 55 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Ward {i + 1}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1E2A42]" pointerEvents="none" />
            </div>
          </div>

          {/* Party Filter */}
          <div className="relative">
            <label className="block font-courier text-[#E9E1CC] text-xs font-bold tracking-widest mb-2">
              FILTER BY PARTY
            </label>
            <div className="relative">
              <select
                value={selectedParty}
                onChange={(e) => setSelectedParty(e.target.value)}
                className="w-full appearance-none px-4 py-3 bg-[#E9E1CC] border-2 border-transparent focus:border-[#A2382B] outline-none font-lora text-[#1E2A42]"
              >
                <option value="ALL">All Parties</option>
                {ALL_PARTIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1E2A42]" pointerEvents="none" />
            </div>
          </div>
        </div>
      </div>

      {/* CANDIDATES GRID */}
      {filteredCandidates.length === 0 ? (
        <div className="py-20 text-center border-4 border-dashed border-[#1E2A42]/20">
          <Users className="w-16 h-16 text-[#1E2A42]/20 mx-auto mb-4" />
          <h3 className="font-fraunces text-2xl text-[#1E2A42]/50 font-bold">No candidates found</h3>
          <p className="font-lora text-[#4A4536]">Try adjusting your filters to see more results.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCandidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      )}
    </div>
  );
}
