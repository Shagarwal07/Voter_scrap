'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user has dismissed previously
      const hasDismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!hasDismissed) {
        // Delay showing the prompt to not overwhelm on first load
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also handle when app is successfully installed
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm"
        >
          <div className="bg-[#E1D7BC] border-2 border-[#1E2A42] shadow-[8px_8px_0px_0px_rgba(30,42,66,1)] rounded-xl p-5 flex flex-col gap-4 text-[#24211A] font-lora relative overflow-hidden">
            {/* Background noise texture */}
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22140%22 height=%22140%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')] mix-blend-multiply"></div>
            
            <button 
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-[#4A4536] hover:text-[#A2382B] transition-colors p-1 z-10"
              aria-label="Close"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
            
            <div className="flex items-start gap-4 relative z-10 pt-1">
              <div className="bg-[#1E2A42] text-[#E9E1CC] w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border border-[#4A4536]">
                <span className="font-fraunces font-bold text-xl">IWS</span>
              </div>
              <div className="pr-2">
                <h3 className="font-fraunces font-bold text-lg leading-tight text-[#1E2A42]">INSTALL THE APP</h3>
                <p className="text-sm text-[#4A4536] mt-1 font-courier leading-snug">चुनावी जानकारी तक तेज़ पहुँच के लिए इस ऐप को अपनी होम स्क्रीन पर जोड़ें।</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-1 relative z-10">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-[#2F5B36] hover:bg-[#1E2A42] text-[#E9E1CC] font-courier font-bold py-2.5 px-4 rounded transition-colors flex items-center justify-center gap-2 border-2 border-[#1E2A42]"
              >
                <Download size={18} strokeWidth={2.5} />
                <span>INSTALL APP</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
