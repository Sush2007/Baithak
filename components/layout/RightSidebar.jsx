"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trophy, ShieldCheck, Lock, BadgeCheck, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import HonorWidget from '../profile/HonorWidget';
import { getCurrentHonorBadge, getNextHonorBadge } from '../../lib/badges';

const RightSidebar = () => {
  const { user, profile } = useAuth();


  return (
    <aside className="hidden lg:flex flex-col h-screen sticky top-0 py-6 pl-4 border-l border-white/5 space-y-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      
      {/* Honor Points Widget */}
      <HonorWidget isOwnProfile={false} />


      {/* Get Verified Widget */}
      <div className="bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#1C2136] via-[#1A1B22] to-[#1A1B22] border border-white/5 rounded-2xl p-6 space-y-4 shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-[#8FAAFF]" />
          <span className="text-[14px] font-bold text-white">Get Verified</span>
        </div>
        <p className="text-[11px] text-white/60 leading-relaxed pr-2">
          Unlock verified badge, full community access, anonymous discussions, and more.
        </p>
        <div className="pt-2">
          <p className="text-[16px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#8FAAFF] to-[#B6C4FF] animate-pulse tracking-wide">
            Coming Soon ✨
          </p>
        </div>
      </div>


      
    </aside>
  );
};

export default RightSidebar;
