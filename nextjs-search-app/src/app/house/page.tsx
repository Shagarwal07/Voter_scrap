'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useElection } from '@/context/ElectionContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSession } from 'next-auth/react';
import ElectionToggle from '@/components/ElectionToggle';
import LanguageToggle from '@/components/LanguageToggle';
import Footer from '@/components/Footer';
import { ReactTransliterate } from 'react-transliterate';
import { checkSuperUser } from '@/utils/auth';

export default function HouseSearch() {
  const { data: session } = useSession();
  const { election, isVidhanSabha } = useElection();
  const { language, t } = useLanguage();

  const [mapping, setMapping] = useState<Record<string, string[]>>({});
  const [metaLoading, setMetaLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [block, setBlock] = useState('');
  const [gali, setGali] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const role = session?.user?.role;
  const tier = session?.user?.subscription_tier;
  const { isSuperUser } = checkSuperUser(session?.user);
  const isPaid = role === 'paid' || tier === 'paid';
  // Unpaid or guest: lock & blur with subscription alert
  const isLocked = !isSuperUser && !isPaid;

  const formatSlipLabel = (val: string) => {
    if (!val) return val;
    if (language === 'hi') {
      return val.replace(/Part\s*/gi, 'भाग ').replace(/Slip\s*/gi, 'पर्ची ');
    } else {
      return val.replace(/भाग\s*/gi, 'Part ').replace(/पर्ची\s*/gi, 'Slip ');
    }
  };

  const formatBatchLabel = (val: string) => {
    if (!val) return val;
    if (language === 'hi') {
      return val.replace(/House\s*/gi, 'मकान ');
    } else {
      return val.replace(/मकान\s*/gi, 'House ');
    }
  };

  // Fetch dynamic blocks/slips and houses mapping whenever election mode changes
  useEffect(() => {
    setBlock('');
    setGali('');
    setResults([]);
    setApiError(null);
    setHasSearched(false);
    setMetaLoading(true);

    fetch(`/api/houses?meta=true&election=${election}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.mapping) {
          setMapping(json.mapping);
          const keys = Object.keys(json.mapping);
          if (keys.length === 1) {
            setBlock(keys[0]);
          }
        }
      })
      .catch((err) => console.error('Failed to load houses mapping', err))
      .finally(() => setMetaLoading(false));
  }, [election]);

  const fetchResults = async (searchQuery: string, searchBlock: string, searchGali: string) => {
    if (isLocked) return;
    setLoading(true);
    setHasSearched(true);
    setApiError(null);

    try {
      const queryParams = new URLSearchParams({
        q: searchQuery,
        election: election,
      });
      if (searchBlock) queryParams.append('block', searchBlock);
      if (searchGali) queryParams.append('gali', searchGali);

      const res = await fetch(`/api/houses?${queryParams.toString()}`);
      const json = await res.json();

      if (json.success) {
        setResults(json.data);
      } else {
        setApiError(json.error || 'An unexpected error occurred.');
        setResults([]);
      }
    } catch (err) {
      console.error(err);
      setResults([]);
    }
    setLoading(false);
  };

  const handleBlockChange = (selectedBlock: string) => {
    setBlock(selectedBlock);
    setGali('');
    setApiError(null);
    setResults([]);
    setHasSearched(false);
  };

  const handleGaliChange = (selectedGali: string) => {
    setGali(selectedGali);
    setApiError(null);
    setResults([]);
    setHasSearched(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    if (!query.trim() && !block && !gali) {
      setApiError('EMPTY_FILTER');
      setResults([]);
      return;
    }
    fetchResults(query, block, gali);
  };

  return (
    <div className="w-full flex-1 bg-[#E9E1CC] text-[#24211A] font-['Lora'] px-4 sm:px-6 md:px-10 py-8 md:py-12 pt-16 md:pt-22 relative">
      {/* Real-time Global Activity Progress Beam */}
      {(loading || metaLoading) && (
        <div className="fixed top-[38px] md:top-[50px] left-0 right-0 h-1 z-50 overflow-hidden bg-transparent pointer-events-none">
          <div className="h-full bg-gradient-to-r from-[#22c55e] via-[#A2382B] to-[#22c55e] animate-pulse w-full"></div>
        </div>
      )}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500;1,9..144,600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Courier+Prime:wght@400;700&display=swap');
      `,
        }}
      />

      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-[2px] border-[#1E2A42] pb-6">
          <div>
            {/* Top Navigation Breadcrumb */}
            <div className="flex items-center gap-2 mb-3 font-['Courier_Prime'] text-xs sm:text-sm font-bold text-[#A2382B]">
              <Link href="/" className="hover:underline flex items-center gap-1">
                <span>&larr;</span> {t('btn_main_search')}
              </Link>

              <span>/</span>
              <span className="text-[#1E2A42]">{language === 'hi' ? 'मकान व गली खोज' : 'Household & Street Finder'}</span>
            </div>

            <h1 className="font-['Fraunces'] font-semibold text-3xl md:text-5xl text-[#1E2A42] tracking-tight leading-none mb-3">
              <span className="text-[#A2382B]">{language === 'hi' ? 'मकान' : 'Household'}</span> {language === 'hi' ? 'व गली खोज' : '& Street Finder'}
            </h1>
            <p className="font-['Courier_Prime'] text-sm md:text-base text-[#4A4536] max-w-xl">
              {isVidhanSabha
                ? t(
                    'Find voter families by polling slip and house number for door-to-door campaigning.',
                    'घर-घर संपर्क हेतु मतदान पर्ची व मकान नंबर अनुसार मतदाता परिवार खोजें।'
                  )
                : t(
                    'Find voter families by street (gali) and house number for door-to-door campaigning.',
                    'घर-घर संपर्क हेतु गली व मकान नंबर अनुसार मतदाता परिवार खोजें।'
                  )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
          </div>
        </header>

        {/* Clean Election Segmented Control */}
        <div className="mb-8 font-['Courier_Prime']">
          <ElectionToggle />
        </div>

        <main className="relative min-h-[400px] pb-2">
          {/* Authentic Vercel-Backup Style Lock Blur Overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-[#E9E1CC]/70 backdrop-blur-md z-30 flex items-center justify-center p-4">
              <div className="bg-[#E9E1CC] border-4 border-double border-[#1E2A42] max-w-md w-full p-6 sm:p-8 shadow-[8px_8px_0_rgba(30,42,66,1)] text-center relative font-['Courier_Prime']">
                <div className="w-12 h-12 bg-[#A2382B]/10 border-2 border-[#A2382B] rounded-full flex items-center justify-center mx-auto mb-3 shadow-[2px_2px_0_rgba(162,56,43,1)]">
                  <svg className="w-6 h-6 text-[#A2382B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-['Fraunces'] font-black text-xl sm:text-2xl text-[#1E2A42] mb-2 uppercase tracking-tight">
                  {language === 'hi' ? 'प्रीमियम मकान खोज लॉक है' : 'Subscription Required'}
                </h3>
                <p className="text-xs sm:text-sm font-['Lora'] text-[#4A4536] max-w-sm mx-auto mb-4 leading-relaxed">
                  {language === 'hi'
                    ? 'मकान व वार्ड पर्चियां देखने के लिए डेवलपर से अपना खाता सक्रिय करवाएं।'
                    : 'Access to household clusters is locked. Contact developer to activate your account.'}
                </p>
                {!session ? (
                  <button
                    onClick={() => (window.location.href = '/login')}
                    className="w-full py-3 bg-[#1E2A42] text-[#E9E1CC] font-bold text-xs uppercase tracking-widest hover:bg-[#A2382B] transition-colors border-2 border-[#1E2A42] shadow-[3px_3px_0_rgba(30,42,66,1)] active:translate-y-[1px] cursor-pointer"
                  >
                    {language === 'hi' ? 'लॉगिन करें (Sign In with Google)' : 'Sign In with Google'}
                  </button>
                ) : (
                  <div className="pt-2 flex items-center justify-center gap-2.5 flex-wrap">
                    <a
                      href="tel:+918890106858"
                      className="px-4 py-2 bg-[#1E2A42] text-[#E9E1CC] font-bold text-xs uppercase hover:bg-[#A2382B] transition-colors border border-[#1E2A42] shadow-[2px_2px_0_rgba(30,42,66,0.3)] flex items-center gap-1.5 cursor-pointer"
                      >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> +91 8890106858
                      </a>
                    <a
                      href={`https://wa.me/918890106858?text=${encodeURIComponent(`Hello Developer, please activate house search access for my account: ${session.user?.email || ''}`)}`}
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


          <section className="bg-[#D8CCA9] border border-[#1E2A42] p-6 md:p-8 mb-10 shadow-[6px_6px_0_rgba(30,42,66,0.15)] relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#A2382B]"></div>

            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <ReactTransliterate
                    value={query}
                    onChangeText={(text) => {
                      setQuery(text);
                      if (apiError) setApiError(null);
                    }}
                    lang="hi"
                    placeholder={t('house_member_placeholder')}  
                    containerClassName={`w-full ${query.length === 0 ? "hide-suggestions" : ""}`}
                    className="w-full bg-[#E9E1CC] border-[1.5px] border-[#1E2A42] px-4 py-3.5 font-['Courier_Prime'] text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[#A2382B] focus:border-transparent rounded-none"
                  />
                </div>

                {/* Primary Selector: Block in Nagar Parishad, Slip in Vidhan Sabha */}
                <div className="md:w-1/4 relative">
                  <select
                    value={block}
                    onChange={(e) => {
                      handleBlockChange(e.target.value);
                    }}
                    className="w-full bg-[#E9E1CC] border-[1.5px] border-[#1E2A42] px-4 py-3.5 font-['Courier_Prime'] text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[#A2382B] focus:border-transparent rounded-none appearance-none"
                  >
                    <option value="">{isVidhanSabha ? t('all_slips', 'सभी पर्चियाँ') : t('all_blocks', 'सभी ब्लॉक')}</option>
                    {Object.keys(mapping).map((b) => (
                      <option key={b} value={b}>
                        {isVidhanSabha ? formatSlipLabel(b) : b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Secondary Selector: Gali in Nagar Parishad, House Segment in Vidhan Sabha */}
                <div className="md:w-1/4 relative">
                  <select
                    value={gali}
                    onChange={(e) => handleGaliChange(e.target.value)}
                    disabled={!block}
                    className="w-full bg-[#E9E1CC] border-[1.5px] border-[#1E2A42] px-4 py-3.5 font-['Courier_Prime'] text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[#A2382B] focus:border-transparent rounded-none appearance-none disabled:opacity-50"
                  >
                    <option value="">
                      {block
                        ? isVidhanSabha
                          ? t('all_houses_in_slip', 'पर्ची के सभी मकान')
                          : t('all_galis', 'सभी गलियाँ')
                        : isVidhanSabha
                        ? t('select_slip_first', 'पहले पर्ची चुनें')
                        : t('select_block_first', 'पहले ब्लॉक चुनें')}
                    </option>
                    {block &&
                      mapping[block] &&
                      mapping[block].map((g) => (
                        <option key={g} value={g}>
                          {isVidhanSabha ? formatBatchLabel(g) : g}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || isLocked}
                className="px-8 py-3.5 font-['Courier_Prime'] font-bold text-base md:text-lg bg-[#1E2A42] text-[#E9E1CC] shadow-[4px_4px_0_rgba(162,56,43,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_rgba(162,56,43,1)] transition-all disabled:opacity-60 flex-shrink-0 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed select-none"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-[#E9E1CC]" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>{t('searching')}</span>
                  </>
                ) : isVidhanSabha ? (
                  t('btn_search_house_segments')
                ) : (
                  t('btn_search_house')
                )}
              </button>
            </form>
          </section>

          {loading && (
            <div className="py-16 text-center font-['Courier_Prime'] text-[#1E2A42] bg-[#E1D7BC] border-2 border-[#1E2A42] shadow-[4px_4px_0_rgba(30,42,66,1)] mb-8">
              <svg className="animate-spin h-8 w-8 text-[#A2382B] mx-auto mb-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <p className="font-bold text-sm uppercase tracking-wider">{t('searching')}</p>
            </div>
          )}

          {apiError && (
            <div className="mb-6 p-3 sm:p-3.5 bg-[#FFF3CD] border-2 border-[#856404] text-[#856404] font-['Courier_Prime'] text-xs sm:text-sm font-bold flex items-center justify-between shadow-[2px_2px_0_rgba(133,100,4,1)] animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-[#856404] text-white text-[10px] uppercase tracking-wider font-mono">
                  {language === 'hi' ? 'सूचना' : 'HINT'}
                </span>
                <span>
                  {apiError === 'EMPTY_FILTER'
                    ? language === 'hi'
                      ? (isVidhanSabha ? 'कृपया ऊपर "सभी पर्चियाँ" फिल्टर पर क्लिक करें।' : 'कृपया ऊपर "सभी ब्लॉक" फिल्टर पर क्लिक करें।')
                      : (isVidhanSabha ? 'Click on "ALL SLIPS" filter above to select.' : 'Click on "ALL BLOCKS" filter above to select.')
                    : apiError}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setApiError(null)}
                className="text-[#856404] hover:text-black text-lg font-black ml-3 cursor-pointer select-none leading-none"
                aria-label="Dismiss"
              >
                &times;
              </button>
            </div>
          )}

          {/* Results Section (Or Blurred Sample Card Under Lock) */}
          {results.length > 0 ? (
            <section className="space-y-12">
              {results.map((house) => (
                <div key={house.id} className="bg-[#E1D7BC] border border-[#1E2A42] shadow-[5px_5px_0_rgba(30,42,66,0.12)] overflow-hidden">
                  <div className="bg-[#1E2A42] text-[#E9E1CC] p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="font-['Fraunces'] font-semibold text-xl sm:text-2xl m-0 flex flex-wrap items-center gap-2 leading-tight">
                        <span className="px-2 py-0.5 bg-[#A2382B] text-white text-xs sm:text-sm font-['Courier_Prime'] font-bold rounded-none border border-white/20 uppercase whitespace-nowrap shadow-sm">
                          {isVidhanSabha ? formatSlipLabel(house.slip_label || house.block) : house.block || house.slip_label}
                        </span>

                        <span>{isVidhanSabha ? formatBatchLabel(house.house_name) : house.house_name}</span>
                      </h2>
                      <div className="font-['Courier_Prime'] text-[11px] sm:text-xs mt-2 text-[#D8CCA9] uppercase tracking-wider flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>{isVidhanSabha ? formatBatchLabel(house.batch_label || house.gali) : house.gali || house.batch_label}</span>
                        {house.total_members && (
                          <>
                            <span>&bull;</span>
                            <span className="text-white font-bold">
                              {house.total_members} {t('members_count')}
                            </span>
                          </>
                        )}
                        {house.house_number && (
                          <>
                            <span>&bull;</span>
                            <span>
                              {t('th_house_no')}: {house.house_number}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {house.mobile_number && (
                    <a
                        href={`tel:${house.mobile_number}`}
                        className="inline-flex items-center gap-2 bg-[#A2382B] px-4 py-2 font-['Courier_Prime'] font-bold text-sm shadow-[3px_3px_0_rgba(233,225,204,0.3)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[2px_2px_0_rgba(233,225,204,0.3)] transition-all"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg><span>{house.mobile_number}</span>
                      </a>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="uppercase tracking-widest border-b-[2px] border-[#1E2A42] bg-[#D8CCA9] text-[#1E2A42] font-['Courier_Prime'] text-xs">
                        <tr>
                          <th scope="col" className="px-6 py-4 font-bold text-center">
                            {isVidhanSabha ? t('th_part') : t('th_ward')}
                          </th>
                          <th scope="col" className="px-6 py-4 font-bold">
                            {t('th_serial_no')}
                          </th>
                          <th scope="col" className="px-4 md:px-6 py-4 font-bold">
                            {t('th_name')}
                          </th>
                          <th scope="col" className="px-4 md:px-6 py-4 font-bold">
                            {t('th_relative_name')}
                          </th>
                          <th scope="col" className="px-6 py-4 font-bold">
                            {t('th_relation')}
                          </th>
                          <th scope="col" className="px-4 md:px-6 py-4 font-bold text-center">
                            {t('th_age')}
                          </th>
                          <th scope="col" className="px-4 md:px-6 py-4 font-bold">
                            {t('th_gender')}
                          </th>
                          <th scope="col" className="px-6 py-4 font-bold font-mono">
                            {t('th_voter_id')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#B7A97E]">
                        {house.members && house.members.length > 0 ? (
                          house.members.map((voter: any, idx: number) => {
                            const memberKey = `${voter.part_no || voter.ward || "0"}-${voter.serial_number || voter.id || idx}`;
                            return (
                            <tr key={memberKey} className="hover:bg-[#E9E1CC] transition-colors">
                              <td className="px-6 py-4 text-center font-['Courier_Prime']">
                                <span className="inline-block px-2 py-0.5 bg-[#A2382B]/10 text-[#A2382B] border border-[#A2382B] font-bold">
                                  {isVidhanSabha ? voter.part_no || voter.ward || '92' : voter.ward || '-'}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-['Courier_Prime'] text-[#1E2A42] font-bold">
                                {voter.serial_number}
                              </td>
                              <td className="px-4 md:px-6 py-4 font-bold text-[#1E2A42]">{voter.name}</td>
                              <td className="px-4 md:px-6 py-4 text-[#4A4536] font-medium">{voter.relative_name}</td>
                              <td className="px-6 py-4 text-[#6B6944] font-['Courier_Prime'] text-xs">
                                {(() => {
                                  const r = (voter.relation || voter.relative_type || '').toLowerCase().trim();
                                  if (r === 'father' || r.includes('पित')) return t('rel_father');
                                  if (r === 'husband' || r.includes('पति')) return t('rel_husband');
                                  if (r === 'mother' || r.includes('मात')) return t('rel_mother');
                                  if (r === 'other' || r.includes('अन्य')) return t('rel_other');
                                  return voter.relation || '–';
                                })()}
                              </td>
                              <td className="px-4 md:px-6 py-4 text-center font-['Courier_Prime'] font-bold text-[#1E2A42]">
                                {voter.age}
                              </td>
                              <td className="px-4 md:px-6 py-4 font-['Courier_Prime'] text-xs">
                                {(() => {
                                  const g = (voter.gender || '').toLowerCase().trim();
                                  const isMale = g === 'male' || g.includes('पु');
                                  const isFemale = g === 'female' || g.includes('महि') || g.includes('स्त्री');
                                  return (
                                    <span
                                      className={`inline-block px-2 py-0.5 font-bold border ${
                                        isMale
                                          ? 'bg-[#1E2A42]/10 text-[#1E2A42] border-[#1E2A42]'
                                          : isFemale
                                          ? 'bg-[#A2382B]/10 text-[#A2382B] border-[#A2382B]'
                                          : 'bg-[#6B6944]/10 text-[#6B6944] border-[#6B6944]'
                                      }`}
                                    >
                                      {isMale ? t('gender_male') : isFemale ? t('gender_female') : voter.gender || '–'}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="px-6 py-4 font-mono text-xs font-bold text-[#1E2A42]">
                                {voter.voter_id || '–'}
                              </td>
                            </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={8} className="px-6 py-8 text-center font-['Courier_Prime'] text-[#4A4536]">
                              No members found for this house.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </section>
          ) : isLocked ? (
            /* Blurred Sample Card for Under-Lock Aesthetics */
            <section className="space-y-6 opacity-40 select-none pointer-events-none filter blur-[1px]">
              <div className="bg-[#E1D7BC] border border-[#1E2A42] shadow-[5px_5px_0_rgba(30,42,66,0.12)] overflow-hidden">
                <div className="bg-[#1E2A42] text-[#E9E1CC] p-4 flex justify-between items-center">
                  <h2 className="font-['Fraunces'] font-medium text-xl">
                    Part 95 Slip 1 • House #01 (Agarwal Colony)
                  </h2>
                  <span className="font-['Courier_Prime'] text-xs font-bold bg-[#A2382B] px-2.5 py-1">
                    5 Members
                  </span>
                </div>
                <div className="p-4 bg-[#D8CCA9] font-['Courier_Prime'] text-xs text-[#1E2A42] space-y-2">
                  <div className="flex justify-between border-b border-[#1E2A42]/20 pb-1">
                    <span>#101 • Rakesh Agrawal (S/o Ramji Agrawal)</span>
                    <span>SSB2918231</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1E2A42]/20 pb-1">
                    <span>#102 • Sunita Agrawal (W/o Rakesh Agrawal)</span>
                    <span>SSB2918249</span>
                  </div>
                  <div className="flex justify-between">
                    <span>#103 • Shubham Agrawal (S/o Rakesh Agrawal)</span>
                    <span>SSB3829102</span>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <>
              {/* For the rest: No record means clean No Records Found (no contact prompt) */}
              {hasSearched && results.length === 0 && !loading && !apiError && (
                <div className="py-6">
                  <div className="py-10 px-4 text-center max-w-lg mx-auto my-6 font-['Courier_Prime']">
                    <p className="font-bold text-base md:text-lg text-[#1E2A42] uppercase tracking-wide">
                      {language === 'hi' ? 'कोई रिकॉर्ड नहीं मिला' : 'No Records Found'}
                    </p>
                    <p className="text-xs sm:text-sm text-[#4A4536] mt-1 font-['Lora']">
                      {language === 'hi'
                        ? 'वर्तमान चयन या खोज के लिए कोई मतदाता परिवार नहीं मिला।'
                        : 'No voter families matched your current search or selection.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Initial Guidance when dropdown has items but user hasn't queried yet */}
              {!hasSearched && results.length === 0 && !loading && !apiError && (
                <div className="py-10 px-4 text-center max-w-lg mx-auto my-6 font-['Courier_Prime']">
                  <p className="font-bold text-sm sm:text-base text-[#1E2A42] uppercase tracking-wider">
                    {isVidhanSabha
                      ? language === 'hi'
                        ? 'ऊपर "सभी पर्चियाँ" फिल्टर पर क्लिक करें'
                        : 'CLICK ON "ALL SLIPS" FILTER'
                      : language === 'hi'
                      ? 'ऊपर "सभी ब्लॉक" फिल्टर पर क्लिक करें'
                      : 'CLICK ON "ALL BLOCKS" FILTER'}
                  </p>
                  <p className="text-xs text-[#6B6944] mt-1.5 font-['Lora']">
                    {language === 'hi'
                      ? 'मतदाता परिवार देखने के लिए ब्लॉक या गली चुनें, या सीधे सदस्य का नाम लिखकर खोजें।'
                      : 'Select a block to explore voter households, or enter a member name to search.'}
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
