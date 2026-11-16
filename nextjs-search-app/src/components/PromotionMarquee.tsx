'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function PromotionMarquee() {
  const pathname = usePathname();

  // Exclude only on /admin routes
  if (
    pathname === '/admin' ||
    pathname?.startsWith('/admin/')
  ) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-[#1E2A42] border-b-2 border-double border-[#6B6944] py-1.5 md:py-2.5 overflow-hidden pointer-events-none shadow-[0_4px_10px_rgba(30,42,66,0.2)] print:hidden">
      <div className="animate-marquee inline-block text-[#E9E1CC] font-['Courier_Prime'] font-bold text-[11px] md:text-sm tracking-[0.18em] uppercase whitespace-nowrap">
        <span className="mx-4 md:mx-6 text-[#A2382B]">✦</span>
        RK COACHING CLASSES (BALOTRA)
        <span className="mx-4 md:mx-6 text-[#A2382B]">✦</span>
        A DECADE OF EMPIRICAL EXCELLENCE
        <span className="mx-4 md:mx-6 text-[#A2382B]">✦</span>
        FREE CIVIC PLATFORM — FULLY SPONSORED FOR PUBLIC CONVENIENCE
        <span className="mx-4 md:mx-6 text-[#A2382B]">✦</span>
        RK COACHING CLASSES (BALOTRA)
        <span className="mx-4 md:mx-6 text-[#A2382B]">✦</span>
        A DECADE OF EMPIRICAL EXCELLENCE
        <span className="mx-4 md:mx-6 text-[#A2382B]">✦</span>
        FREE CIVIC PLATFORM — FULLY SPONSORED FOR PUBLIC CONVENIENCE
      </div>
    </div>
  );
}

