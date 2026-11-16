'use client';
import React from 'react';
import { useElection } from '@/context/ElectionContext';
import { useLanguage } from '@/context/LanguageContext';

interface ElectionToggleProps {
  className?: string;
  compact?: boolean;
  activeWard?: string;
}

export default function ElectionToggle({ className = '', compact = false, activeWard }: ElectionToggleProps) {
  const { election, setElection, isVidhanSabha, selectedWard, availableWards, npWards, vsWards } = useElection();
  const { language, t } = useLanguage();

  const currentWard = activeWard !== undefined ? activeWard : selectedWard;

  // Dynamic Badge for Nagar Parishad (uses isolated npWards to prevent cross-election race conditions)
  const npBadge = currentWard && !isVidhanSabha && currentWard !== 'all'
    ? (language === 'hi' ? `वार्ड ${currentWard}` : `Ward ${currentWard}`)
    : (language === 'hi' ? 'सभी' : 'ALL');

  // Dynamic Badge for Vidhan Sabha (uses isolated vsWards to prevent cross-election race conditions)
  const vsBadge = currentWard && isVidhanSabha && currentWard !== 'all'
    ? (language === 'hi' ? `भाग ${currentWard}` : `Part ${currentWard}`)
    : vsWards.length > 0 && vsWards.length <= 2
    ? (language === 'hi' ? `भाग ${vsWards.join(', ')}` : `Parts ${vsWards.join(', ')}`)
    : (language === 'hi' ? 'सभी' : 'ALL');

  return (
    <div className={`flex flex-col items-start w-full sm:w-auto max-w-full ${className}`}>
      {!compact && (
        <span className="text-xs sm:text-sm font-bold text-[#6B6944] uppercase tracking-widest font-['Courier_Prime'] mb-1.5">
          {t('election_mode')}
        </span>
      )}

      <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start p-1 sm:p-1.5 bg-[#D8CCA9] border-2 border-[#1E2A42] shadow-[2px_2px_0_rgba(30,42,66,1)] sm:shadow-[3px_3px_0_rgba(30,42,66,1)] select-none box-border">
        {/* Nagar Parishad (Municipal Council) Button */}
        <button
          type="button"
          onClick={() => {
            if (election !== 'nagar_parishad') setElection('nagar_parishad');
          }}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-sm md:text-base font-bold font-['Courier_Prime'] transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px] whitespace-nowrap ${
            !isVidhanSabha
              ? 'bg-[#1E2A42] text-[#E9E1CC] shadow-[2px_2px_0_rgba(162,56,43,1)]'
              : 'text-[#1E2A42] hover:bg-[#E9E1CC]/60'
          }`}
          title={t('title_np')}
        >
          <span className="hidden sm:inline">{t('nagar_parishad')}</span>
          <span className="sm:hidden">{language === 'hi' ? 'नगर परिषद' : 'Council'}</span>
          <span
            className={`text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-mono border transition-all shrink-0 max-w-[130px] sm:max-w-none truncate ${
              !isVidhanSabha
                ? 'bg-[#A2382B] text-white border-white/20'
                : 'bg-[#C8BE9E] text-[#1E2A42] border-[#1E2A42]/30'
            }`}
          >
            {npBadge}
          </span>
        </button>

        <div className="w-[1.5px] h-5 sm:h-6 bg-[#1E2A42]/30 mx-0.5 sm:mx-1.5 shrink-0"></div>

        {/* Vidhan Sabha (Legislative Assembly) Button */}
        <button
          type="button"
          onClick={() => {
            if (election !== 'vidhan_sabha') setElection('vidhan_sabha');
          }}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-sm md:text-base font-bold font-['Courier_Prime'] transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px] whitespace-nowrap ${
            isVidhanSabha
              ? 'bg-[#A2382B] text-white shadow-[2px_2px_0_rgba(30,42,66,1)]'
              : 'text-[#1E2A42] hover:bg-[#E9E1CC]/60'
          }`}
          title={t('title_vs')}
        >
          <span className="hidden sm:inline">{t('vidhan_sabha')}</span>
          <span className="sm:hidden">{language === 'hi' ? 'विधान सभा' : 'Assembly'}</span>
          <span
            className={`text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-mono border transition-all shrink-0 max-w-[130px] sm:max-w-none truncate ${
              isVidhanSabha
                ? 'bg-[#1E2A42] text-[#E9E1CC] border-white/30'
                : 'bg-[#C8BE9E] text-[#1E2A42] border-[#1E2A42]/30'
            }`}
          >
            {vsBadge}
          </span>
        </button>
      </div>
    </div>
  );
}
