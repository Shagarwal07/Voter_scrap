"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Language } from '@/utils/translations';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (keyOrEn: string, hiText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("hi");

  useEffect(() => {
    const saved = localStorage.getItem("voter-lang") as Language | null;
    if (saved === "en" || saved === "hi") {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("voter-lang", lang);
  };

  const toggleLanguage = () => {
      setLanguageState((prev) => {
        const next: Language = prev === "en" ? "hi" : "en";
        localStorage.setItem("voter-lang", next);
        return next;
      });
    };

  const t = (keyOrEn: string, hiText?: string): string => {
    const dictItem = (translations as any)[keyOrEn];
    if (dictItem && dictItem[language]) {
      return dictItem[language];
    }
    if (hiText !== undefined) {
      return language === "hi" ? hiText : keyOrEn;
    }
    return keyOrEn;
  };

      return (
          <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t }}>
            {children}
          </LanguageContext.Provider>
          );
}

          export function useLanguage() {
  const context = useContext(LanguageContext);
          if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
          return context;
}
