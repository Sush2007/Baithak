"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function MobileHeader() {
  const { profile } = useAuth();

  return (
    <header className="md:hidden sticky top-0 z-40 bg-[#0C0E14]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between w-full">
      <Link href="/dashboard" className="flex items-center">
        <Image 
          src="/logo.png" 
          alt="Baithak" 
          width={90} 
          height={30} 
          className="object-contain" 
          priority 
        />
      </Link>
      
      <Link href="/profile" className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-[#1A1B22] flex items-center justify-center">
        {profile?.avatar_url ? (
          <Image src={profile.avatar_url} alt="Profile" fill className="object-cover" />
        ) : (
          <span className="text-sm">👤</span>
        )}
      </Link>
    </header>
  );
}
