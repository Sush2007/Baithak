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
    <aside className="hidden md:flex flex-col h-screen sticky top-0 pt-0 pb-4 pr-4 border-r border-white/5">
      {/* Logo */}
      <div className="px-4 mb-0.5 mt-2">
        <Image src="/logo.png" alt="Baithak" width={110} height={35} className="object-contain" priority />
      </div>

      {/* User Snippet */}
      <div className="bg-[#1A1B22] border border-white/5 rounded-2xl p-3 flex items-center gap-3 mb-2">
        <div className="relative shrink-0">
          {profile?.avatar_url ? (
             <div className="w-10 h-10 rounded-full overflow-hidden">
               <Image src={profile.avatar_url} alt="Profile" width={40} height={40} className="object-cover w-full h-full" />
             </div>
          ) : (
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8A2387] to-[#F27121] flex items-center justify-center text-sm">
               👤
             </div>
          )}
          {/* Verified Badge Overlay */}
          <div className="absolute -bottom-1 -right-1 bg-[#1A1B22] rounded-full p-[2px] z-10">
            <BadgeCheck size={16} className="text-[#0052FF]" fill="currentColor" stroke="#1A1B22" strokeWidth={2} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-white/90 truncate">
            {profile?.display_name || 'Loading...'}
          </p>
          <p className="text-[12px] text-[#8E909E] truncate">@{profile?.username || 'loading'}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E909E]" />
        <input 
          type="text" 
          placeholder="Search discussions..." 
          className="w-full bg-transparent border border-white/10 text-sm text-white rounded-[14px] py-2.5 pl-11 pr-4 outline-none focus:border-[#0052FF]/50 focus:ring-1 focus:ring-[#0052FF]/50 transition-all placeholder:text-[#8E909E]"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden scrollbar-hide px-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-4 px-4 py-2 rounded-[12px] transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-[#1C2136] text-white font-medium' 
                  : 'text-[#8E909E] hover:text-white hover:bg-white/5'
              }`}
            >
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#8FAAFF] rounded-l-full shadow-[0_0_8px_rgba(143,170,255,0.8)]" />
              )}
              <item.icon size={20} className={isActive ? 'text-[#8FAAFF]' : 'group-hover:scale-110 transition-transform'} />
              <span className="text-[14px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Open a Discussion Button */}
      <div className="mt-auto pt-2">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-[#003B95] hover:bg-[#002B73] text-white font-medium py-3.5 rounded-[12px] flex items-center justify-center gap-2 transition-all"
        >
          <PlusCircle size={18} />
          <span className="text-[14px]">Open a Discussion</span>
        </button>
      </div>

      <OpenDiscussionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </aside>
  );
};

export default LeftSidebar;
