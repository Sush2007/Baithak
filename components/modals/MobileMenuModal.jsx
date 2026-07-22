"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bookmark, Calendar, Settings, HelpCircle, Info, X } from 'lucide-react';

const MENU_ITEMS = [
  { label: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
  { label: 'Events', href: '/events', icon: Calendar },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Support', href: '/support', icon: HelpCircle },
  { label: 'About Us', href: '/about-us', icon: Info },
];

export default function MobileMenuModal({ isOpen, onClose }) {
  const pathname = usePathname();

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full bg-[#1A1B22] rounded-t-3xl border-t border-white/10 shadow-2xl pb-safe animate-slide-up">
        
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2" onClick={onClose}>
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">Menu</h2>
          <button 
            onClick={onClose}
            className="text-white/50 hover:text-white p-1 rounded-full bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation List */}
        <div className="px-4 py-4 space-y-1 mb-6">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-[#1C2136] text-white font-medium' 
                    : 'text-[#8E909E] hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#0052FF] rounded-l-full" />
                )}
                <item.icon size={20} className={isActive ? 'text-[#0052FF]' : 'group-hover:scale-110 transition-transform'} />
                <span className="text-base">{item.label}</span>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}
