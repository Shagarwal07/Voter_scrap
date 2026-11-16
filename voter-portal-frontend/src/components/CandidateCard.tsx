"use client";

import Image from "next/image";
import { Award } from "lucide-react";

export interface Candidate {
  id: string;
  name: string;
  ward: number;
  party: string;
  partySymbol: string;
  tagline: string;
  avatarUrl: string;
  status: "ACTIVE" | "WITHDRAWN";
}

export function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <div
      className={`
        bg-[#E9E1CC] border-4 border-[#1E2A42] flex flex-col
        shadow-[8px_8px_0_rgba(30,42,66,1)] transition-transform hover:-translate-y-1 hover:shadow-[10px_10px_0_rgba(162,56,43,1)]
        ${candidate.status === 'WITHDRAWN' ? 'opacity-60 grayscale' : ''}
      `}
    >
      {/* Card Header */}
      <div className="bg-[#1E2A42] text-[#E9E1CC] p-3 flex justify-between items-center">
        <span className="font-courier text-xs font-bold tracking-widest">{candidate.id}</span>
        {candidate.status === 'WITHDRAWN' ? (
          <span className="bg-[#A2382B] text-white px-2 py-0.5 text-[10px] font-bold font-courier tracking-widest">
            WITHDRAWN
          </span>
        ) : (
          <span className="bg-[#2F5B36] text-white px-2 py-0.5 text-[10px] font-bold font-courier tracking-widest flex items-center">
            <Award className="w-3 h-3 mr-1" /> ACTIVE
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex gap-5 mb-5">
          {/* Portrait */}
          <div className="w-24 h-28 border-[3px] border-[#1E2A42] bg-[#D8CCA9] flex-shrink-0 relative overflow-hidden shadow-[3px_3px_0_rgba(30,42,66,1)]">
            <Image
              src={candidate.avatarUrl}
              alt={candidate.name}
              fill
              className="object-cover object-top grayscale hover:grayscale-0 transition-all duration-300"
              sizes="96px"
            />
          </div>

          {/* Main Info */}
          <div className="flex-1">
            <div className="font-courier text-xs font-bold text-[#A2382B] tracking-widest uppercase mb-1">
              Ward {candidate.ward}
            </div>
            <h3 className="font-fraunces font-black text-2xl text-[#1E2A42] leading-tight mb-2">
              {candidate.name}
            </h3>
            <div className="inline-flex items-center px-2 py-1.5 bg-white border border-[#1E2A42] shadow-[2px_2px_0_rgba(30,42,66,1)]">
              <div className="mr-2 w-6 h-6 flex items-center justify-center relative">
                {candidate.partySymbol.startsWith('/') ? (
                  <Image
                    src={candidate.partySymbol}
                    alt={`${candidate.party} symbol`}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <span className="text-lg leading-none">{candidate.partySymbol}</span>
                )}
              </div>
              <span className="font-courier font-bold text-xs text-[#1E2A42] uppercase">{candidate.party}</span>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="mb-2 flex-1">
          <div className="border-l-4 border-[#A2382B] pl-3 py-1">
            <p className="font-lora italic text-[#4A4536] text-sm">
              "{candidate.tagline}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

