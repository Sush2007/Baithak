"use client";

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { getCurrentHonorBadge, getNextHonorBadge } from '../../lib/badges';
import Link from 'next/link';
import confetti from 'canvas-confetti';

export default function HonorWidget({ isOwnProfile = false, profileData }) {
  const { profile: currentUserProfile } = useAuth();
  const profile = profileData || currentUserProfile;
  const [showRedeem, setShowRedeem] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [redeemStatus, setRedeemStatus] = useState(''); // 'idle', 'submitting', 'success', 'error'

  if (!profile) return null;

  const currentBadge = getCurrentHonorBadge(profile.lifetime_honor);
  const nextBadge = getNextHonorBadge(profile.lifetime_honor);
  let progress = 0;
  if (currentBadge && nextBadge) {
    progress = Math.min(100, Math.max(0, ((profile.lifetime_honor - currentBadge.requirement) / (nextBadge.requirement - currentBadge.requirement)) * 100));
  } else if (currentBadge && !nextBadge) {
    progress = 100;
  }

  const canRedeem = profile.lifetime_honor >= 2000;

  const handleRedeem = async () => {
    if (!upiId.trim()) return;
    setRedeemStatus('submitting');
    
    try {
      const { error } = await supabase.from('redemption_requests').insert({
        user_id: profile.id,
        upi_id: upiId.trim(),
        honor_points: profile.lifetime_honor
      });

      if (error) throw error;
      setRedeemStatus('success');
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#00E5FF', '#FF0055', '#FFCC00']
      });
    } catch (err) {
      console.error(err);
      setRedeemStatus('error');
    }
  };

  return (
    <div className="bg-[#1A1B22] border border-white/5 rounded-2xl p-6 relative overflow-hidden transition-all hover:bg-[#1C2136] hover:border-white/10">
      <Link href="/dashboard/honor" className="block cursor-pointer group mb-4">
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
              {currentBadge ? currentBadge.name : 'Loading...'}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          {nextBadge ? (
            <>
              <div className="flex justify-between text-[11px] text-[#C4C5D5] font-medium">
                <span>Progress to {nextBadge.name.replace(/[^a-zA-Z ]/g, '').trim()}</span>
                <span className="text-[#B6C4FF]">{Math.round(progress)}%</span>
              </div>
              <div className="h-1 w-full bg-[#2A2B33] rounded-full overflow-hidden">
                <div className="h-full bg-[#B6C4FF] rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
              </div>
            </>
          ) : (
            <div className="h-1 w-full bg-[#2A2B33] rounded-full overflow-hidden">
              <div className="h-full bg-[#B6C4FF] rounded-full" style={{ width: '100%' }}></div>
            </div>
          )}
        </div>
      </Link>

      {/* Redeem Section */}
      {isOwnProfile && (
        <div className="mt-6 pt-6 border-t border-white/10">
          {redeemStatus === 'success' ? (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-center text-sm font-medium">
              Your request has been sent, cash reward is being processed.
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              <button
                  onClick={() => canRedeem && setShowRedeem(!showRedeem)}
                  disabled={!canRedeem}
                  className={`relative w-full overflow-hidden py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                    canRedeem 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 cursor-pointer' 
                      : 'bg-[#1A1B22] border border-white/5 text-white/50 cursor-not-allowed'
                  }`}
                >
                  {!canRedeem && (
                    <div 
                      className="absolute inset-y-0 left-0 bg-blue-500/20 transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(100, (profile.lifetime_honor / 2000) * 100)}%` }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {canRedeem ? 'Redeem Points' : `Reach 2,000 pts to Redeem (${profile.lifetime_honor}/2000)`}
                  </span>
                </button>

              {showRedeem && canRedeem && (
                <div className="flex flex-col gap-2 mt-2 p-3 bg-black/20 rounded-xl border border-white/5 animate-in fade-in slide-in-from-top-2">
                  <label className="text-xs text-white/60 font-medium px-1">Enter UPI ID</label>
                  <input 
                    type="text" 
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. name@upi" 
                    className="bg-[#1A1B22] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  {redeemStatus === 'error' && (
                    <span className="text-red-400 text-xs px-1">Something went wrong. Please try again.</span>
                  )}
                  <button 
                    onClick={handleRedeem}
                    disabled={!upiId.trim() || redeemStatus === 'submitting'}
                    className="w-full mt-1 bg-white hover:bg-white/90 text-black py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
                  >
                    {redeemStatus === 'submitting' ? 'Submitting...' : 'Confirm Redemption'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
