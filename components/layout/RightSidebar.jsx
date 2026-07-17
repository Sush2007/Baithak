"use client";

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trophy, ShieldCheck, Mail, Lock } from 'lucide-react';

const TRENDING_TAGS = [
  'Mechanical', 'CSE', 'Electrical', 'Electronics',
  'Civil', 'Robotics Club', 'SAE', 'Internships',
  'Placements', 'Hackathon'
];

const RightSidebar = () => {
  const { user } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col h-screen sticky top-0 py-6 pl-4 border-l border-white/5 space-y-6">
      
      {/* Honor Points Widget */}
      <div className="bg-[#1A1B22] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] font-bold text-white/50 tracking-wider uppercase">HONOR POINTS</span>
          <Trophy size={14} className="text-accent-yellow" />
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-2 mb-6">
          <h2 className="text-4xl font-bold text-white tracking-tight">2,480</h2>
          <div className="flex items-center gap-1.5 bg-accent-yellow/10 border border-accent-yellow/20 px-3 py-1 rounded-full">
            <span className="text-[10px] font-bold text-accent-yellow uppercase tracking-wider">Brainiac 🧠</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] text-white/50">
            <span>Progress to Pathfinder</span>
            <span>82%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '82%' }}></div>
          </div>
          <p className="text-[9px] text-accent-yellow text-center mt-2">+15 from Best Answer in "Distributed Systems"</p>
        </div>
      </div>

      {/* Trending Tags Widget */}
      <div className="bg-[#1A1B22] border border-white/5 rounded-2xl p-5">
        <span className="text-[10px] font-bold text-white/50 tracking-wider uppercase mb-4 block">TRENDING TAGS</span>
        <div className="flex flex-wrap gap-2">
          {TRENDING_TAGS.map((tag, idx) => (
            <span 
              key={idx} 
              className="text-[11px] font-medium text-white/70 bg-white/5 border border-white/5 hover:border-white/20 hover:text-white transition-colors px-3 py-1.5 rounded-lg cursor-pointer"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Verified Student Widget */}
      <div className="bg-[#1A1B22] border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-blue-400" />
          <span className="text-sm font-bold text-white">Get Verified</span>
        </div>
        <p className="text-[11px] text-white/50 leading-relaxed">
          Unlock verified badge, full community access, anonymous discussions, and more.
        </p>
        <div className="flex gap-2">
          <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors">
            Verify Now
          </button>
          <button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors">
            Later
          </button>
        </div>
      </div>

      {/* Already Verified State (Mocked) */}
      {/* 
      <div className="bg-[#1A1B22] border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-accent-yellow text-[#1A1B22] rounded-full flex items-center justify-center">
            <ShieldCheck size={12} className="fill-current" />
          </div>
          <span className="text-sm font-bold text-white">Verified Student</span>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] text-white/50">Your account is currently linked to</p>
          <p className="text-xs font-semibold text-white truncate">{user?.email}</p>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex gap-2">
          <Lock size={12} className="text-white/40 shrink-0 mt-0.5" />
          <p className="text-[9px] text-white/40 leading-tight">Verification details locked. Contact support to change.</p>
        </div>
      </div>
      */}
      
    </aside>
  );
};

export default RightSidebar;
