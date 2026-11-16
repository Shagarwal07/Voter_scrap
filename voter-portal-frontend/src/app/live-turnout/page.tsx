"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, ArrowLeft, Users, Clock, MapPin, FileText } from "lucide-react";
import ward5Stats from "@/data/nagar_parishad/turnout/ward5_stats.json";
import { useLanguage } from "@/context/LanguageContext";

export default function LiveTurnoutPage() {
  const { t } = useLanguage();
  const stats = ward5Stats;

  return (
    <div className="min-h-screen bg-[#E9E1CC] font-courier py-8 px-4 md:px-8 text-[#1E2A42]">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-[3px] border-[#1E2A42] pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1E2A42] hover:text-[#A2382B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {t("Back to Portal", "पोर्टल पर वापस जाएं")}
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold bg-[#2F5B36] text-[#E9E1CC] px-3 py-1 border border-[#1E2A42] shadow-[2px_2px_0_rgba(30,42,66,1)]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t("ELECTION COMPLETED", "मतदान संपन्न")}</span>
          </div>
        </div>

        {/* Title Section */}
        <div className="space-y-2">
          <span className="text-xs font-bold tracking-widest text-[#A2382B] uppercase">
            {t("CIVIC ARCHIVE REPORT", "नागरिक पुरालेख रिपोर्ट")}
          </span>
          <h1 className="font-fraunces text-4xl sm:text-5xl font-black text-[#1E2A42]">
            {t("Ward 5 Final Polling Turnout", "वार्ड 5 अंतिम मतदान रुझान")}
          </h1>
          <p className="font-lora text-[#4A4536] text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#6B6944]" />
            {t("Final Certified Count:", "अंतिम प्रमाणित गणना:")} {stats.updatedAt}
          </p>
        </div>

        {/* Top 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#1E2A42] text-[#E9E1CC] p-6 border-[3px] border-[#1E2A42] shadow-[5px_5px_0_rgba(30,42,66,0.3)] space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#E9E1CC]/70">{t("Overall Turnout", "कुल मतदान")}</span>
            <div className="text-4xl font-black font-fraunces text-[#E9E1CC]">{stats.percentage}%</div>
            <p className="text-xs text-[#E9E1CC]/60">{stats.castTotal} / {stats.totalVoters} {t("voters cast", "मतदाताओं ने वोट डाला")}</p>
          </div>

          <div className="bg-[#E1D7BC] p-6 border-[3px] border-[#1E2A42] shadow-[5px_5px_0_rgba(30,42,66,1)] space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#6B6944]">{t("Male Turnout", "पुरुष मतदान")}</span>
            <div className="text-4xl font-black font-fraunces text-[#1E2A42]">{stats.malePercentage}%</div>
            <p className="text-xs text-[#4A4536]">{stats.castMale} / {stats.maleTotal} {t("male voters", "पुरुष मतदाता")}</p>
          </div>

          <div className="bg-[#E1D7BC] p-6 border-[3px] border-[#1E2A42] shadow-[5px_5px_0_rgba(30,42,66,1)] space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#6B6944]">{t("Female Turnout", "महिला मतदान")}</span>
            <div className="text-4xl font-black font-fraunces text-[#1E2A42]">{stats.femalePercentage}%</div>
            <p className="text-xs text-[#4A4536]">{stats.castFemale} / {stats.femaleTotal} {t("female voters", "महिला मतदाता")}</p>
          </div>
        </div>

        {/* Certified Audit Ledger Table */}
        <div className="bg-[#E1D7BC] border-[3px] border-[#1E2A42] shadow-[6px_6px_0_rgba(30,42,66,1)] p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b-2 border-[#1E2A42] pb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#A2382B]" /> {t("Official Voter Audit Breakdown", "आधिकारिक मतदाता लेखा परीक्षा विवरण")}
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-[#1E2A42]/15 pb-2">
              <span className="text-[#4A4536]">{t("Total Registered Voters", "कुल पंजीकृत मतदाता")}</span>
              <span className="font-bold">{stats.totalVoters.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-[#1E2A42]/15 pb-2">
              <span className="text-[#2F5B36] font-bold">{t("Ballots Successfully Cast", "सफलतापूर्वक मतदान")}</span>
              <span className="font-bold text-[#2F5B36]">{stats.castTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-[#1E2A42]/15 pb-2">
              <span className="text-[#6B6944]">{t("Default / Out of Station / Shifted", "डिफ़ॉल्ट / स्थानांतरित")}</span>
              <span className="font-bold">{stats.defaultTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-[#1E2A42]/15 pb-2">
              <span className="text-[#A2382B]">{t("Deceased Prior to Poll", "मतदान से पूर्व मृत")}</span>
              <span className="font-bold text-[#A2382B]">{stats.deadTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-[#4A4536]">{t("Remaining Uncast Ballots", "शेष मत")}</span>
              <span className="font-bold">{stats.remaining.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Action Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Link
            href="/map"
            className="flex-1 bg-[#1E2A42] text-[#E9E1CC] font-bold py-3.5 px-6 hover:bg-[#A2382B] transition-colors uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-[3px_3px_0_rgba(30,42,66,1)]"
          >
            <MapPin className="w-4 h-4" /> {t("Explore Ward Map", "वार्ड नक्शा देखें")}
          </Link>
          <Link
            href="/ward-pdfs?ward=5"
            className="flex-1 bg-[#2F5B36] text-[#E9E1CC] font-bold py-3.5 px-6 hover:bg-[#1E2A42] transition-colors uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-[3px_3px_0_rgba(30,42,66,1)]"
          >
            <FileText className="w-4 h-4" /> {t("Download Ward 5 PDF", "वार्ड 5 पीडीएफ डाउनलोड करें")}
          </Link>
        </div>

      </div>
    </div>
  );
}
