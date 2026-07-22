"use client";

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trophy, ShieldCheck, Lock, BadgeCheck } from 'lucide-react';

const TRENDING_TAGS = [
  'Mechanical', 'CSE', 'Electrical', 'Electrical',
  'Civil', 'Robotics Club', 'SAE', 'Robotics Club', 
  'Internships', 'Placements', 'Internships'
];

const RightSidebar = () => {
  const { user } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col h-screen sticky top-0 py-6 pl-4 border-l border-white/5 space-y-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      
      {/* Honor Points Widget */}
      <div className="bg-[#1A1B22] border border-white/5 rounded-2xl p-6 relative overflow-hidden shrink-0">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] font-bold text-white/40 tracking-wider uppercase">HONOR POINTS</span>
          <Trophy size={14} className="text-[#E8B82F]" />
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-3 mb-6">
          <h2 className="text-5xl font-bold text-white tracking-tight">2,480</h2>
          <div className="flex items-center gap-1.5 bg-[#E8B82F]/10 border border-[#E8B82F]/20 px-3 py-1 rounded-full">
            <span className="text-[10px] font-bold text-[#E8B82F] uppercase tracking-wider">Brainiac 🧠</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-[#C4C5D5] font-medium">
            <span>Progress to Pathfinder</span>
            <span className="text-[#B6C4FF]">82%</span>
          </div>
          <div className="h-1 w-full bg-[#2A2B33] rounded-full overflow-hidden">
            <div className="h-full bg-[#B6C4FF] rounded-full" style={{ width: '82%' }}></div>
          </div>
          <p className="text-[10px] text-[#FFC300] text-center mt-3 pt-2">+15 from Best Answer in "Distributed Systems"</p>
        </div>
      </div>

      {/* Trending Tags Widget */}
      <div className="bg-[#1A1B22] border border-white/5 rounded-2xl p-6 shrink-0">
        <span className="text-[11px] font-medium text-white/40 tracking-wider uppercase mb-4 block">TRENDING TAGS</span>
        <div className="flex flex-wrap gap-3">
          {TRENDING_TAGS.map((tag, idx) => (
            <span 
              key={idx} 
              className="text-[12px] font-medium text-[#C4C5D5] bg-transparent border border-[#33343C] hover:border-white/20 hover:bg-white/5 transition-colors px-4 py-2 rounded-xl cursor-pointer"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Get Verified Widget */}
      <div className="bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#1C2136] via-[#1A1B22] to-[#1A1B22] border border-white/5 rounded-2xl p-6 space-y-4 shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-[#8FAAFF]" />
          <span className="text-[14px] font-bold text-white">Get Verified</span>
        </div>
        <p className="text-[11px] text-white/60 leading-relaxed pr-2">
          Unlock verified badge, full community access, anonymous discussions, and more.
        </p>
        <div className="flex gap-3 pt-2">
          <button 
            onClick={() => alert('Verification Gateway coming soon!')}
            className="bg-[#0033A0] hover:bg-[#002B8A] text-white text-[13px] font-medium px-6 py-2 rounded-lg transition-colors shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.1)]"
          >
            Verify Now
          </button>
          <button 
            onClick={() => alert('Maybe later!')}
            className="bg-transparent border border-[#33343C] hover:bg-white/5 text-white text-[13px] font-medium px-5 py-2 rounded-lg transition-colors"
          >
            Later
          </button>
        </div>
      </div>

      {/* Verified Student Widget (Revealed from Mockup) */}
      <div className="bg-[#1A1B22] border border-white/5 rounded-2xl p-6 space-y-4 shrink-0">
        <div className="flex items-center gap-2">
          <BadgeCheck size={18} className="text-[#FFC300]" fill="currentColor" stroke="#1A1B22" strokeWidth={2} />
          <span className="text-[14px] font-bold text-white">Verified Student</span>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] text-white/60">Your account is currently linked to</p>
          <p className="text-[12px] font-semibold text-white truncate">arivers@cs.stanford.edu</p>
        </div>
        <div className="bg-[#111216] border border-white/5 rounded-xl p-3 flex gap-2.5 items-start mt-2">
          <Lock size={12} className="text-white/40 shrink-0 mt-0.5" />
          <p className="text-[9px] text-white/40 leading-[1.4] tracking-wide">
            Verification details locked. Contact support to change.
          </p>
        </div>
      </div>
      
    </aside>
  );
};

export default RightSidebar;
