"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, Search } from 'lucide-react';
import MobileMenuModal from '../modals/MobileMenuModal';
import { useAuth } from '../../context/AuthContext';

export default function MobileHeader() {
  const { profile } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 bg-[#0C0E14]/90 backdrop-blur-xl border-b border-white/5 px-4 h-14 flex items-center justify-between w-full relative">
        {/* Menu Hamburger */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          <Menu size={24} />
        </button>
      
      {/* Centered Logo */}
      <Link href="/dashboard" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center p-1.5">
        <Image 
          src="/logo.png" 
          alt="Baithak" 
          width={100} 
          height={32} 
          className="object-contain" 
          priority 
        />
      </Link>
      
      {/* Search Icon */}
      <Link href="/search" className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors">
        <Search size={20} />
      </Link>
    </header>
    
    <MobileMenuModal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
