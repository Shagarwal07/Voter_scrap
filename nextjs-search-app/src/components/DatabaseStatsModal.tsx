import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useElection } from '@/context/ElectionContext';
import { useLanguage } from '@/context/LanguageContext';

interface WardStat {
  ward: number;
  total: number;
  male: number;
  female: number;
  other: number;
  missing: number[];
}

interface DatabaseStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DatabaseStatsModal({ isOpen, onClose }: DatabaseStatsModalProps) {
  const { election, isVidhanSabha } = useElection();
  const { language, t } = useLanguage();
  const [stats, setStats] = useState<WardStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWard, setExpandedWard] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch(`/api/stats?election=${election}`)
        .then(res => res.json())
        .then(json => {
          if (json.success) {
            setStats(json.data);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch stats", err);
          setLoading(false);
        });
    } else {
      setExpandedWard(null);
    }
  }, [isOpen, election]);

  if (!isOpen || !mounted) return null;

  const totalVoters = stats.reduce((sum, stat) => sum + stat.total, 0);
  const totalMissing = stats.reduce((sum, stat) => sum + stat.missing.length, 0);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[#24211A]/85 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#E9E1CC] border-4 border-double border-[#1E2A42] shadow-[8px_8px_0_rgba(30,42,66,1)] flex flex-col p-5 sm:p-7 overflow-hidden font-['Courier_Prime'] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-[#A2382B] text-white font-bold border-2 border-[#1E2A42] shadow-[2px_2px_0_rgba(30,42,66,1)] hover:-translate-y-[1px] hover:translate-x-[1px] active:translate-y-0 transition-all z-10 cursor-pointer text-lg select-none"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Header */}
        <div className="border-b-2 border-dashed border-[#1E2A42] pb-4 mb-4 pr-10">
          <h2 className="text-2xl sm:text-3xl font-black text-[#1E2A42] font-['Fraunces'] uppercase tracking-tight">
            {t('db_modal_title')}
          </h2>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-[#1E2A42]/20 text-xs font-['Courier_Prime']">
            <span className="px-2.5 py-1 bg-[#E1D7BC] border border-[#1E2A42] text-[#1E2A42] font-bold shadow-sm">
              {t('db_valid_voters')}: <strong className="text-[#1E2A42] font-black">{totalVoters.toLocaleString()}</strong>
            </span>
            <span className="px-2.5 py-1 bg-[#fee2e2] border border-[#ef4444] text-[#991b1b] font-bold shadow-sm">
              {t('db_missing_shifted')}: <strong className="text-[#991b1b] font-black">{totalMissing.toLocaleString()}</strong>
            </span>
            <span className="px-2.5 py-1 bg-[#1E2A42] text-[#E9E1CC] font-bold border border-[#1E2A42] shadow-sm uppercase">
              {isVidhanSabha ? t('pachpadra_137') : t('nagar_parishad')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <svg className="animate-spin h-8 w-8 text-[#A2382B]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <p className="font-bold text-sm text-[#A2382B] uppercase tracking-wider">
                {t('Analyzing database segments...', 'डेटाबेस का विश्लेषण किया जा रहा है...')}
              </p>
            </div>
          ) : (
            <div className="border-2 border-[#1E2A42] bg-[#E1D7BC] shadow-[4px_4px_0_rgba(30,42,66,1)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="uppercase tracking-widest border-b-[2px] border-[#1E2A42] bg-[#1E2A42] text-[#E9E1CC] font-['Courier_Prime'] text-xs">
                    <tr>
                      <th scope="col" className="px-5 py-3.5 font-bold text-center">
                        {isVidhanSabha ? (language === 'hi' ? 'भाग संख्या' : 'PART NO.') : (language === 'hi' ? 'वार्ड संख्या' : 'WARD NO.')}
                      </th>
                      <th scope="col" className="px-5 py-3.5 font-bold text-center">{t('db_th_male')}</th>
                      <th scope="col" className="px-5 py-3.5 font-bold text-center">{t('db_th_female')}</th>
                      <th scope="col" className="px-5 py-3.5 font-bold text-center">{t('db_th_total')}</th>
                      <th scope="col" className="px-5 py-3.5 font-bold text-right">{t('db_th_missing')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#B7A97E]">
                    {stats.map((stat) => (
                      <React.Fragment key={stat.ward}>
                        <tr className="hover:bg-[#D8CCA9] transition-colors">
                          <td className="px-5 py-3.5 text-center font-['Courier_Prime']">
                            <span className="inline-block px-2.5 py-1 bg-[#A2382B]/10 text-[#A2382B] border border-[#A2382B] font-bold text-xs tracking-wider shadow-sm">
                              {isVidhanSabha 
                                ? (language === 'hi' ? `भाग ${stat.ward}` : `Part ${stat.ward}`) 
                                : (language === 'hi' ? `वार्ड ${stat.ward}` : `Ward ${stat.ward}`)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center font-['Courier_Prime'] font-bold text-[#1e40af] text-sm sm:text-base">
                            {stat.male.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-center font-['Courier_Prime'] font-bold text-[#9f1239] text-sm sm:text-base">
                            {stat.female.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-center font-['Courier_Prime'] font-black text-[#1E2A42] text-base sm:text-lg">
                            {stat.total.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right font-['Courier_Prime']">
                            <button
                              onClick={() => setExpandedWard(expandedWard === stat.ward ? null : stat.ward)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold font-['Courier_Prime'] border border-[#1E2A42] shadow-[2px_2px_0_rgba(30,42,66,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer bg-[#fff7ed] hover:bg-[#ffedd5] text-[#c2410c] select-none"
                            >
                              <span>{stat.missing.length} {t('db_missing_badge')}</span>
                              <svg className={`w-3.5 h-3.5 transition-transform ${expandedWard === stat.ward ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Missing Numbers Row */}
                        {expandedWard === stat.ward && (
                          <tr className="bg-[#E9E1CC] border-t border-dashed border-[#1E2A42]">
                            <td colSpan={5} className="px-5 py-4 font-['Courier_Prime']">
                              <div className="flex items-center gap-2 mb-2.5">
                                <span className="text-[#A2382B] font-bold text-sm">⚠</span>
                                <h3 className="text-xs font-black text-[#A2382B] uppercase tracking-wide">
                                  {t('db_missing_heading')} (1 {t('to', 'से')} {stat.total + stat.missing.length})
                                </h3>
                              </div>
                              {stat.missing.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-3 bg-[#F4F0EA] border border-[#1E2A42]/30 shadow-inner">
                                  {stat.missing.map(num => (
                                    <span key={num} className="px-2 py-0.5 text-xs font-mono font-bold bg-white text-[#1E2A42] border border-[#1E2A42] shadow-[1px_1px_0_rgba(30,42,66,1)]">
                                      #{num}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[#64748b] text-xs font-['Courier_Prime'] italic py-1">
                                  {t('db_no_missing')}
                                </p>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    
                    {stats.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-[#4A4536] font-['Courier_Prime']">
                          No wards found in database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
