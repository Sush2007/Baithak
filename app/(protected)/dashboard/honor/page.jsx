"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { useAuth } from '../../../../context/AuthContext';
import { BADGES, getCurrentHonorBadge, getNextHonorBadge } from '../../../../lib/badges';
import { Trophy, Activity, Target, Flame, ChevronRight, Zap, BookOpen, MessageCircle, Star, ThumbsUp, Award, Clock } from 'lucide-react';
import Link from 'next/link';

export default function HonorDashboard() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [metrics, setMetrics] = useState({
    answersGiven: 0,
    bestAnswers: 0,
    upvotesReceived: 0,
    discussionsRaised: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchHonorData = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('lifetime_honor, monthly_honor, current_streak')
          .eq('id', user.id)
          .single();

        setProfileData(profile || { lifetime_honor: 0, monthly_honor: 0, current_streak: 0 });

        const { data: recentActivity } = await supabase
          .from('honor_ledger')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        setLedger(recentActivity || []);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: monthLedger } = await supabase
          .from('honor_ledger')
          .select('action_type')
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth.toISOString());

        if (monthLedger) {
          setMetrics({
            answersGiven: monthLedger.filter(x => x.action_type === 'HELPFUL_REPLY').length,
            bestAnswers: monthLedger.filter(x => x.action_type === 'BEST_ANSWER').length,
            upvotesReceived: monthLedger.filter(x => x.action_type === 'RECEIVE_UPVOTE').length,
            discussionsRaised: monthLedger.filter(x => x.action_type === 'ASK_DISCUSSION').length,
          });
        }
      } catch (err) {
        console.error('Error fetching honor data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHonorData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20 border-t-white"></div>
      </div>
    );
  }

  const lifetimeHP = profileData?.lifetime_honor || 0;
  const currentBadge = getCurrentHonorBadge(lifetimeHP);
  const nextBadge = getNextHonorBadge(lifetimeHP);

  const progressPercentage = nextBadge 
    ? Math.min(100, Math.max(0, ((lifetimeHP - currentBadge.requirement) / (nextBadge.requirement - currentBadge.requirement)) * 100))
    : 100;

  const renderActionLabel = (type) => {
    switch(type) {
      case 'ASK_DISCUSSION': return 'Asked a Discussion';
      case 'HELPFUL_REPLY': return 'Supportive Answer';
      case 'RECEIVE_UPVOTE': return 'Received Upvote';
      case 'BEST_ANSWER': return 'Selected as Best Answer';
      case 'BOOKMARK': return 'Bookmarked Discussion';
      case 'STREAK_7': return '7-Day Streak Bonus';
      case 'STREAK_30': return '30-Day Streak Bonus';
      default: return type;
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto pb-20 md:pb-12 space-y-8 mt-4 md:mt-0 px-2 md:px-0">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Honor & Reputation</h1>
        <p className="text-sm text-[#8E909E]">Track your progress, badges, and community impact.</p>
      </div>

      {/* 🏆 Current Rank */}
      <section className="bg-[#1A1B22] border border-white/5 rounded-2xl p-5 md:p-6 shadow-sm relative overflow-hidden group">
        <div className="flex items-center gap-2 mb-6 text-white relative z-10">
          <Award size={18} className="text-accent-yellow" />
          <h2 className="text-base font-semibold">Current Rank</h2>
        </div>
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-yellow/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-accent-yellow/10 transition-colors"></div>

        <div className="bg-[#0C0E14]/50 border border-white/5 rounded-xl p-5 relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 shrink-0 relative flex items-center justify-center">
            {currentBadge.imageUrl ? (
              <img 
                src={currentBadge.imageUrl} 
                alt={currentBadge.name} 
                className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,186,9,0.3)]"
                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div 
              style={{ display: currentBadge.imageUrl ? 'none' : 'flex' }}
              className="w-full h-full bg-white/5 rounded-full items-center justify-center text-3xl border border-white/10"
            >
               {currentBadge.name.split(' ')[0]}
            </div>
          </div>
          
          <div className="flex-1 w-full text-center sm:text-left">
            <p className="text-[10px] text-accent-yellow font-bold uppercase tracking-wider mb-1">Total Lifetime Honor</p>
            <div className="flex items-baseline justify-center sm:justify-start gap-1 mb-2">
              <h2 className="text-3xl font-black text-white">{lifetimeHP.toLocaleString()}</h2>
              <span className="text-white/50 text-xs font-medium">HP</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-5">{currentBadge.name}</h3>

            {nextBadge ? (
              <div className="w-full max-w-sm">
                <div className="flex justify-between text-[11px] text-[#8E909E] mb-1.5 font-medium">
                  <span>Progress to {nextBadge.name}</span>
                  <span>{(nextBadge.requirement - lifetimeHP).toLocaleString()} HP needed</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-accent-yellow/50 to-accent-yellow rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-sm h-2 bg-gradient-to-r from-accent-yellow/20 via-accent-yellow/50 to-accent-yellow/20 rounded-full border border-accent-yellow/20"></div>
            )}
          </div>
        </div>
      </section>

      {/* 📊 This Month Stats */}
      <section className="bg-[#1A1B22] border border-white/5 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6 text-white">
          <Activity size={18} className="text-blue-400" />
          <h2 className="text-base font-semibold">This Month's Impact</h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#0C0E14]/50 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <MessageCircle className="text-[#8FAAFF] mb-2" size={20} />
            <span className="text-xl font-bold text-white mb-0.5">{metrics.answersGiven}</span>
            <span className="text-[10px] text-[#8E909E] uppercase tracking-wider font-semibold">Helpful Replies</span>
          </div>
          <div className="bg-[#0C0E14]/50 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <Star className="text-accent-yellow mb-2" size={20} />
            <span className="text-xl font-bold text-white mb-0.5">{metrics.bestAnswers}</span>
            <span className="text-[10px] text-[#8E909E] uppercase tracking-wider font-semibold">Best Answers</span>
          </div>
          <div className="bg-[#0C0E14]/50 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <ThumbsUp className="text-green-400 mb-2" size={20} />
            <span className="text-xl font-bold text-white mb-0.5">{metrics.upvotesReceived}</span>
            <span className="text-[10px] text-[#8E909E] uppercase tracking-wider font-semibold">Upvotes</span>
          </div>
          <div className="bg-[#0C0E14]/50 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <BookOpen className="text-purple-400 mb-2" size={20} />
            <span className="text-xl font-bold text-white mb-0.5">{metrics.discussionsRaised}</span>
            <span className="text-[10px] text-[#8E909E] uppercase tracking-wider font-semibold">Discussions</span>
          </div>
        </div>
        
        <div className="mt-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0">
              <Flame className="text-orange-500" size={20} />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Contribution Streak</p>
              <p className="text-[11px] text-orange-400">Keep participating daily!</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-white">{profileData?.current_streak || 0}</span>
            <span className="text-[11px] text-white/50 ml-1 font-medium">days</span>
          </div>
        </div>
      </section>

      {/* ⚡ Recent Activity */}
      <section className="bg-[#1A1B22] border border-white/5 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 text-white">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-green-400" />
            <h2 className="text-base font-semibold">Recent History</h2>
          </div>
        </div>
        
        <div className="bg-[#0C0E14]/50 border border-white/5 rounded-xl overflow-hidden">
          {ledger.length === 0 ? (
            <div className="p-6 text-center text-sm text-[#8E909E]">
              No recent honor activity.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {ledger.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm text-white font-medium truncate">
                      {renderActionLabel(item.action_type)}
                    </p>
                    <p className="text-[11px] text-[#8E909E] mt-0.5">
                      {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-md text-xs font-bold shrink-0 ${item.points > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {item.points > 0 ? '+' : ''}{item.points} HP
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
