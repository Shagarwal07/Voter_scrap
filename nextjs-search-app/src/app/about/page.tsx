"use client";

import React from "react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#E9E1CC] text-[#24211A] font-['Lora'] pt-20 md:pt-24 pb-16 px-4 sm:px-6 relative selection:bg-[#A2382B] selection:text-[#E9E1CC]">
      {/* Background texture matching the legal page */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-5 mix-blend-multiply" 
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'140\' height=\'140\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")'
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#1E2A42]/20 font-['Courier_Prime'] text-xs flex-wrap gap-4">
          <button 
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = "/";
              }
            }}
            className="font-bold text-[#1E2A42] hover:text-[#A2382B] flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-0"
          >
            ← RETURN TO SEARCH / मुख्य पृष्ठ
          </button>
          <div className="flex items-center gap-4">
            <Link 
              href="/house"
              className="text-[#1E2A42] hover:text-[#A2382B] transition-colors underline font-bold"
            >
              HOUSE &amp; GALI SEARCH
            </Link>
            <Link 
              href="/legal"
              className="text-[#A2382B] hover:text-[#1E2A42] transition-colors underline font-bold"
            >
              LEGAL NOTICES
            </Link>
          </div>
        </div>

        {/* Page Header */}
        <div className="border-b-4 border-double border-[#1E2A42] pb-6 mb-10 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-['Fraunces'] font-semibold italic text-[#1E2A42] mb-3 md:mb-4">
            About <span className="text-[#A2382B] font-normal">&amp;</span> Platform Overview
          </h1>
          <p className="font-['Courier_Prime'] text-xs md:text-sm tracking-widest uppercase text-[#6B6944]">
            Smart Voter Search Platform • Electoral Roll Explorer Balotra
          </p>
        </div>

        <div className="space-y-8 md:space-y-10">

          {/* Section 1: What It Is — Non-Commercial Civic Tool */}
          <section className="bg-[#E1D7BC] p-5 md:p-8 border border-[#1E2A42] relative shadow-[5px_5px_0_rgba(30,42,66,0.12)]">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#A2382B]" />
            <h2 className="font-['Fraunces'] text-xl md:text-2xl font-semibold mb-3 md:mb-4 text-[#1E2A42]">
              1. What This Platform Is
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-[#4A4536] mb-4">
              <strong>Smart Voter Search Platform — Electoral Roll Explorer</strong> is a <strong>completely free, non-commercial civic public service</strong> created solely for public convenience <em>(जनसुविधा)</em>. There are no fees, no subscriptions, no advertisements, and no commercial motive of any kind.
            </p>
            <p className="text-base md:text-lg leading-relaxed text-[#4A4536]">
              This platform is developed by <strong>IWS (Imposter World Services)</strong> and is <strong>fully funded and sponsored</strong> by{" "}
              <a
                href="https://rkcoachingrajasthan.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#A2382B] underline font-bold hover:text-[#1E2A42] transition-colors"
              >
                RK Coaching Classes (Balotra)
              </a>{" "}
              as a community welfare contribution — covering all infrastructure, hosting, and development costs so that citizens, booth volunteers, and election-day help desks can use it at zero cost.
            </p>
            <div className="mt-4 pt-4 border-t border-[#1E2A42]/20 font-['Courier_Prime'] text-[10px] md:text-xs text-[#1E2A42] flex flex-wrap items-center justify-between gap-2">
              <span className="text-[#6B6944]">SPONSOR · RK COACHING CLASSES, BALOTRA · NON-COMMERCIAL · FREE TO USE</span>
              <a
                href="https://rkcoachingrajasthan.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#A2382B] font-bold hover:underline"
              >
                rkcoachingrajasthan.in ↗
              </a>
            </div>
          </section>

          {/* Section 2: Why It Was Built */}
          <section>
            <h2 className="font-['Fraunces'] text-xl md:text-2xl font-semibold mb-3 md:mb-4 text-[#1E2A42]">
              2. Why It Was Built
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-[#4A4536] mb-4">
              Official electoral rolls are published as bulky, multi-hundred-page scanned PDF documents. On election day, citizens, field volunteers, and booth workers spend precious time manually paging through these dense registers to find a voter&apos;s serial number, house location, or booth assignment. Long queues form. Voters are turned away. The process is broken.
            </p>
            <p className="text-base md:text-lg leading-relaxed text-[#4A4536]">
              This platform was built with a single, clear motive: <strong>to make that process instant</strong>. By converting public gazette rolls into a fast, indexed, searchable directory available on any mobile device, a volunteer can find any voter in seconds — not minutes.
            </p>
          </section>

          {/* Section 3: What It Can Do */}
          <section>
            <h2 className="font-['Fraunces'] text-xl md:text-2xl font-semibold mb-3 md:mb-4 text-[#1E2A42]">
              3. What It Can Do
            </h2>
            <div className="space-y-3 md:space-y-4 text-sm md:text-base leading-relaxed text-[#4A4536]">
              <div className="p-4 md:p-5 bg-[#E1D7BC]/50 border border-[#1E2A42]/30">
                <strong className="text-[#1E2A42] font-['Fraunces'] block text-base md:text-lg mb-1">
                  A. Voter Name &amp; Relation Search
                </strong>
                Search by voter name, father / husband / mother name, or Voter ID (EPIC) number. Works in both Hindi (Devanagari) and English — phonetic matching tolerates spelling variations and minor OCR errors in the source rolls.
              </div>

              <div className="p-4 md:p-5 bg-[#E1D7BC]/50 border border-[#1E2A42]/30">
                <strong className="text-[#1E2A42] font-['Fraunces'] block text-base md:text-lg mb-1">
                  B. Household &amp; Gali Finder (मकान व गली खोज)
                </strong>
                Groups all voters sharing the same house number into a single household card. Volunteers can see complete family units, total member counts, and plan door-to-door campaigning street-by-street without revisiting the same household.
              </div>

              <div className="p-4 md:p-5 bg-[#E1D7BC]/50 border border-[#1E2A42]/30">
                <strong className="text-[#1E2A42] font-['Fraunces'] block text-base md:text-lg mb-1">
                  C. Voter Slips &amp; Master PDF Reports
                </strong>
                Generates print-ready voter slips for booth-day distribution and collective ward-wise master PDF reports for coordinators — usable offline at polling help desks with weak connectivity.
              </div>

              <div className="p-4 md:p-5 bg-[#E1D7BC]/50 border border-[#1E2A42]/30">
                <strong className="text-[#1E2A42] font-['Fraunces'] block text-base md:text-lg mb-1">
                  D. Dual Election Roll Support
                </strong>
                Toggle between <strong>Nagar Parishad Balotra</strong> (55 Municipal Wards — Block &amp; Gali scheme) and <strong>137-Pachpadra Vidhan Sabha</strong> (Legislative Assembly — Booth &amp; Polling Slip scheme) with a single switch.
              </div>
            </div>
          </section>

          {/* Section 4: Data Source */}
          <section>
            <h2 className="font-['Fraunces'] text-xl md:text-2xl font-semibold mb-3 md:mb-4 text-[#1E2A42]">
              4. Where the Data Comes From
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-[#4A4536] mb-4">
              All voter records displayed on this platform are sourced exclusively from <strong>publicly published gazette electoral rolls</strong> — official documents released by election authorities for public voter awareness. We do not generate, alter, or own this data.
            </p>
            <p className="text-base md:text-lg leading-relaxed text-[#4A4536]">
              This platform is a <strong>read-only search index</strong>. It does not modify any voter record, issue any official document, or connect to any government database in a write capacity.
            </p>
          </section>

          {/* Section 5: What It Is Not */}
          <section>
            <h2 className="font-['Fraunces'] text-xl md:text-2xl font-semibold mb-3 md:mb-4 text-[#1E2A42]">
              5. What It Is Not
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-[#4A4536] mb-4">
              This platform is an independent civic search utility. It is <strong>not affiliated with, authorized by, or an official representation of any government election authority</strong>. It does not issue voter cards, alter registrations, or represent the Election Commission of India (ECI) or the State Election Commission in any capacity.
            </p>
            <p className="text-base md:text-lg leading-relaxed text-[#4A4536] mb-4">
              For all official electoral matters — voter registration, corrections, or polling booth verification — refer to the official portal:
            </p>
            <p className="text-sm md:text-base font-['Courier_Prime']">
              <a
                href="https://voters.eci.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#A2382B] underline font-bold hover:text-[#1E2A42] transition-colors"
              >
                Official Election Commission Portal (voters.eci.gov.in) ↗
              </a>
            </p>
          </section>

          {/* Section 6: Privacy */}
          <section>
            <h2 className="font-['Fraunces'] text-xl md:text-2xl font-semibold mb-3 md:mb-4 text-[#1E2A42]">
              6. Privacy &amp; Data Ethics
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-[#4A4536]">
              This application does not track individual searches, collect personal user information, or sell data to any third party. It operates as a civic utility under a strict public-service mandate — entirely non-commercial, fully sponsored, and free at the point of use for every citizen of Balotra and surrounding areas.
            </p>
          </section>

        </div>

        {/* Bottom Attribution Bar */}
        <div className="mt-12 md:mt-16 pt-6 md:pt-8 border-t-[3px] border-double border-[#1E2A42] text-center font-['Courier_Prime']">
          <div className="text-xs text-[#6B6944]">
            SPONSORED BY{" "}
            <a
              href="https://rkcoachingrajasthan.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#1E2A42] hover:text-[#A2382B] underline"
            >
              RK COACHING CLASSES (BALOTRA)
            </a>
            {" "}• DEVELOPED BY IWS
          </div>
        </div>
      </div>
    </div>
  );
}
