"use client";

import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/context/LanguageContext";
import { ElectionProvider } from "@/context/ElectionContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <ElectionProvider>
          {children}
        </ElectionProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
