"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, User, Bell, Bookmark, Calendar, 
  Settings, HelpCircle, Info, PlusCircle, Search, BadgeCheck
} from 'lucide-react';
import OpenDiscussionModal from '../modals/OpenDiscussionModal';

const NAV_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
  { label: 'Events', href: '/events', icon: Calendar },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Support', href: '/support', icon: HelpCircle },
  { label: 'About Us', href: '/about-us', icon: Info },
];

const LeftSidebar = () => {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <aside className="hidden md:flex flex-col h-screen sticky top-0 py-6 pr-4 border-r border-white/5 space-y-6">
      {/* Logo */}
      <div className="px-4">
        <Image src="/logo.png" alt="Baithak" width={110} height={35} className="object-contain" priority />
      </div>

      {/* User Snippet */}
      <div className="bg-[#1A1B22] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
        {profile?.avatar_url ? (
           <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10">
             <Image src={profile.avatar_url} alt="Profile" fill className="object-cover" />
           </div>
        ) : (
           <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8A2387] to-[#F27121] flex items-center justify-center text-sm">
             👤
           </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate flex items-center gap-1">
            {profile?.display_name || 'Loading...'}
            <BadgeCheck size={14} className="text-blue-400" />
          </p>
          <p className="text-xs text-white/50 truncate">@{profile?.username || 'loading'}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative px-1">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input 
          type="text" 
          placeholder="Search discussions..." 
          className="w-full bg-[#1A1B22] border border-white/5 text-sm text-white rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-accent-yellow/50 transition-colors placeholder:text-white/30"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-hide px-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-600/20 to-transparent text-white font-medium' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />
              )}
              <item.icon size={18} className={isActive ? 'text-blue-500' : 'group-hover:scale-110 transition-transform'} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Open a Discussion Button */}
      <div className="px-1 mt-auto">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
        >
          <PlusCircle size={18} />
          <span>Open a Discussion</span>
        </button>
      </div>

      <OpenDiscussionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </aside>
  );
};

export default LeftSidebar;
