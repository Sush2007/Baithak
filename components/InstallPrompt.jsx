"use client";

import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user already dismissed it this session
    if (sessionStorage.getItem('baithak_install_dismissed') === 'true') {
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome from showing the generic mini-infobar
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show our custom UI
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the native install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted' || outcome === 'dismissed') {
      sessionStorage.setItem('baithak_install_dismissed', 'true');
    }

    // We no longer need the prompt. Clear it up.
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleClose = () => {
    sessionStorage.setItem('baithak_install_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 bg-[#1A1B22] border border-white/10 rounded-2xl p-4 shadow-2xl z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-tr from-[#0033A0] to-[#FFC300] rounded-xl flex items-center justify-center shrink-0 shadow-inner">
            <Download size={24} className="text-white" />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Install Baithak App</h4>
            <p className="text-[#8E909E] text-xs mt-0.5">Add to home screen for a faster, native experience.</p>
          </div>
        </div>
        <button onClick={handleClose} className="text-white/40 hover:text-white transition-colors p-1 rounded-full hover:bg-white/5">
          <X size={16} />
        </button>
      </div>
      <button 
        onClick={handleInstallClick}
        className="w-full mt-4 bg-white text-[#1A1B22] font-bold py-2.5 rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all text-sm shadow-md shadow-white/10"
      >
        Install Now
      </button>
    </div>
  );
}
