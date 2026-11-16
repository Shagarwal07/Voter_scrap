'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ReactTransliterate } from 'react-transliterate';
import DatabaseStatsModal from '@/components/DatabaseStatsModal';
import DownloadReportsModal from '@/components/DownloadReportsModal';
import ElectionToggle from '@/components/ElectionToggle';
import { useElection } from '@/context/ElectionContext';
import { useSession, signOut } from 'next-auth/react';
import { useLanguage } from '@/context/LanguageContext';
import { sendGAEvent } from '@next/third-parties/google';
import Footer from '@/components/Footer';
import AccessNotice from '@/components/AccessNotice';
import { checkSuperUser } from '@/utils/auth';

export default function Home() {
  const { data: session } = useSession();
  const { language, toggleLanguage, t } = useLanguage();

  const userRole = session?.user?.role || 'public';
  const userTier = session?.user?.subscription_tier || 'free';
  const { isSuperUser } = checkSuperUser(session?.user);
  const isPaid = userRole === 'paid' || userTier === 'paid';
  const isUnassignedPaid = !isSuperUser && isPaid && (!session?.user?.allowed_wards || session.user.allowed_wards.trim() === '');
  const {
    election,
    isVidhanSabha,
    setSelectedWard,
    availableWards,
    setAvailableWards: setCtxAvailableWards,
    totalVoters: ctxTotalVoters,
  } = useElection();

  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('voter_id');
  const [ward, setWard] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalVoters, setTotalVoters] = useState<number>(0);
