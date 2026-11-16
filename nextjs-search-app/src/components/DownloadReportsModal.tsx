'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useElection } from '@/context/ElectionContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSession } from 'next-auth/react';

interface DownloadReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReportItem {
  file: string;
  url?: string;
  displayName: string;
  displayNameEn?: string;
  block?: string;
  gali?: string;
  totalVoters?: number;
  category?: 'master' | 'slip' | 'other';
  part?: number | string;
  slipNum?: string;
}

export default function DownloadReportsModal({ isOpen, onClose }: DownloadReportsModalProps) {
  const { data: session } = useSession();
  const { election, isVidhanSabha } = useElection();
  const { language, t } = useLanguage();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [activeTab, setActiveTab] = useState<'ward_wise' | 'master' | 'other'>('ward_wise');
  const [selectedPart, setSelectedPart] = useState<string | number>('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const role = session?.user?.role || 'public';
  const tier = session?.user?.subscription_tier || 'free';
  const isSuperUser = role === 'developer' || role === 'admin';
  const isPaid = role === 'paid' || tier === 'paid';
  const isLocked = !isSuperUser && !isPaid;


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
      if (isLocked) {
        setLoading(false);
        return;
      }
      setLoading(true);
      fetch(`/api/reports?election=${election}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.reports && data.reports.length > 0) {
            setReports(data.reports);
            const slipList = data.reports.filter((r: ReportItem) => r.category === 'slip' || !r.category);
            const parts = Array.from(new Set(slipList.map((r: ReportItem) => r.part).filter(Boolean)));
            if (parts.length > 1) {
              setSelectedPart('all');
            } else if (parts.length === 1) {
              setSelectedPart(parts[0] as any);
            } else {
              setSelectedPart('');
            }
          } else {
            setReports([]);
            setSelectedPart('');
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch reports:', err);
          setLoading(false);
        });
    }
  }, [isOpen, election]);

  // Extract unique parts/wards for the ward-wise sub-menu
  const availableParts = useMemo(() => {
    const slipReports = reports.filter((r) => r.category === 'slip');
    const set = new Set<string | number>();
    slipReports.forEach((r) => {
      if (r.part !== undefined && r.part !== null) set.add(r.part);
    });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [reports]);

  // Counts per category
  const masterReports = useMemo(() => reports.filter((r) => r.category === 'master'), [reports]);
  const slipReports = useMemo(() => reports.filter((r) => r.category === 'slip' || !r.category), [reports]);
  const otherReports = useMemo(() => reports.filter((r) => r.category === 'other'), [reports]);

  // Active reports based on tab and part filters
  const displayedReports = useMemo(() => {
    if (activeTab === 'master') {
      return masterReports;
    }
    if (activeTab === 'other') {
      return otherReports;
    }

    const targetPart = selectedPart || (availableParts.length > 0 ? (availableParts.length > 1 ? 'all' : availableParts[0]) : '');
    if (!targetPart || targetPart === 'all') {
      return slipReports;
    }
    return slipReports.filter((r) => String(r.part) === String(targetPart));
  }, [activeTab, selectedPart, masterReports, slipReports, otherReports, availableParts]);


  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#24211A]/85 backdrop-blur-sm p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Brutalist Modal Container */}
      <div className="bg-[#E9E1CC] border-4 border-double border-[#1E2A42] max-w-2xl w-full p-4 sm:p-6 shadow-[8px_8px_0_rgba(30,42,66,1)] relative max-h-[90vh] flex flex-col font-['Courier_Prime'] overflow-hidden my-auto">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-[#A2382B] text-white font-bold border-2 border-[#1E2A42] hover:-translate-y-[1px] hover:shadow-[2px_2px_0_rgba(30,42,66,1)] transition-all z-40 select-none cursor-pointer text-lg"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Modal Header */}
        <div className="border-b-2 border-dashed border-[#1E2A42] pb-3 mb-4 pr-10">
          <h2 className="text-2xl sm:text-3xl font-black text-[#1E2A42] font-['Fraunces'] uppercase flex items-center gap-2">
            <span>{isVidhanSabha ? t('Slips Reports Download', 'पर्ची रिपोर्ट्स डाउनलोड') : t('Gali Reports Download', 'गली रिपोर्ट्स डाउनलोड')}</span>
          </h2>

          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[#1E2A42]/20 text-xs">
            <span className="px-2.5 py-0.5 bg-[#1E2A42] text-[#E9E1CC] font-bold border border-[#1E2A42] uppercase shadow-sm whitespace-nowrap">
              {isVidhanSabha ? t('pachpadra_137') : t('nagar_parishad')}
            </span>
            <span className="px-2.5 py-0.5 bg-[#E1D7BC] border border-[#1E2A42] text-[#1E2A42] font-bold shadow-sm whitespace-nowrap">
              {reports.length} {t('Reports Available', 'रिपोर्ट्स उपलब्ध')}
            </span>
          </div>
        </div>

        {/* Category Navigation Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 pb-2.5 border-b border-[#1E2A42]/20 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('ward_wise')}
            className={`w-full px-3 py-2 text-xs sm:text-sm font-bold border-2 border-[#1E2A42] transition-all flex items-center justify-between sm:justify-center gap-2 cursor-pointer ${activeTab === 'ward_wise'
                ? 'bg-[#1E2A42] text-[#E9E1CC] shadow-[3px_3px_0_rgba(162,56,43,1)]'
                : 'bg-[#D8CCA9] text-[#1E2A42] hover:bg-white'
              }`}
          >
            <span>{isVidhanSabha ? t('Part Wise', 'भाग अनुसार') : t('Ward Wise', 'वार्ड अनुसार')}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${activeTab === 'ward_wise' ? 'bg-[#A2382B] text-white' : 'bg-[#C8BE9E] text-[#1E2A42]'
              }`}>
              {slipReports.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('master')}
            className={`w-full px-3 py-2 text-xs sm:text-sm font-bold border-2 border-[#1E2A42] transition-all flex items-center justify-between sm:justify-center gap-2 cursor-pointer ${activeTab === 'master'
                ? 'bg-[#1E2A42] text-[#E9E1CC] shadow-[3px_3px_0_rgba(162,56,43,1)]'
                : 'bg-[#D8CCA9] text-[#1E2A42] hover:bg-white'
              }`}
          >
            <span>{t('Master Report', 'मास्टर रिपोर्ट')}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${activeTab === 'master' ? 'bg-[#A2382B] text-white' : 'bg-[#C8BE9E] text-[#1E2A42]'
              }`}>
              {masterReports.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('other')}
            className={`w-full px-3 py-2 text-xs sm:text-sm font-bold border-2 border-[#1E2A42] transition-all flex items-center justify-between sm:justify-center gap-2 cursor-pointer ${activeTab === 'other'
                ? 'bg-[#1E2A42] text-[#E9E1CC] shadow-[3px_3px_0_rgba(162,56,43,1)]'
                : 'bg-[#D8CCA9] text-[#1E2A42] hover:bg-white'
              }`}
          >
            <span>{t('Other / Leftover', 'शेष मतदाता')}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${activeTab === 'other' ? 'bg-[#A2382B] text-white' : 'bg-[#C8BE9E] text-[#1E2A42]'
              }`}>
              {otherReports.length}
            </span>
          </button>
        </div>

        {/* Sub-Menu: Dynamic Part / Ward Dropdown Selector */}
        {activeTab === 'ward_wise' && availableParts.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 bg-[#E1D7BC] border-2 border-[#1E2A42] p-2.5 sm:p-3 shadow-[2px_2px_0_rgba(30,42,66,1)] shrink-0">
            <label
              htmlFor="report-ward-selector"
              className="text-xs font-bold uppercase tracking-wider text-[#1E2A42] shrink-0 flex items-center gap-1.5"
            >
              <span>{isVidhanSabha ? t('Select Part:', 'भाग चुनें:') : t('Select Ward:', 'वार्ड चुनें:')}</span>
            </label>
            <div className="relative flex-1 sm:max-w-xs">
              <select
                id="report-ward-selector"
                value={String(selectedPart || (availableParts.length > 1 ? 'all' : availableParts[0]))}
                onChange={(e) => setSelectedPart(e.target.value)}
                className="w-full bg-[#E9E1CC] border-2 border-[#1E2A42] px-3 py-1.5 text-xs sm:text-sm font-bold text-[#1E2A42] font-['Courier_Prime'] focus:outline-none focus:ring-2 focus:ring-[#A2382B] rounded-none cursor-pointer shadow-sm tracking-wide appearance-auto"
              >
                {availableParts.length > 1 && (
                  <option value="all">
                    {isVidhanSabha
                      ? (language === 'hi' ? `सभी भाग (${slipReports.length} रिपोर्ट्स)` : `All Parts (${slipReports.length} Reports)`)
                      : (language === 'hi' ? `सभी वार्ड (${slipReports.length} रिपोर्ट्स)` : `All Wards (${slipReports.length} Reports)`)}
                  </option>
                )}
                {availableParts.map((p) => {
                  const count = slipReports.filter((r) => String(r.part) === String(p)).length;
                  return (
                    <option key={p} value={String(p)}>
                      {isVidhanSabha
                        ? (language === 'hi' ? `भाग ${p} (${count} रिपोर्ट्स)` : `Part ${p} (${count} Reports)`)
                        : (language === 'hi' ? `वार्ड ${p} (${count} रिपोर्ट्स)` : `Ward ${p} (${count} Reports)`)}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}

        {/* Main Content Area (With Lock Blur Layer) */}
        <div className="relative flex-1 min-h-[260px] overflow-hidden flex flex-col">

          {/* Frosted Lock Blur Paywall */}
          {isLocked && (
            <div className="absolute inset-0 bg-[#E9E1CC]/75 backdrop-blur-md z-30 flex items-center justify-center p-3 overflow-y-auto">
              <div className="bg-[#E9E1CC] border-2 border-[#1E2A42] max-w-md w-full p-5 sm:p-6 shadow-[4px_4px_0_rgba(30,42,66,1)] text-center relative font-['Courier_Prime'] my-auto animate-in fade-in zoom-in-95 duration-150">
                <div className="w-10 h-10 bg-[#A2382B]/10 border-2 border-[#A2382B] rounded-full flex items-center justify-center mx-auto mb-2.5 shadow-[2px_2px_0_rgba(162,56,43,1)]">
                  <svg className="w-5 h-5 text-[#A2382B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-['Fraunces'] font-black text-xl sm:text-2xl text-[#1E2A42] mb-1.5 uppercase tracking-tight">
                  {language === 'hi' ? 'अभियान रिपोर्ट्स लॉक हैं' : 'Subscription Required'}
                </h3>
                <p className="text-xs sm:text-sm font-['Lora'] text-[#4A4536] max-w-sm mx-auto mb-4 leading-relaxed">
                  {language === 'hi'
                    ? 'रिपोर्ट्स डाउनलोड करने के लिए डेवलपर से अपना खाता सक्रिय करवाएं।'
                    : 'Report downloads are locked. Contact developer to activate your account.'}
                </p>
                {!session ? (
                  <button
                    onClick={() => (window.location.href = '/login')}
                    className="w-full py-2.5 bg-[#1E2A42] text-[#E9E1CC] font-bold text-xs uppercase tracking-widest hover:bg-[#A2382B] transition-colors border-2 border-[#1E2A42] shadow-[3px_3px_0_rgba(30,42,66,1)] active:translate-y-[1px] cursor-pointer"
                  >
                    {language === 'hi' ? 'लॉगिन करें (Sign In with Google)' : 'Sign In with Google'}
                  </button>
                ) : (
                  <div className="pt-1 flex items-center justify-center gap-2.5 flex-wrap">
                    <a
                      href="tel:+918890106858"
                      className="px-4 py-2 bg-[#1E2A42] text-[#E9E1CC] font-bold text-xs uppercase hover:bg-[#A2382B] transition-colors border border-[#1E2A42] shadow-[2px_2px_0_rgba(30,42,66,0.3)] flex items-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> +91 8890106858
                    </a>
                    <a
                      href={`https://wa.me/918890106858?text=${encodeURIComponent(`Hello Developer, please activate reports download for my account: ${session.user?.email || ''}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#25D366] text-white font-bold text-xs uppercase hover:opacity-90 transition-colors shadow-[2px_2px_0_rgba(37,211,102,0.3)] flex items-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg> WhatsApp
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scrollable Reports List */}
          <div className={`overflow-y-auto flex-1 min-h-0 pr-1.5 space-y-3 pb-3 ${isLocked ? 'filter blur-[1.5px] opacity-40 select-none pointer-events-none' : ''}`}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <svg className="animate-spin h-8 w-8 text-[#A2382B]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span className="font-bold text-sm text-[#A2382B] uppercase tracking-wider">
                  {t('Loading Reports...', 'रिपोर्ट्स लोड हो रही हैं...')}
                </span>
              </div>
            ) : displayedReports.length > 0 ? (
              displayedReports.map((report) => (
                <a
                  key={report.file}
                  href={isLocked ? '#' : (report.url || `/api/reports/download?file=${encodeURIComponent(report.file)}&election=${election}`)}
                  onClick={(e) => {
                    if (isLocked) {
                      e.preventDefault();
                    }
                  }}
                  target={isLocked ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  className="flex items-center justify-between bg-white border-2 border-[#1E2A42] p-3.5 sm:p-4 shadow-[3px_3px_0_rgba(30,42,66,1)] hover:-translate-y-[1px] hover:-translate-x-[1px] hover:shadow-[4px_4px_0_rgba(30,42,66,1)] transition-all group cursor-pointer"
                >
                  <div className="flex flex-col gap-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#1E2A42] text-sm sm:text-base group-hover:text-[#A2382B] transition-colors">
                        {(() => {
                          const rawTitle = (language === 'hi' ? report.displayName : (report.displayNameEn || report.displayName))
                            .replace(/\bBlock\s+Block\b/gi, 'Block')
                            .replace(/\bGali\s+Gali\b/gi, 'Gali');
                          const segments = rawTitle.split('•').map((s) => s.trim());
                          if (segments.length === 2 && segments[0].toLowerCase() === segments[1].toLowerCase()) {
                            return segments[0];
                          }
                          return rawTitle;
                        })()}
                      </span>
                      {report.category === 'master' && (
                        <span className="text-[10px] uppercase font-bold bg-[#1E2A42] text-white px-2 py-0.5 rounded">
                          MASTER
                        </span>
                      )}
                      {report.category === 'other' && (
                        <span className="text-[10px] uppercase font-bold bg-[#A2382B] text-white px-2 py-0.5 rounded">
                          LEFTOVER
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[#E1D7BC] text-[#1E2A42] border border-[#1E2A42]/40 tracking-wider shadow-sm">
                        {report.totalVoters ?? 0} {t('Voters', 'मतदाता')}
                      </span>
                    </div>
                    {report.gali && (
                      <span className="text-xs text-[#6B6944] font-medium">
                        {language === 'hi' ? (
                          <>
                            {report.block ? `${report.block} • ` : ''}
                            {report.gali}
                          </>
                        ) : (
                          <>
                            {report.part ? (isVidhanSabha ? `Part ${report.part}` : `Ward ${report.part}`) : ''}
                            {report.slipNum ? ` • Slip ${report.slipNum}` : ''}
                            {report.category === 'master' ? ' • All Slips Combined' : ''}
                            {report.category === 'other' ? ' • Unassigned Voters' : ''}
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs font-bold text-white bg-[#A2382B] px-3 py-1.5 border border-[#1E2A42] group-hover:bg-[#1E2A42] transition-colors shadow-sm uppercase tracking-wider">
                      PDF
                    </span>
                  </div>
                </a>
              ))
            ) : isLocked ? (
              /* Blurred Sample Reports for Under-Lock Aesthetics when list is empty */
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white border-2 border-[#1E2A42] p-3.5 sm:p-4 shadow-[3px_3px_0_rgba(30,42,66,1)]">
                  <div className="flex flex-col gap-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#1E2A42] text-sm sm:text-base">
                        {isVidhanSabha ? 'Part 95 • Slip 1 - Ward Slips' : 'Ward 05 • Slip 1 - Field Slips'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[#E1D7BC] text-[#1E2A42] border border-[#1E2A42]/40 tracking-wider">
                        482 {t('Voters', 'मतदाता')}
                      </span>
                    </div>
                    <span className="text-xs text-[#6B6944] font-medium">
                      {isVidhanSabha ? 'Part 95 • Agrawal Colony' : 'Ward 5 • Gali 1'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-white bg-[#A2382B] px-3 py-1.5 border border-[#1E2A42] uppercase tracking-wider">
                    PDF
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white border-2 border-[#1E2A42] p-3.5 sm:p-4 shadow-[3px_3px_0_rgba(30,42,66,1)]">
                  <div className="flex flex-col gap-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#1E2A42] text-sm sm:text-base">
                        {isVidhanSabha ? 'Part 95 • Slip 2 - Household Slips' : 'Ward 05 • Slip 2 - Voter Slips'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[#E1D7BC] text-[#1E2A42] border border-[#1E2A42]/40 tracking-wider">
                        514 {t('Voters', 'मतदाता')}
                      </span>
                    </div>
                    <span className="text-xs text-[#6B6944] font-medium">
                      {isVidhanSabha ? 'Part 95 • Main Bazar' : 'Ward 5 • Station Road'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-white bg-[#A2382B] px-3 py-1.5 border border-[#1E2A42] uppercase tracking-wider">
                    PDF
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white border-2 border-[#1E2A42] p-3.5 sm:p-4 shadow-[3px_3px_0_rgba(30,42,66,1)]">
                  <div className="flex flex-col gap-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#1E2A42] text-sm sm:text-base">
                        {isVidhanSabha ? 'Part 95 • Master PDF - Complete Roll' : 'Ward 05 • Master Roll (All Slips)'}
                      </span>
                      <span className="text-[10px] uppercase font-bold bg-[#1E2A42] text-white px-2 py-0.5 rounded">
                        MASTER
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[#E1D7BC] text-[#1E2A42] border border-[#1E2A42]/40 tracking-wider">
                        1,420 {t('Voters', 'मतदाता')}
                      </span>
                    </div>
                    <span className="text-xs text-[#6B6944] font-medium">
                      {isVidhanSabha ? 'Part 95 • Combined Electoral Slips' : 'Ward 5 • Master Compilation'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-white bg-[#A2382B] px-3 py-1.5 border border-[#1E2A42] uppercase tracking-wider">
                    PDF
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 font-bold text-[#4A4536] uppercase border-2 border-dashed border-[#1E2A42]">
                {t('No reports found.', 'कोई रिपोर्ट नहीं मिली।')}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
