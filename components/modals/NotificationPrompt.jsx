"use client";
import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

export default function NotificationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Ensure we are in a browser environment
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    
    // Check if permission is default (neither granted nor denied yet)
    const permission = Notification.permission;
    // Use sessionStorage so it only shows once per "visit" (browser session)
    const seenThisSession = sessionStorage.getItem('notif_prompt_seen');
    
    if (permission === 'default' && !seenThisSession) {
      // Add a small delay so it doesn't instantly block them on load
      const timer = setTimeout(() => setShow(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notifications enabled!');
        // Optional: subscribe them to Web Push here if implemented
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      closePrompt();
    }
  };

  const closePrompt = () => {
    sessionStorage.setItem('notif_prompt_seen', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-[#1A1B22] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
        <button 
          onClick={closePrompt}
          className="absolute top-3 right-3 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-1.5 transition-colors"
        >
          <X size={18} />
        </button>
        
        <div className="w-12 h-12 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] flex items-center justify-center mb-4 mx-auto border border-[#00E5FF]/30 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
          <Bell size={24} className="animate-pulse" />
        </div>
        
        <h3 className="text-xl font-bold text-white text-center mb-2">Turn on Notifications</h3>
        <p className="text-sm text-[#8E909E] text-center mb-6">
          Never miss out on replies, @mentions, and new connections! Enable notifications to stay updated.
        </p>
        
        <div className="flex flex-col gap-2">
          <button 
            onClick={handleEnable}
            className="w-full py-2.5 bg-[#0052FF] hover:bg-[#0042D0] text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-[#0052FF]/20"
          >
            Allow Notifications
          </button>
          <button 
            onClick={closePrompt}
            className="w-full py-2.5 bg-transparent text-white/50 hover:text-white font-medium rounded-xl transition-colors"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
