"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Home, Bell, User, BadgeCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const OpenDiscussionModal = dynamic(() => import('../modals/OpenDiscussionModal'), {
  ssr: false,
});

const MOBILE_NAV_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Profile', href: '/profile', icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { profile } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0C0E14]/80 backdrop-blur-2xl border-t border-white/5 pb-safe z-50 shadow-[0_-10px_40px_-15px_rgba(0,229,255,0.1)]">
      <div className="flex items-center justify-around px-2 py-3">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                isActive ? 'text-blue-500' : 'text-white/40 hover:text-white/80'
              }`}
            >
              {item.label === 'Profile' ? (
                <div className={`relative w-6 h-6 rounded-full overflow-hidden border ${isActive ? 'border-blue-500' : 'border-white/20'}`}>
                  {profile?.avatar_url ? (
                    <Image src={profile.avatar_url} alt="Profile" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#1A1B22] flex items-center justify-center">
                      <User size={14} className={isActive ? 'text-blue-500' : 'text-white/70'} />
                    </div>
                  )}
                </div>
              ) : (
                <item.icon size={22} className={isActive ? 'stroke-[2.5px]' : ''} />
              )}
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
