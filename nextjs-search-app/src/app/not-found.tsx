import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#E9E1CC] text-[#1E2A42] font-['Lora'] flex flex-col justify-between p-6 sm:p-10 md:p-16 relative overflow-hidden select-none">
      
      {/* Editorial Noise & Film Grain Overlay */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;0,9..144,900;1,9..144,400&family=Lora:ital,wght@0,400;0,600;1,400&family=Courier+Prime:wght@400;700&display=swap');
            .iws-grain::before {
              content: "";
              position: absolute;
              inset: 0;
              pointer-events: none;
              opacity: 0.04;
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
              mix-blend-mode: multiply;
            }
          `,
        }}
      />
      <div className="iws-grain fixed inset-0 pointer-events-none z-0"></div>

      {/* Top Editorial Archival Bar */}
      <header className="relative z-10 w-full flex items-center justify-between border-b-2 border-[#1E2A42] pb-4 font-['Courier_Prime'] text-xs uppercase tracking-widest text-[#4A4536]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#A2382B] inline-block animate-ping"></span>
          <span>ELECTORAL ARCHIVE DISPATCH</span>
        </div>
        <span className="hidden sm:inline">REF: REGISTRY_NULL_PTR</span>
      </header>

      {/* Central Hero Block */}
      <main className="relative z-10 max-w-xl mx-auto my-auto w-full py-12 text-center">
        {/* Giant Number + Angled Archival Red Stamp */}
        <div className="relative inline-block mb-6">
          <span className="font-['Fraunces'] font-black text-8xl sm:text-9xl md:text-[11rem] leading-none tracking-tight text-[#1E2A42] block">
            404
          </span>
          
          {/* Angled Vintage Red Stamp */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] bg-[#E9E1CC]/90 border-[3px] border-dashed border-[#A2382B] px-4 py-1.5 shadow-[2px_2px_0_rgba(162,56,43,0.3)] pointer-events-none whitespace-nowrap">
            <span className="font-['Courier_Prime'] font-bold text-xs sm:text-sm text-[#A2382B] tracking-[0.25em] uppercase">
              NOT ON ELECTORAL ROLL
            </span>
          </div>
        </div>

        {/* Minimal Editorial Message */}
        <h1 className="font-['Fraunces'] font-bold text-2xl sm:text-3xl text-[#1E2A42] mb-3">
          Unfiled or Redacted Registry
        </h1>
        <p className="font-['Lora'] text-sm sm:text-base text-[#4A4536] max-w-md mx-auto mb-8 leading-relaxed">
          The requested URL does not match any registered ballot unit, ward ledger, or indexed roll file in Balotra.
        </p>

        {/* Action Control: Single Clean Link to Main Portal */}
        <div className="flex justify-center font-['Courier_Prime'] text-xs sm:text-sm">
          <Link
            href="/"
            className="px-8 py-3.5 bg-[#1E2A42] text-[#E9E1CC] font-bold tracking-widest uppercase hover:bg-[#A2382B] transition-all border-2 border-[#1E2A42] shadow-[3px_3px_0_rgba(107,105,68,1)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_rgba(107,105,68,1)] flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to Main Portal
          </Link>
        </div>
      </main>

      {/* Bottom Editorial Telemetry */}
      <footer className="relative z-10 w-full flex flex-col sm:flex-row items-center justify-between border-t-2 border-[#1E2A42] pt-4 font-['Courier_Prime'] text-[10px] uppercase tracking-widest text-[#4A4536]/80 gap-2">
        <div>STATUS: HTTP_404_PAGE_NOT_FOUND</div>
        <div>IWS DIGITAL CITIZEN SOLUTIONS · BALOTRA</div>
      </footer>

    </div>
  );
}
