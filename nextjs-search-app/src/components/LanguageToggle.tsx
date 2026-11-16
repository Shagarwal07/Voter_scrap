'use client';
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface LanguageToggleProps {
  className?: string;
}

export default function LanguageToggle({ className = '' }: LanguageToggleProps) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <div
      onClick={toggleLanguage}
      className={`flex items-center cursor-pointer border-[2px] border-[#1E2A42] bg-white shadow-[2px_2px_0_rgba(30,42,66,1)] rounded-full p-0.5 sm:p-1 w-[64px] sm:w-[72px] h-8 sm:h-9 relative transition-all hover:-translate-y-[1px] hover:shadow-[3px_3px_0_rgba(30,42,66,1)] active:translate-y-0 active:shadow-none shrink-0 select-none ${className}`}
      title={language === 'en' ? 'हिन्दी में बदलें (Switch to Hindi)' : 'Switch to English (अंग्रेजी में बदलें)'}
    >
      <div
        className={`absolute top-0.5 bottom-0.5 w-6 sm:w-7 bg-[#A2382B] rounded-full transition-all duration-300 shadow-inner ${language === 'en' ? 'left-0.5' : 'left-[30px] sm:left-[34px]'
          }`}
      />
      <span className={`w-1/2 text-center text-[10px] sm:text-xs font-black z-10 transition-colors duration-200 ${language === 'en' ? 'text-white' : 'text-[#1E2A42]'
        }`}>
        EN
      </span>
      <span className={`w-1/2 text-center text-[10px] sm:text-xs font-black z-10 transition-colors duration-200 ${language === 'hi' ? 'text-white' : 'text-[#1E2A42]'
        }`}>
        हि
      </span>
    </div>
  );
}