const [expandedRows, setExpandedRows] = useState<Set<number | string>>(new Set());
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [quotaError, setQuotaError] = useState<{ message: string; code: string } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showOath, setShowOath] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResultItems, setTotalResultItems] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem('voterOathAccepted')) {
      setShowOath(true);
    }
  }, []);

  const acceptOath = () => {
    localStorage.setItem('voterOathAccepted', 'true');
    setShowOath(false);
  };

  const toggleRow = (id: number | string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const fetchWards = async () => {
    try {
      const res = await fetch(`/api/wards?election=${election}`);
      const json = await res.json();
      if (json.success) {
        setCtxAvailableWards(json.data);
        if (json.totalVoters !== undefined) {
          setTotalVoters(json.totalVoters);
        }
      }
    } catch (err) {
      console.error('Failed to fetch wards', err);
    }
  };

  const fetchResults = async (
    searchQuery: string,
    type: string,
    wardQuery: string,
    pageNumber: number = 1
  ) => {
    if (searchQuery) {
      sendGAEvent({ event: 'search', search_type: type });
    }
    setLoading(true);
    setQuotaError(null);
    setApiError(null);
    try {
      const res = await fetch(
        `/api/voters?q=${encodeURIComponent(searchQuery)}&type=${type}&ward=${encodeURIComponent(
          wardQuery
        )}&page=${pageNumber}&election=${election}`
      );
      const json = await res.json();

      if (res.status === 429) {
        setQuotaError({ message: json.error, code: json.code });
        setResults([]);
        setLoading(false);
        return;
      }

      if (res.status === 400 || res.status === 403) {
        if (
          json.error ===
          'Public users can only search by Voter ID. Please sign in with Google to search by Name.'
        ) {
          window.location.href = '/login';
          return;
        }
        setApiError(json.error);
        setResults([]);
        setLoading(false);
        return;
      }

      if (json.success) {
        setResults(json.data);
        if (json.pagination) {
          setCurrentPage(json.pagination.currentPage);
          setTotalPages(json.pagination.totalPages);
          setTotalResultItems(json.pagination.totalItems);
        }
      } else {
        console.error('Error fetching data:', json.error);
        setApiError(json.error || 'An unexpected error occurred.');
        setResults([]);
      }
    } catch (err) {
      console.error(err);
      setResults([]);
    }
    setLoading(false);
  };

  // Re-fetch ward/part numbers and reset filters when election toggle changes
  useEffect(() => {
    fetchWards();
    setWard('');
    setSelectedWard('');
    if (query.trim()) {
      fetchResults(query, searchType, '', 1);
    } else {
      setResults([]);
    }
  }, [election]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setApiError('Please enter a valid search term before executing a query.');
      setResults([]);
      return;
    }
    fetchResults(query, searchType, ward, 1);
  };

  return (
    <div className="min-h-screen bg-[#E9E1CC] text-[#24211A] font-['Lora'] px-5 py-8 md:p-10 pt-16 md:pt-20 relative">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500;1,9..144,600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Courier+Prime:wght@400;700&display=swap');

        .iws-noise-overlay::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 10;
          opacity: 0.05;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          mix-blend-mode: multiply;
        }
      `,
        }}
      />

      {/* NOISE OVERLAY */}
      <div className="iws-noise-overlay fixed inset-0 pointer-events-none z-10"></div>

      <main className="max-w-6xl mx-auto relative z-20 pb-4">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 md:mb-10 border-b-[3px] border-double border-[#1E2A42] pb-6">
          <div className="relative inline-block pr-32 md:pr-48">
            <h1 className="text-2xl md:text-4xl font-black text-[#1E2A42] font-['Fraunces'] tracking-tight inline-block relative">
              Electoral Roll Explorer
              {/* Red Unofficial Seal */}
              <svg
                className="w-16 h-16 md:w-[84px] md:h-[84px] absolute -top-4 -right-16 md:-top-6 md:-right-[84px] opacity-90 mix-blend-multiply rotate-[-12deg] z-10"
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <filter id="rough-seal">
                    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="n" />
                    <feDisplacementMap in="SourceGraphic" in2="n" scale="3" />
                  </filter>
                  <path id="seal-ringtop" d="M 30,100 A 70,70 0 0 1 170,100" />
                  <path id="seal-ringbot" d="M 170,100 A 70,70 0 0 1 30,100" />
                </defs>
                <g filter="url(#rough-seal)" fill="none" stroke="#A2382B" strokeWidth="3.5">
                  <circle cx="100" cy="100" r="92" />
                  <circle cx="100" cy="100" r="80" />
                </g>
                <g filter="url(#rough-seal)" fill="#A2382B" fontFamily="Courier Prime, monospace" fontSize="13" letterSpacing="3">
                  <text>
                    <textPath href="#seal-ringtop" startOffset="50%" textAnchor="middle">
                      UNOFFICIAL PORTAL
                    </textPath>
                  </text>
                  <text>
                    <textPath href="#seal-ringbot" startOffset="50%" textAnchor="middle">
                      UNVERIFIED DATA
                    </textPath>
                  </text>
                </g>
                <g filter="url(#rough-seal)" fill="#A2382B" textAnchor="middle" fontFamily="Fraunces, serif">
                  <text x="100" y="106" fontSize="22" fontWeight="800">
                    UNOFFICIAL
                  </text>
                </g>
              </svg>
            </h1>
            <p className="text-[#4A4536] mt-1 md:mt-2 text-sm md:text-base font-['Courier_Prime'] tracking-widest uppercase relative z-20">
              Unofficial Voter Lookup Portal Balotra
            </p>

            {/* LIVE Stats Button */}
            <button
              onClick={() => setShowStatsModal(true)}
              className="absolute bottom-0 right-4 md:right-10 z-30 px-3 py-1.5 bg-[#E1D7BC] border-[2.5px] border-[#1E2A42] text-[#1E2A42] text-xs font-bold flex items-center gap-2 shadow-[3px_3px_0_rgba(30,42,66,1)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[2px_2px_0_rgba(30,42,66,1)] transition-all uppercase tracking-wider -rotate-[4deg] cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#A2382B] animate-pulse"></span>
              LIVE
            </button>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="w-full sm:w-auto flex items-center gap-1.5 sm:gap-2 font-['Courier_Prime']">
            {/* Home Portal Button (served via NEXT_PUBLIC_FRONTEND_URL) */}
            <a
              href={process.env.NEXT_PUBLIC_FRONTEND_URL || '/'}
              className="h-8 sm:h-9 px-2 sm:px-3 bg-[#1E2A42] border border-[#1E2A42] text-[#E9E1CC] text-[11px] sm:text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 shadow-[2px_2px_0_rgba(30,42,66,1)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_rgba(30,42,66,1)] transition-all uppercase tracking-wider"
              title={t('Home Portal', 'होम पोर्टल')}
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {/* Compact Icon */}
            </a>

            {/* Street Finder */}
            <Link
              href="/house"
              className="flex-1 sm:flex-initial h-8 sm:h-9 px-2.5 sm:px-3.5 bg-[#E1D7BC] border border-[#1E2A42] text-[#1E2A42] text-xs sm:text-sm font-bold flex items-center justify-center gap-1 sm:gap-1.5 shadow-[2px_2px_0_rgba(30,42,66,1)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_rgba(30,42,66,1)] transition-all uppercase tracking-wider whitespace-nowrap"
              title={t('House & Street Finder', 'मकान व गली खोज')}
            >
              <span>{language === 'hi' ? 'मकान' : 'House'}</span>
            </Link>

            {/* Voter Slips & Reports Modal */}
            <button
              onClick={() => setShowReportsModal(true)}
              className="flex-1 sm:flex-initial h-8 sm:h-9 px-2.5 sm:px-3.5 bg-[#E1D7BC] border border-[#1E2A42] text-[#1E2A42] text-xs sm:text-sm font-bold flex items-center justify-center gap-1 sm:gap-1.5 shadow-[2px_2px_0_rgba(30,42,66,1)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_rgba(30,42,66,1)] transition-all uppercase tracking-wider cursor-pointer whitespace-nowrap"
              title={t('Download Voter Slips & Reports', 'वोटर पर्ची व रिपोर्ट्स डाउनलोड')}
            >
              <span>{language === 'hi' ? 'रिपोर्ट्स' : 'Reports'}</span>
            </button>


            {/* User Session Auth Button (Left of Language Toggle) */}
            {session ? (
              <button
                onClick={() => signOut()}
                className="h-8 sm:h-9 px-2 sm:px-2.5 bg-[#A2382B] border border-[#A2382B] text-[#E9E1CC] text-xs font-bold flex items-center justify-center shadow-[2px_2px_0_rgba(30,42,66,1)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_rgba(30,42,66,1)] transition-all uppercase tracking-wider cursor-pointer shrink-0"
                title="Logout"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {/* Icon-only for least priority logout */}
              </button>
            ) : (
              <Link
                href="/login"
                className="h-8 sm:h-9 px-2 sm:px-2.5 bg-[#1E2A42] border border-[#1E2A42] text-[#E9E1CC] text-xs font-bold flex items-center justify-center shadow-[2px_2px_0_rgba(30,42,66,1)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_rgba(30,42,66,1)] transition-all uppercase tracking-wider shrink-0"
                title="Login"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                {/* Compact icon */}
              </Link>
            )}

            {/* Brutalist Language Toggle Switch (Positioned at Far Right) */}
            <div
              onClick={toggleLanguage}
              className="flex items-center cursor-pointer border-[2px] border-[#1E2A42] bg-white shadow-[2px_2px_0_rgba(30,42,66,1)] rounded-full p-1 w-[68px] sm:w-[72px] h-8 sm:h-9 relative transition-all hover:-translate-y-[1px] hover:shadow-[3px_3px_0_rgba(30,42,66,1)] active:translate-y-0 active:shadow-none shrink-0 select-none"
              title="Toggle English / Hindi"
            >
              <div
                className={`absolute top-1 bottom-1 w-6 sm:w-7 bg-[#A2382B] rounded-full transition-all duration-300 shadow-inner ${
                  language === 'en' ? 'left-1' : 'left-[32px] sm:left-[34px]'
                }`}
              ></div>
              <span
                className={`flex-1 text-center font-['Courier_Prime'] font-bold text-[10px] z-10 transition-colors duration-300 ${
                  language === 'en' ? 'text-white' : 'text-[#1E2A42]'
                }`}
              >
                EN
              </span>
              <span
                className={`flex-1 text-center font-['Courier_Prime'] font-bold text-[10px] z-10 transition-colors duration-300 ${
                  language === 'hi' ? 'text-white' : 'text-[#1E2A42]'
                }`}
              >
                HI
              </span>
            </div>
          </div>
        </header>

        {/* Clean Election Segmented Control (Extra text removed) */}
        <div className="mb-6 font-['Courier_Prime']">
          <ElectionToggle />
        </div>

        {/* Centralized Warning for Paid Users with Unassigned Ward Permissions */}
        {isUnassignedPaid && (
          <AccessNotice
            variant="warning"
            title={language === 'hi' ? 'सक्रिय सशुल्क खाता: वार्ड असाइन नहीं किया गया' : 'PAID ACCOUNT ACTIVE: NO WARDS ASSIGNED'}
            message={language === 'hi' 
              ? 'आपका सशुल्क खाता सक्रिय है, लेकिन डेटाबेस में अभी तक कोई वार्ड या भाग असाइन नहीं किया गया है। सहायता हेतु तुरंत डेवलपर से संपर्क करें:'
              : 'Your account is Paid, but no specific wards or parts have been assigned in the database yet. Please contact developer to get help in that:'}
            whatsappMessage="Hello Developer, my paid account needs ward assignment."
            className="mb-6"
          />
        )}

        {/* Search Input Section */}
        <section className="bg-gradient-to-b from-[#E1D7BC] to-[#D8CCA9] border border-[#1E2A42] p-6 md:p-8 mb-10 shadow-[5px_5px_0_rgba(30,42,66,0.12)] relative">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#6B6944]"></div>
          <form onSubmit={handleSearch} className="flex flex-col gap-5 pl-2 font-['Courier_Prime']">
            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              {/* Query Field */}
              <div className="flex-[2]">
                <label className="block text-xs font-bold text-[#6B6944] mb-2 uppercase tracking-widest">
                  {searchType === 'voter_id' && (language === 'hi' ? 'वोटर आईडी दर्ज करें' : 'ENTER VOTER ID')}
                  {searchType === 'name' && (language === 'hi' ? 'मतदाता का नाम (हिंदी या अंग्रेजी)' : 'ENTER NAME (HINDI / ENGLISH)')}
                  {searchType === 'relative_name' && (language === 'hi' ? 'पिता / पति का नाम' : "ENTER RELATIVE'S NAME")}
                  {searchType === 'house' && (language === 'hi' ? 'मकान संख्या' : 'ENTER HOUSE NUMBER')}
                  {searchType === 'serial' && (language === 'hi' ? 'क्रम संख्या (Serial Number)' : 'ENTER SERIAL NUMBER')}
                </label>
                <div className="relative">
                  {(searchType === 'name' || searchType === 'relative_name') ? (
                    <ReactTransliterate
                      value={query}
                      onChangeText={(text) => setQuery(text)}
                      lang="hi"
                      placeholder={
                        searchType === 'relative_name'
                          ? 'e.g. Mohan Lal, मोहन लाल'
                          : 'e.g. Ramesh, रमेश'
                      }
                      containerClassName="w-full"
                      className="w-full bg-[#E9E1CC] border border-[#1E2A42] py-3 px-4 text-[#1E2A42] placeholder-[#8A8575] focus:outline-none focus:ring-1 focus:ring-[#A2382B] transition-all text-sm md:text-base font-medium shadow-inner rounded-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={
                        searchType === 'voter_id'
                          ? 'e.g. RJ/18/118/...'
                          : searchType === 'house'
                          ? 'e.g. 101, 45-B'
                          : 'e.g. 450'
                      }
                      className="w-full bg-[#E9E1CC] border border-[#1E2A42] py-3 px-4 text-[#1E2A42] placeholder-[#8A8575] focus:outline-none focus:ring-1 focus:ring-[#A2382B] transition-all text-sm md:text-base font-medium shadow-inner rounded-none"
                    />
                  )}
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8575] hover:text-[#A2382B] font-bold text-lg select-none cursor-pointer"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>

              {/* Filter By Field */}
              <div className="flex-1">
                <label className="block text-xs font-bold text-[#6B6944] mb-2 uppercase tracking-widest">
                  {language === 'hi' ? 'फिल्टर प्रकार' : 'FILTER BY'}
                </label>
                <select
                  value={searchType}
                  onChange={(e) => {
                    if (!session && e.target.value !== 'voter_id') {
                      window.location.href = '/login';
                      return;
                    }
                    setSearchType(e.target.value);
                  }}
                  className="w-full bg-[#E9E1CC] border border-[#1E2A42] py-3 px-4 text-[#1E2A42] focus:outline-none focus:ring-1 focus:ring-[#A2382B] transition-all appearance-none text-sm shadow-inner rounded-none cursor-pointer"
                >
                  <option value="voter_id">{language === 'hi' ? 'वोटर आईडी (EPIC)' : 'Voter ID'}</option>
                  <option value="name">{language === 'hi' ? 'नाम' : 'Name'}</option>
                  <option value="relative_name">{language === 'hi' ? 'पिता / पति का नाम' : 'Father / Husband Name'}</option>
                  <option value="house">{language === 'hi' ? 'मकान संख्या' : 'House Number'}</option>
                  <option value="serial">{language === 'hi' ? 'क्रमांक' : 'Serial Number'}</option>
                </select>
              </div>

              {/* Ward / Part Dynamic Selector Handled by Election Toggle */}
              <div className="flex-1">
                <label className="block text-xs font-bold text-[#6B6944] mb-2 uppercase tracking-widest">
                  {isVidhanSabha
                    ? language === 'hi'
                      ? 'भाग संख्या (PART NO.)'
                      : 'PART NO.'
                    : language === 'hi'
                    ? 'वार्ड संख्या (WARD NO.)'
                    : 'WARD NO.'}
                </label>
                <select
                  value={ward}
                  onChange={(e) => {
                    setWard(e.target.value);
                    setSelectedWard(e.target.value);
                  }}
                  className="w-full bg-[#E9E1CC] border border-[#1E2A42] py-3 px-4 text-[#1E2A42] focus:outline-none focus:ring-1 focus:ring-[#A2382B] transition-all appearance-none text-sm shadow-inner rounded-none cursor-pointer"
                >
                  <option value="">
                    {isVidhanSabha
                      ? language === 'hi'
                        ? 'सभी भाग'
                        : 'All Parts'
                      : language === 'hi'
                      ? 'सभी वार्ड'
                      : 'All Wards'}
                  </option>
                  {availableWards.map((w) => (
                    <option key={w} value={w.toString()}>
                      {isVidhanSabha
                        ? language === 'hi'
                          ? `भाग ${w}`
                          : `Part ${w}`
                        : language === 'hi'
                        ? `वार्ड ${w}`
                        : `Ward ${w}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#1E2A42] text-[#E9E1CC] font-bold py-3 px-8 shadow-[3px_3px_0_rgba(107,105,68,1)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[2px_2px_0_rgba(107,105,68,1)] transition-all disabled:opacity-50 h-[48px] w-full md:w-auto uppercase tracking-widest text-sm border border-[#1E2A42] cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-[#E9E1CC]" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{language === 'hi' ? 'खोज जारी...' : 'Searching...'}</span>
                    </>
                  ) : (
                    <span>{language === 'hi' ? 'खोजें' : 'Search'}</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Results Section */}
        {quotaError ? (
          <section className="bg-gradient-to-b from-[#E1D7BC] to-[#D8CCA9] border border-[#A2382B] p-8 mb-8 shadow-[5px_5px_0_rgba(162,56,43,0.2)] text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#A2382B]"></div>
            <div className="w-16 h-16 bg-[#A2382B]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#A2382B]">
              <svg className="w-8 h-8 text-[#A2382B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-[#1E2A42] mb-3 font-['Fraunces']">Search Limit Expired</h2>
            <p className="text-[#4A4536] text-sm md:text-base mb-6 max-w-lg mx-auto">
              {quotaError.code === 'QUOTA_EXCEEDED_PUBLIC'
                ? 'आपने आज के लिए अपनी निःशुल्क खोजों का उपयोग कर लिया है। असीमित खोजों को अनलॉक करने के लिए Google से लॉगिन करें।'
                : 'आपका अतिथि खोज कोटा समाप्त हो गया है। असीमित प्रीमियम एक्सेस के लिए व्यवस्थापक से संपर्क करें।'}
            </p>
            {quotaError.code === 'QUOTA_EXCEEDED_PUBLIC' && !session ? (
              <button
                onClick={() => (window.location.href = '/login')}
                className="inline-flex items-center justify-center px-8 py-3 bg-[#E9E1CC] border border-[#1E2A42] text-[#1E2A42] font-['Courier_Prime'] font-bold tracking-widest uppercase hover:bg-white transition-colors shadow-[3px_3px_0_rgba(30,42,66,1)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[2px_2px_0_rgba(30,42,66,1)] cursor-pointer"
              >
                Sign in with Google
              </button>
            ) : (
              <div className="inline-block bg-[#E9E1CC] border border-[#1E2A42] p-5 shadow-[2px_2px_0_rgba(30,42,66,1)] text-left min-w-[280px]">
                <p className="text-[#1E2A42] font-bold font-['Courier_Prime'] text-base mb-1">Campaign Support</p>
                <p className="text-sm text-[#4A4536] mb-4">Contact Admin to upgrade your account tier</p>
              </div>
            )}
          </section>
        ) : (
          <section>
            <div className="flex items-baseline gap-[14px] mt-10 mb-6 pb-2.5 border-b-[1.5px] border-[#1E2A42]">
              <span className="font-['Courier_Prime'] text-[12px] font-bold tracking-[0.14em] text-[#1E2A42] bg-[#E1D7BC] border border-[#1E2A42] px-2 py-[3px] whitespace-nowrap">
                Annexure B
              </span>
              <h2 className="font-['Fraunces'] font-medium text-[22px] m-0 text-[#24211A]">
                {language === 'hi' ? 'खोज परिणाम' : 'Search Results'} ({totalResultItems || results.length})
              </h2>
            </div>
            {apiError && (
              <AccessNotice
                variant="error"
                message={apiError}
                whatsappMessage="Hello Developer, I am facing an issue in Voter Search."
                className="mb-6"
              />
            )}

            <div className="bg-[#E1D7BC] border border-[#1E2A42] shadow-[5px_5px_0_rgba(30,42,66,0.12)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="uppercase tracking-widest border-b-[2px] border-[#1E2A42] bg-[#1E2A42] text-[#E9E1CC] font-['Courier_Prime'] text-xs">
                    <tr>
                      <th scope="col" className="hidden sm:table-cell px-6 py-4 font-bold text-center">
                        {isVidhanSabha ? (language === 'hi' ? 'भाग' : 'Part') : (language === 'hi' ? 'वार्ड' : 'Ward')}
                      </th>
                      <th scope="col" className="hidden sm:table-cell px-6 py-4 font-bold text-center">
                        {language === 'hi' ? 'पृष्ठ' : 'Page'}
                      </th>
                      <th scope="col" className="hidden lg:table-cell px-6 py-4 font-bold">
                        Source File
                      </th>
                      <th scope="col" className="px-6 py-4 font-bold">
                        {language === 'hi' ? 'क्र.सं.' : 'Serial No.'}
                      </th>
                      <th scope="col" className="px-4 md:px-6 py-4 font-bold">
                        {language === 'hi' ? 'नाम (हिंदी)' : 'Name (Hindi)'}
                      </th>
                      <th scope="col" className="px-4 md:px-6 py-4 font-bold">
                        {language === 'hi' ? 'पहचान पत्र (Voter ID)' : 'Voter ID'}
                      </th>
                      <th scope="col" className="hidden md:table-cell px-6 py-4 font-bold">
                        {language === 'hi' ? 'संबंधी का नाम' : "Relative's Name"}
                      </th>
                      <th scope="col" className="hidden lg:table-cell px-6 py-4 font-bold">
                        {language === 'hi' ? 'संबंध' : 'Relation'}
                      </th>
                      <th scope="col" className="hidden sm:table-cell px-4 md:px-6 py-4 font-bold text-center">
                        {language === 'hi' ? 'आयु' : 'Age'}
                      </th>
                      <th scope="col" className="hidden sm:table-cell px-4 md:px-6 py-4 font-bold">
                        {language === 'hi' ? 'लिंग' : 'Gender'}
                      </th>
                      <th scope="col" className="hidden md:table-cell px-6 py-4 font-bold">
                        {language === 'hi' ? 'मकान नं.' : 'House No.'}
                      </th>
                      <th scope="col" className="sm:hidden px-4 py-4 font-bold text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#B7A97E]">
                    {results.length > 0 ? (
                      results.map((voter, idx) => {
                        const rowKey = `${voter.ward || voter.part_no || "0"}-${voter.serial_number || voter.id || idx}`;
                        return (
                          <React.Fragment key={rowKey}>
                            <tr
                              className="hover:bg-[#D8CCA9] transition-colors cursor-pointer sm:cursor-default"
                              onClick={() => {
                                if (window.innerWidth < 640) toggleRow(rowKey);
                              }}
                            >
                            <td className="hidden sm:table-cell px-6 py-4 text-center font-['Courier_Prime']">
                              <span className="inline-block px-2 py-0.5 bg-[#A2382B]/10 text-[#A2382B] border border-[#A2382B] font-bold">
                                {voter.ward || voter.part_no || '-'}
                              </span>
                            </td>
                            <td className="hidden sm:table-cell px-6 py-4 text-center font-['Courier_Prime'] text-[#1E2A42] font-bold">
                              {voter.page_number || '-'}
                            </td>
                            <td className="hidden lg:table-cell px-6 py-4 text-xs text-[#4A4536] max-w-xs truncate font-['Courier_Prime']">
                              {voter.source_file || '-'}
                            </td>
                            <td className="px-6 py-4 font-['Courier_Prime']">
                              <span className="inline-block px-2.5 py-0.5 bg-white text-[#1E2A42] border border-[#1E2A42] font-bold shadow-sm">
                                {voter.serial_number}
                              </span>
                            </td>
                            <td className="px-4 md:px-6 py-4 font-bold text-[#1E2A42]">{voter.name_hi}</td>
                            <td className="px-4 md:px-6 py-4 font-['Courier_Prime']">
                              <span className="inline-block px-2 py-0.5 text-[#1E2A42] border border-dotted border-[#1E2A42] font-bold tracking-wide">
                                {voter.voter_id}
                              </span>
                            </td>
                            <td className="hidden md:table-cell px-6 py-4 text-[#4A4536] font-medium">
                              {voter.relative_name_hi}
                            </td>
                            <td className="hidden lg:table-cell px-6 py-4 text-[#6B6944] capitalize font-['Courier_Prime'] text-xs">
                              {voter.relative_type}
                            </td>
                            <td className="hidden sm:table-cell px-4 md:px-6 py-4 text-center font-['Courier_Prime'] font-bold text-[#1E2A42]">
                              {voter.age}
                            </td>
                            <td className="hidden sm:table-cell px-4 md:px-6 py-4 capitalize font-['Courier_Prime'] text-xs">
                              <span
                                className={`inline-block px-2 py-0.5 font-bold border ${
                                  voter.gender === 'male'
                                    ? 'bg-[#1E2A42]/10 text-[#1E2A42] border-[#1E2A42]'
                                    : voter.gender === 'female'
                                    ? 'bg-[#A2382B]/10 text-[#A2382B] border-[#A2382B]'
                                    : 'bg-[#6B6944]/10 text-[#6B6944] border-[#6B6944]'
                                }`}
                              >
                                {voter.gender === 'male' ? t('gender_male') : voter.gender === 'female' ? t('gender_female') : voter.gender}
                              </span>
                            </td>
                            <td className="hidden md:table-cell px-6 py-4 font-['Courier_Prime'] text-[#1E2A42] font-bold">
                              {voter.house_number}
                            </td>
                            <td className="sm:hidden px-4 py-4 text-right text-[#1E2A42]">
                              <svg
                                className={`w-5 h-5 inline-block transition-transform ${
                                  expandedRows.has(rowKey) ? 'rotate-180' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </td>
                          </tr>
                          {expandedRows.has(rowKey) && (
                            <tr className="sm:hidden bg-[#E9E1CC]">
                              <td colSpan={4} className="px-4 py-4 border-t border-dashed border-[#1E2A42]">
                                <div className="grid grid-cols-2 gap-3 text-sm font-['Courier_Prime']">
                                  <div>
                                    <span className="text-[#6B6944] text-xs uppercase block mb-0.5">
                                      {isVidhanSabha ? 'Part' : 'Ward'}
                                    </span>
                                    <span className="font-bold text-[#A2382B]">{voter.ward || voter.part_no || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[#6B6944] text-xs uppercase block mb-0.5">Page No.</span>
                                    <span className="font-bold text-[#1E2A42]">{voter.page_number || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[#6B6944] text-xs uppercase block mb-0.5">Age</span>
                                    <span className="font-bold text-[#1E2A42]">{voter.age}</span>
                                  </div>
                                  <div>
                                    <span className="text-[#6B6944] text-xs uppercase block mb-0.5">Gender</span>
                                    <span className="capitalize font-bold text-[#1E2A42]">
                                      {voter.gender === 'male' ? t('gender_male') : voter.gender === 'female' ? t('gender_female') : voter.gender}
                                    </span>
                                  </div>
                                  <div className="col-span-2 font-['Lora']">
                                    <span className="text-[#6B6944] text-xs uppercase block mb-0.5 font-['Courier_Prime']">
                                      Relative ({voter.relative_type})
                                    </span>
                                    <span className="font-bold text-[#1E2A42]">{voter.relative_name_hi}</span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-[#6B6944] text-xs uppercase block mb-0.5">House No.</span>
                                    <span className="font-bold text-[#1E2A42]">{voter.house_number}</span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-[#6B6944] text-xs uppercase block mb-0.5">Source File</span>
                                    <span className="text-xs text-[#4A4536] break-all">{voter.source_file || '-'}</span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                    ) : (
                      <tr>
                        <td colSpan={12} className="px-6 py-16 text-center font-['Courier_Prime'] text-[#4A4536]">
                          {loading ? 'SEARCHING ARCHIVES...' : 'NO RECORDS FOUND IN CURRENT FILE.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-[#E1D7BC] border border-[#1E2A42] font-['Courier_Prime'] shadow-[3px_3px_0_rgba(30,42,66,1)]">
                <div className="text-xs text-[#4A4536]">
                  Showing Page <strong className="text-[#1E2A42]">{currentPage}</strong> of{' '}
                  <strong className="text-[#1E2A42]">{totalPages}</strong> ({totalResultItems} voters)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage <= 1 || loading}
                    onClick={() => fetchResults(query, searchType, ward, currentPage - 1)}
                    className="px-3 py-1.5 bg-[#E9E1CC] border border-[#1E2A42] text-[#1E2A42] text-xs font-bold disabled:opacity-40 hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    &larr; Prev
                  </button>
                  <span className="px-3 py-1.5 bg-[#1E2A42] text-[#E9E1CC] text-xs font-bold font-mono">
                    {currentPage}
                  </span>
                  <button
                    disabled={currentPage >= totalPages || loading}
                    onClick={() => fetchResults(query, searchType, ward, currentPage + 1)}
                    className="px-3 py-1.5 bg-[#E9E1CC] border border-[#1E2A42] text-[#1E2A42] text-xs font-bold disabled:opacity-40 hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Database Stats Modal */}
      <DatabaseStatsModal isOpen={showStatsModal} onClose={() => setShowStatsModal(false)} />

      {/* Slips / Gali Reports Modal */}
      <DownloadReportsModal isOpen={showReportsModal} onClose={() => setShowReportsModal(false)} />

      {/* Voter Oath Modal */}
      {showOath && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#24211A]/85 backdrop-blur-sm p-4">
          <div className="bg-[#E9E1CC] border-4 border-double border-[#1E2A42] max-w-md w-full p-6 shadow-[8px_8px_0_rgba(30,42,66,1)] relative font-['Courier_Prime']">
            <h2 className="text-2xl font-['Fraunces'] font-black text-[#1E2A42] mb-3 flex items-center gap-2">
              <span className="text-[#A2382B]">⚠</span> {t('oath_title', 'जनहित घोषणा व शपथ')}
            </h2>
            <div className="text-sm text-[#4A4536] space-y-4 mb-6 leading-relaxed font-['Lora']">
              <p>
                {t(
                  'oath_p1',
                  'यह पोर्टल केवल सार्वजनिक मतदाता जागरूकता और सुविधा के लिए है। यह किसी भी चुनाव आयोग का आधिकारिक पोर्टल नहीं है।'
                )}
              </p>
              <p>
                {t(
                  'oath_p2',
                  'डेटा का दुरुपयोग या अनधिकृत थोक निष्कर्षण पूर्णतः वर्जित है। आगे बढ़कर आप इन शर्तों से सहमत होते हैं।'
                )}
              </p>
            </div>
            <button
              onClick={acceptOath}
              className="w-full py-3 bg-[#1E2A42] text-[#E9E1CC] font-bold text-sm tracking-widest hover:bg-[#A2382B] transition-colors border-2 border-[#1E2A42] shadow-[2px_2px_0_rgba(107,105,68,1)] uppercase cursor-pointer"
            >
              {t('oath_accept_btn', 'मैं सहमत हूँ (I Agree)')}
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
