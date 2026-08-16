"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trophy, ShieldCheck, Lock, BadgeCheck, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import { getCurrentHonorBadge, getNextHonorBadge } from '../../lib/badges';

const RightSidebar = () => {
  const { user, profile } = useAuth();


  return (
    <aside className="hidden lg:flex flex-col h-screen sticky top-0 py-6 pl-4 border-l border-white/5 space-y-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      
      {/* Honor Points Widget */}
      <Link href="/dashboard/honor" className="block shrink-0 group">
        <div className="bg-[#1A1B22] border border-white/5 rounded-2xl p-6 relative overflow-hidden transition-all hover:bg-[#1C2136] hover:border-white/10 cursor-pointer">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-bold text-white/40 tracking-wider uppercase group-hover:text-white/60 transition-colors">HONOR POINTS</span>
            <Trophy size={14} className="text-[#E8B82F] group-hover:scale-110 transition-transform" />
          </div>
          
          <div className="flex flex-col items-center justify-center space-y-3 mb-6">
            <h2 className="text-5xl font-bold text-white tracking-tight">
              {(profile?.lifetime_honor || 0).toLocaleString()}
            </h2>
            <div className="flex items-center gap-1.5 bg-[#E8B82F]/10 border border-[#E8B82F]/20 px-3 py-1 rounded-full">
              <span className="text-[10px] font-bold text-[#E8B82F] uppercase tracking-wider">
                {profile ? getCurrentHonorBadge(profile.lifetime_honor)?.name : 'Loading...'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            {profile && getNextHonorBadge(profile.lifetime_honor) ? (() => {
              const current = getCurrentHonorBadge(profile.lifetime_honor);
              const next = getNextHonorBadge(profile.lifetime_honor);
              const progress = Math.min(100, Math.max(0, ((profile.lifetime_honor - current.requirement) / (next.requirement - current.requirement)) * 100));
              return (
                <>
                  <div className="flex justify-between text-[11px] text-[#C4C5D5] font-medium">
                    <span>Progress to {next.name.replace(/[^a-zA-Z ]/g, '').trim()}</span>
                    <span className="text-[#B6C4FF]">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1 w-full bg-[#2A2B33] rounded-full overflow-hidden">
                    <div className="h-full bg-[#B6C4FF] rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                  </div>
                </>
              );
            })() : (
              <div className="h-1 w-full bg-[#2A2B33] rounded-full overflow-hidden">
                <div className="h-full bg-[#B6C4FF] rounded-full" style={{ width: '100%' }}></div>
              </div>
            )}
            <p className="text-[10px] text-[#FFC300] text-center mt-3 pt-2">Click to view details & history</p>
          </div>
        </div>
      </Link>


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
