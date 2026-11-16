import Link from "next/link";
import { AlertCircle, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-12 md:py-24 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="bg-[#E9E1CC] border-[4px] border-double border-[#1E2A42] p-8 md:p-16 shadow-[8px_8px_0_rgba(30,42,66,1)] relative w-full text-center overflow-hidden">
        
        {/* Background decorative text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#1E2A42] opacity-5 font-black text-[200px] md:text-[300px] pointer-events-none select-none font-fraunces leading-none">
          404
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center p-4 bg-[#A2382B] rounded-full mb-6 shadow-[4px_4px_0_rgba(30,42,66,1)] border-2 border-[#1E2A42]">
            <AlertCircle className="w-12 h-12 text-[#E9E1CC]" />
          </div>
          
          <span className="block font-courier text-[#A2382B] font-bold tracking-[0.2em] uppercase text-sm mb-2">
            Error Code: 404
          </span>
          
          <h1 className="text-4xl md:text-6xl font-black text-[#1E2A42] font-fraunces mb-6">
            Record Not Found
          </h1>
          
          <p className="text-[#4A4536] font-lora text-lg md:text-xl max-w-lg mx-auto mb-10 border-y-2 border-dashed border-[#1E2A42]/30 py-6">
            The document, page, or directory you are attempting to access does not exist in the master archive. It may have been moved or redacted.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center font-courier">
            <Link
              href="/"
              className="bg-[#1E2A42] text-[#E9E1CC] font-bold py-3.5 px-8 shadow-[4px_4px_0_rgba(107,105,68,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_rgba(107,105,68,1)] transition-all uppercase tracking-widest text-sm border-2 border-[#1E2A42] inline-flex items-center justify-center group"
            >
              <Home className="mr-3 h-4 w-4 group-hover:-translate-y-1 transition-transform" />
              Return to Index
            </Link>
            
            <a
              href={process.env.NEXT_PUBLIC_SEARCH_APP_URL || "http://localhost:3001"}
              className="bg-[#E9E1CC] text-[#1E2A42] font-bold py-3.5 px-8 shadow-[4px_4px_0_rgba(30,42,66,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_rgba(30,42,66,1)] transition-all uppercase tracking-widest text-sm border-2 border-[#1E2A42] inline-flex items-center justify-center group"
            >
              <Search className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform" />
              Search Database
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
