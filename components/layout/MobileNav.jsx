"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Menu, Bell, User } from 'lucide-react';
import MobileMenuModal from '../modals/MobileMenuModal';

const MOBILE_NAV_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Menu', href: '#menu', icon: Menu },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Profile', href: '/profile', icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0C0E14]/90 backdrop-blur-xl border-t border-white/5 pb-safe z-50">
        <div className="flex items-center justify-around px-2 py-3">
          {MOBILE_NAV_ITEMS.map((item) => {
            if (item.label === 'Menu') {
              return (
                <button 
                  key={item.label}
                  onClick={() => setIsMenuOpen(true)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                    isMenuOpen ? 'text-blue-500' : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  <item.icon size={22} className={isMenuOpen ? 'stroke-[2.5px]' : ''} />
                  <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                </button>
              );
            }

            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                  isActive ? 'text-blue-500' : 'text-white/40 hover:text-white/80'
                }`}
              >
                <item.icon size={22} className={isActive ? 'stroke-[2.5px]' : ''} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <MobileMenuModal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
