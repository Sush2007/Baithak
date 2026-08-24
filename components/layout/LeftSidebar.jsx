"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { 
  Home, User, Bell, Bookmark, Calendar, 
  Settings, HelpCircle, Info, PlusCircle, Search, BadgeCheck
} from 'lucide-react';

const OpenDiscussionModal = dynamic(() => import('../modals/OpenDiscussionModal'), {
  ssr: false,
});

const NAV_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
  { label: 'Events', href: '/events', icon: Calendar },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Support', href: '/support', icon: HelpCircle },
  { label: 'About Us', href: '/about', icon: Info },
];

const LeftSidebar = () => {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { unreadCount } = useNotifications();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <aside className="hidden md:flex flex-col h-screen sticky top-0 pt-0 pb-4 pr-4 border-r border-white/5">
      {/* Logo */}
      <div className="px-4 mb-8 mt-6 shrink-0">
        <a href="/dashboard" className="block cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          <Image src="/logo.png" alt="Baithak" width={120} height={32} className="object-contain" priority />
        </a>
      </div>

      {/* User Snippet */}
      <Link href="/profile" className="bg-[#1A1B22] border border-white/5 rounded-2xl p-3 flex items-center gap-3 mb-2 hover:bg-white/5 hover:border-white/10 transition-colors cursor-pointer group">
        <div className="relative shrink-0">
          {profile?.avatar_url ? (
             <div className="w-10 h-10 rounded-full overflow-hidden">
               <Image src={profile.avatar_url} alt="Profile" width={40} height={40} className="object-cover w-full h-full" priority />
             </div>
          ) : (
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8A2387] to-[#F27121] flex items-center justify-center text-sm">
               👤
             </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-white/90 truncate group-hover:text-white transition-colors">
            {profile?.display_name || 'Loading...'}
          </p>
          <p className="text-[12px] text-[#8E909E] truncate">@{profile?.username || 'loading'}</p>
        </div>
      </Link>

      {/* Search */}
      <Link href="/search" className="block relative mb-2 group">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E909E] group-hover:text-white transition-colors" />
        <div className="w-full bg-transparent border border-white/10 text-sm text-[#8E909E] rounded-[14px] py-2.5 pl-11 pr-4 cursor-text group-hover:border-[#0052FF]/50 group-hover:text-white transition-all">
          Search Anything...
        </div>
      </Link>

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
              <div className="relative">
                <item.icon size={20} className={isActive ? 'text-[#8FAAFF]' : 'group-hover:scale-110 transition-transform'} />
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#0C0E14]" />
                )}
              </div>
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
