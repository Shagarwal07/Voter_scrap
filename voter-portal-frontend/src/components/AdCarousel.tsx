"use client";

import { useState, useEffect } from "react";
import { Megaphone, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

const ads = [
  {
    id: 1,
    title: "LearnStudio 2.0",
    text: "Production Learning Platform",
    bg: "bg-[#1E2A42]",
    textCol: "text-[#E9E1CC]",
    link: "https://learn-studio-2-0.vercel.app/",
    recommended: true,
  },
  {
    id: 2,
    title: "Advertise Here",
    text: "Reach thousands of local voters daily.",
    bg: "bg-[#A2382B]",
    textCol: "text-[#E9E1CC]",
  },
  {
    id: 3,
    title: "RK Coaching Classes",
    text: "Enroll now for upcoming exams. A decade of excellence.",
    bg: "bg-[#2F5B36]",
    textCol: "text-[#E9E1CC]",
    link: "https://www.google.com/search?kgmid=/g/11sw3lygl4&hl=en-IN&q=R.K+Coaching+Classes&shem=epsd1,ltae&shndl=30&source=sh/x/loc/osrp/m1/4&kgs=b766ce970394304d&utm_source=epsd1,ltae,sh/x/loc/osrp/m1/4",
  }
];

export default function AdCarousel() {
  const [current, setCurrent] = useState(0);
  
  // Touch swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setCurrent((prev) => (prev + 1) % ads.length);
    }
    if (isRightSwipe) {
      setCurrent((prev) => (prev - 1 + ads.length) % ads.length);
    }
  };

  useEffect(() => {
    // If it's the LearnStudio slide (index 0), keep it visible for 15 seconds. Otherwise 4 seconds.
    const delay = current === 0 ? 15000 : 4000;
    
    const timer = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % ads.length);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [current]);

  return (
    <div className="w-full min-h-[180px] md:min-h-[240px] mb-12 border-[3px] border-[#1E2A42] bg-[#E1D7BC] relative overflow-hidden shadow-[8px_8px_0_rgba(30,42,66,1)] group">
      
      {/* "ADVERTISEMENT" label */}
      <div className="absolute top-0 left-0 bg-[#E1D7BC] border-b-[2px] border-r-[2px] border-[#1E2A42] px-2 py-0.5 z-20">
        <span className="font-courier text-[10px] font-bold tracking-widest text-[#1E2A42] uppercase flex items-center gap-1">
          <Megaphone className="w-3 h-3" /> SPONSORED
        </span>
      </div>

      <div 
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {ads.map((ad) => (
          <div key={ad.id} className={`w-full h-full min-h-[180px] md:min-h-[240px] flex-shrink-0 flex flex-col md:flex-row items-center justify-between p-6 md:p-8 md:px-12 ${ad.bg}`}>
            
            {/* Ad Content */}
            <div className={`flex-1 relative z-10 w-full ${ad.id === 1 ? 'md:pr-8' : ''}`}>
              {ad.recommended && (
                <span className="inline-block bg-[#E9E1CC] text-[#1E2A42] font-courier font-bold text-[10px] tracking-widest uppercase px-2 py-1 mb-3 shadow-[2px_2px_0_rgba(30,42,66,1)]">
                  ★ RECOMMENDED PLATFORM
                </span>
              )}
              <h3 className={`font-fraunces font-black text-3xl md:text-5xl lg:text-5xl mb-2 leading-tight ${ad.textCol}`}>{ad.title}</h3>
              <p className={`font-lora text-base md:text-lg opacity-90 mb-6 ${ad.textCol}`}>{ad.text}</p>
              
              {ad.link ? (
                <a href={ad.link} target="_blank" rel="noopener noreferrer" className={`inline-flex px-6 py-3 border-[2px] border-current text-sm md:text-base font-courier font-bold items-center hover:bg-black/10 transition-colors ${ad.textCol}`}>
                  VISIT SITE <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              ) : (
                <button className={`inline-flex px-6 py-3 border-[2px] border-current text-sm md:text-base font-courier font-bold items-center hover:bg-black/10 transition-colors ${ad.textCol}`}>
                  LEARN MORE <ExternalLink className="w-4 h-4 ml-2" />
                </button>
              )}
            </div>

            {/* Live Iframe Preview for LearnStudio */}
            {ad.id === 1 && ad.link && (
              <a href={ad.link} target="_blank" rel="noopener noreferrer" className="hidden md:block w-[400px] h-[220px] shrink-0 relative group cursor-pointer perspective-1000">
                <div className="absolute inset-0 bg-[#A2382B] translate-x-2 translate-y-2 border-2 border-[#1E2A42]"></div>
                <div className="absolute inset-0 bg-[#E9E1CC] border-2 border-[#1E2A42] flex flex-col transition-transform group-hover:-translate-y-1 group-hover:-translate-x-1 duration-300">
                  {/* Browser Bar */}
                  <div className="h-6 border-b-2 border-[#1E2A42] bg-[#1E2A42] flex items-center px-2 gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#A2382B]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#E1D7BC]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#2F5B36]"></div>
                  </div>
                  {/* Iframe Container */}
                  <div className="flex-1 relative overflow-hidden bg-white">
                    {/* The iframe scale trick to make it look like a zoomed-out browser */}
                    <div className="absolute top-0 left-0 w-[1200px] h-[700px] origin-top-left scale-[0.33]">
                      <iframe 
                        src={ad.link} 
                        className="w-full h-full border-none pointer-events-none"
                        tabIndex={-1}
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  </div>
                </div>
              </a>
            )}

          </div>
        ))}
      </div>

      {/* Manual Navigation Arrows (Desktop Only) */}
      <button 
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent((prev) => (prev - 1 + ads.length) % ads.length); }}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-[#E9E1CC] border-2 border-[#1E2A42] p-2 opacity-70 hover:opacity-100 transition-opacity hover:bg-white shadow-[3px_3px_0_rgba(30,42,66,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_rgba(30,42,66,1)] items-center justify-center"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-[#1E2A42]" />
      </button>

      <button 
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent((prev) => (prev + 1) % ads.length); }}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-[#E9E1CC] border-2 border-[#1E2A42] p-2 opacity-70 hover:opacity-100 transition-opacity hover:bg-white shadow-[3px_3px_0_rgba(30,42,66,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_rgba(30,42,66,1)] items-center justify-center"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-[#1E2A42]" />
      </button>
      
      {/* Indicators */}
      <div className="absolute bottom-4 right-4 flex gap-3 z-20">
        {ads.map((_, idx) => (
          <button 
            key={idx} 
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent(idx); }}
            className={`w-2.5 h-2.5 rounded-full border-2 border-[#E9E1CC] transition-all hover:scale-125 cursor-pointer ${idx === current ? 'bg-[#E9E1CC]' : 'bg-transparent'}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
