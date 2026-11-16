'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-[#E1D7BC] border-t-4 border-double border-[#1E2A42] text-[#4A4536] font-['Courier_Prime'] mt-4 sm:mt-6 relative z-20">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 md:px-8 pt-8 pb-7 flex flex-col gap-6">

        {/* Top: Platform info + Navigation */}
        <div className="flex flex-col md:flex-row justify-between w-full gap-8 md:gap-12 border-b-2 border-dashed border-[#1E2A42]/30 pb-6">

          {/* Platform Identity */}
          <div className="flex-[2] max-w-2xl">
            <div className="inline-block bg-[#1E2A42] text-[#E9E1CC] font-bold text-[9px] tracking-widest uppercase px-2 py-0.5 mb-2">
              {t('UNOFFICIAL CIVIC PORTAL', 'अनौपचारिक नागरिक पोर्टल')}
            </div>
            <h3 className="font-['Fraunces'] font-bold text-lg sm:text-xl text-[#1E2A42] mb-2">
              {t('Smart Voter Search Platform', 'स्मार्ट वोटर सर्च प्लेटफॉर्म')}
            </h3>
            <p className="text-[11px] sm:text-xs md:text-sm font-['Lora'] mb-4 text-[#1E2A42]/85 leading-relaxed">
              {t(
                'Developed for public convenience by IWS (Imposter World Services) & Shubham Agrawal ',
                'आम जनसुविधा हेतु IWS (Imposter World Services) एवं शुभम अग्रवाल '
              )}
              <span className="text-[#A2382B] font-medium">
                {t(
                  '(S/o Rakesh Ji Agrawal, Booth President, Ward No. 5 - Agrawal Colony)',
                  '(सुपुत्र राकेश जी अग्रवाल, बूथ अध्यक्ष, वार्ड नं. 5 - अग्रवाल कॉलोनी)'
                )}
              </span>
              .{' '}
              {t(
                'Fully funded & sponsored by ',
                'जनसुविधा हेतु पूर्णतः प्रायोजित एवं वित्तपोषित: '
              )}
              <a
                href="https://rkcoachingrajasthan.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#A2382B] font-bold underline hover:text-[#1E2A42] transition-colors"
              >
                RK Coaching Classes (Balotra)
              </a>
              .{' '}
              {t(
                'This tool aims to eliminate the hassle of finding voter details in massive PDFs, saving valuable time for citizens and volunteers on election day.',
                'यह टूल भारी-भरकम PDF में वोटर डिटेल्स खोजने की परेशानी को दूर करता है, जिससे चुनाव के दिन स्वयंसेवकों और नागरिकों का काफी समय बचता है।'
              )}
            </p>

            {/* Contact Numbers — 2-column grid on all screen sizes */}
            <div className="grid grid-cols-2 gap-3 text-[11px] font-bold tracking-widest text-[#1E2A42] max-w-xs">
              <div>
                <span className="text-[#A2382B] block mb-0.5 text-[9px]">
                  {t('GENERAL CONTACT', 'सामान्य संपर्क')}
                </span>
                +91 9414668795
              </div>
              <div>
                <span className="text-[#A2382B] block mb-0.5 text-[9px]">
                  {t('TECHNICAL SUPPORT', 'तकनीकी सहायता')}
                </span>
                +91 8890106858
              </div>
            </div>
          </div>

          {/* Navigation — aligned in a dedicated right column */}
          <nav className="flex-initial md:min-w-[200px] pt-0 md:pt-1">
            <span className="text-[#A2382B] text-[9px] font-bold tracking-widest uppercase block mb-3">
              {t('NAVIGATION', 'नेविगेशन')}
            </span>
            <ul className="flex flex-col gap-2.5 font-bold tracking-widest uppercase text-xs">
              <li>
                <Link
                  href="/"
                  className="text-[#1E2A42] hover:text-[#A2382B] transition-colors border-b border-transparent hover:border-[#A2382B] pb-0.5 inline-block"
                >
                  {t('Electoral Roll Search', 'मतदाता सूची खोज')}
                </Link>
              </li>
              <li>
                <Link
                  href="/house"
                  className="text-[#1E2A42] hover:text-[#A2382B] transition-colors border-b border-transparent hover:border-[#A2382B] pb-0.5 inline-block"
                >
                  {t('House & Gali Search', 'मकान व गली खोज')}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-[#1E2A42] hover:text-[#A2382B] transition-colors border-b border-transparent hover:border-[#A2382B] pb-0.5 inline-block"
                >
                  {t('About Platform', 'प्लेटफ़ॉर्म परिचय')}
                </Link>
              </li>
              <li>
                <Link
                  href="/legal"
                  className="text-[#1E2A42] hover:text-[#A2382B] transition-colors border-b border-transparent hover:border-[#A2382B] pb-0.5 inline-block"
                >
                  {t('Legal & Notices', 'कानूनी सूचनाएँ')}
                </Link>
              </li>
            </ul>
          </nav>

        </div>

        {/* Bottom copyright bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2.5 pt-1 text-[11px] sm:text-[12px] md:text-[13px] font-bold tracking-[0.08em] uppercase text-[#1E2A42]/85 text-center sm:text-left">
          <p className="leading-relaxed">
            © 2026 VOTER SEARCH PLATFORM <span className="text-[#1E2A42]/40 mx-1">•</span> DEVELOPED BY IWS <span className="text-[#1E2A42]/40 mx-1">•</span> SPONSORED BY{' '}
            <a
              href="https://rkcoachingrajasthan.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#A2382B] hover:text-[#1E2A42] underline underline-offset-4 decoration-1 decoration-[#A2382B]/60 hover:decoration-[#1E2A42] transition-colors"
            >
              RK COACHING CLASSES (BALOTRA)
            </a>
          </p>
          <p className="whitespace-nowrap text-[#1E2A42]/75">
            {t('ALL RIGHTS RESERVED', 'सर्वाधिकार सुरक्षित')}
          </p>
        </div>

      </div>
    </footer>
  );
}
