import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#E9E1CC] flex flex-col items-center justify-center p-6 select-none">
      <div className="flex flex-col items-center gap-3">
        <svg
          className="animate-spin h-9 w-9 text-[#A2382B]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-20"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3.5"
          ></circle>
          <path
            className="opacity-95"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span className="font-['Courier_Prime'] font-bold text-xs uppercase tracking-widest text-[#A2382B]">
          Loading...
        </span>
      </div>
    </div>
  );
}
