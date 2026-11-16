'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export interface AccessNoticeProps {
  variant?: 'warning' | 'error' | 'lock' | 'empty';
  title?: string;
  message?: string;
  code?: string;
  showContact?: boolean;
  whatsappMessage?: string;
  className?: string;
}

const DEVELOPER_PHONE = '+918890106858';
const DEVELOPER_PHONE_DISPLAY = '+91 8890106858';

export default function AccessNotice({
  variant = 'warning',
  title,
  message,
  code,
  showContact = true,
  whatsappMessage = 'Hello Developer, I need assistance with my account access.',
  className = '',
}: AccessNoticeProps) {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const defaultTitles: Record<string, string> = {
    warning: isHi ? 'सक्रिय सशुल्क खाता: क्षेत्र असाइन नहीं किया गया' : 'PAID ACCOUNT ACTIVE: NO AREAS ASSIGNED',
    error: isHi ? 'एक्सेस प्रतिबंध / त्रुटि' : 'ACCESS RESTRICTED',
    lock: isHi ? 'प्रीमियम एक्सेस लॉक है' : 'SUBSCRIPTION REQUIRED',
    empty: isHi ? 'कोई रिकॉर्ड नहीं मिला' : 'NO RECORDS FOUND',
  };

  const defaultMessages: Record<string, string> = {
    warning: isHi
      ? 'आपका सशुल्क खाता सक्रिय है, लेकिन डेटाबेस में अभी तक कोई वार्ड या क्षेत्र असाइन नहीं किया गया है। सहायता हेतु तुरंत डेवलपर से संपर्क करें:'
      : 'Your account is Paid, but no specific wards or areas have been assigned in the database yet. Please contact developer to get help:',
    error: isHi
      ? 'डेटा फेच करने में समस्या आई है। यदि आप एक सशुल्क उपयोगकर्ता हैं, तो सहायता हेतु डेवलपर से संपर्क करें:'
      : 'Unable to fetch data. If you are a paid user and facing permission issues, contact developer to get help in that:',
    lock: isHi
      ? 'यह सुविधा केवल अधिकृत अभियान कार्यकर्ताओं और व्यवस्थापकों के लिए उपलब्ध है।'
      : 'This feature is reserved for authorized campaign field workers and administrators.',
    empty: isHi
      ? 'चयनित फिल्टर के लिए कोई रिकॉर्ड नहीं मिला। यदि डेटा मिसिंग है, तो डेवलपर से संपर्क करें:'
      : 'No records matched your selection. If you believe data is missing, contact developer to get help in that:',
  };

  const currentTitle = title || defaultTitles[variant];
  const currentMessage = message || defaultMessages[variant];

  // Visual styling variants adhering strictly to the brutalist archive aesthetic (No emojis)
  const variantStyles = {
    warning: {
      bg: 'bg-[#FFF3CD]',
      border: 'border-[#856404]',
      badge: 'NOTICE',
      titleColor: 'text-[#A2382B]',
      shadow: 'shadow-[3px_3px_0_rgba(133,100,4,0.25)]',
    },
    error: {
      bg: 'bg-[#FDE8E8]',
      border: 'border-[#A2382B]',
      badge: 'ERROR',
      titleColor: 'text-[#A2382B]',
      shadow: 'shadow-[3px_3px_0_rgba(162,56,43,0.2)]',
    },
    lock: {
      bg: 'bg-[#E1D7BC]',
      border: 'border-[#1E2A42]',
      badge: 'RESTRICTED',
      titleColor: 'text-[#1E2A42]',
      shadow: 'shadow-[3px_3px_0_rgba(30,42,66,0.2)]',
    },
    empty: {
      bg: 'bg-[#E1D7BC]',
      border: 'border-[#1E2A42]',
      badge: 'INFO',
      titleColor: 'text-[#4A4536]',
      shadow: 'shadow-[2px_2px_0_rgba(30,42,66,0.15)]',
    },
  }[variant];

  const waLink = `https://wa.me/918890106858?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div
      className={`border-2 ${variantStyles.border} ${variantStyles.bg} ${variantStyles.shadow} p-4 sm:p-5 font-['Courier_Prime'] ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 font-bold text-sm sm:text-base tracking-wide">
            <span className="text-[10px] px-1.5 py-0.5 bg-[#1E2A42] text-[#E9E1CC] uppercase font-mono font-bold tracking-widest">
              {variantStyles.badge}
            </span>
            <span className={variantStyles.titleColor}>{currentTitle}</span>
            {code && (
              <span className="text-[10px] px-1.5 py-0.5 bg-black/10 border border-black/20 text-[#1E2A42] uppercase font-mono">
                {code}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm mt-1 text-[#24211A] font-['Lora'] leading-relaxed">
            {currentMessage}{' '}
            {showContact && (
              <strong className="text-[#A2382B] font-bold font-['Courier_Prime'] whitespace-nowrap">
                {DEVELOPER_PHONE_DISPLAY}
              </strong>
            )}
          </p>
        </div>

        {showContact && (
          <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
            <a
              href={`tel:${DEVELOPER_PHONE}`}
              className="px-3.5 py-1.5 bg-[#1E2A42] text-[#E9E1CC] font-bold text-xs uppercase shadow-[2px_2px_0_rgba(30,42,66,0.3)] hover:bg-[#A2382B] transition-all flex items-center gap-1.5 active:translate-y-[1px]"
            >
              📞 {isHi ? 'कॉल करें' : 'Call'}
            </a>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-[#25D366] text-white font-bold text-xs uppercase shadow-[2px_2px_0_rgba(37,211,102,0.3)] hover:opacity-90 transition-all flex items-center gap-1.5 active:translate-y-[1px]"
            >
              💬 WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

