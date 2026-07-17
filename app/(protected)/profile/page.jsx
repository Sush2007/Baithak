"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '../../../context/AuthContext';
import { MessageSquare, ArrowUpCircle, Eye, Share2, MoreHorizontal, MapPin, Link as LinkIcon, Calendar } from 'lucide-react';

const TABS = ['Discussions', 'Replies', 'Achievements', 'Activity'];

const MOCK_PROFILE_POSTS = [
  {
    id: 1,
    time: '2h ago',
    action: 'posted a discussion',
    title: 'Advanced Quantum Computing: Error Correction Methods',
    content: 'Has anyone looked into the latest paper on surface codes for quantum error correction? The threshold improvements seem significant.',
    tags: ['Physics', 'Quantum'],
    isHot: true,
    stats: { replies: 42, upvotes: 156, views: '1.2k' }
  },
  {
    id: 2,
    time: '3 days ago',
    action: 'asked a question',
    title: 'Thermodynamics Lab Report Structuring',
    content: 'For the upcoming lab report on the Rankine cycle, are we supposed to include the raw data tables in the appendix or inline with the results?',
    tags: ['Mechanical', 'Lab'],
    isHot: false,
    stats: { replies: 5, upvotes: 12, views: '84' }
  }
];

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState('Discussions');

  return (
    <div className="max-w-3xl w-full mx-auto pb-20 md:pb-0">
      
      {/* Cover Photo */}
      <div className="w-full h-48 sm:h-64 rounded-2xl sm:rounded-[32px] overflow-hidden relative mb-16 px-2 sm:px-0">
        <Image 
          src="https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=1200" 
          alt="Cover" 
          fill 
          className="object-cover opacity-80" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0E14] via-transparent to-transparent opacity-80" />
      </div>

      <div className="px-4 sm:px-6 -mt-24 sm:-mt-28 relative z-10">
        
        {/* Profile Info Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
            
            {/* Avatar */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-[#0C0E14] bg-[#1A1B22] shadow-2xl">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="Profile Avatar" fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-[#8A2387] to-[#F27121] flex items-center justify-center text-4xl">👤</div>
              )}
            </div>

            <div className="pb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {profile?.display_name || 'Loading...'}
              </h1>
              <p className="text-sm text-blue-400 font-medium">@{profile?.username || 'loading'}</p>
              <p className="text-sm text-white/50 mt-1">Computer Science & Engineering '25</p>
            </div>
          </div>

          <button className="bg-white/10 hover:bg-white/20 text-white border border-white/10 text-sm font-semibold px-6 py-2.5 rounded-full transition-colors w-full sm:w-auto mt-2 sm:mt-0">
            Edit Profile
          </button>
        </div>

        {/* Bio & Details */}
        <div className="mb-8">
          <p className="text-sm text-white/80 leading-relaxed max-w-2xl mb-4">
            Exploring the intersections of distributed systems and artificial intelligence. 
            Passionate about open-source and helping juniors with OS concepts. 
            Former TA for CS201.
          </p>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/50">
            <span className="flex items-center gap-1.5"><MapPin size={14} /> VSSUT Burla, Odisha</span>
            <span className="flex items-center gap-1.5"><LinkIcon size={14} /> <a href="#" className="text-blue-400 hover:underline">github.com/alexrivers</a></span>
            <span className="flex items-center gap-1.5"><Calendar size={14} /> Joined August 2024</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between sm:justify-start sm:gap-8 mb-8 pb-8 border-b border-white/5">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white">42</span>
            <span className="text-xs text-white/50 uppercase tracking-wider font-medium">Discussions</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white">156</span>
            <span className="text-xs text-white/50 uppercase tracking-wider font-medium">Replies</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-blue-400">2.4k</span>
            <span className="text-xs text-white/50 uppercase tracking-wider font-medium">Impact Score</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide gap-8 border-b border-white/5 mb-6">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-medium transition-colors whitespace-nowrap relative ${
                activeTab === tab ? 'text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Profile Feed */}
        <div className="space-y-4">
          {MOCK_PROFILE_POSTS.map(post => (
            <article key={post.id} className="bg-[#1A1B22] border border-white/5 rounded-2xl p-4 sm:p-5 hover:border-white/10 transition-colors cursor-pointer group">
              
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-white/40">{post.time}</span>
                  <span className="text-xs text-white/30">•</span>
                  <span className="text-[11px] text-white/50">{post.action}</span>
                </div>
                <button className="text-white/30 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              <div className="space-y-3">
                
                <div className="flex items-center gap-2 flex-wrap">
                  {post.isHot && (
                    <span className="bg-accent-yellow text-[#1A1B22] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      Hot Topic
                    </span>
                  )}
                  {post.tags.map(tag => (
                    <span key={tag} className="text-[10px] text-blue-400 font-medium">#{tag}</span>
                  ))}
                </div>

                <h2 className="text-base font-bold text-white/90 group-hover:text-blue-400 transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-white/60 leading-relaxed line-clamp-3">
                  {post.content}
                </p>

                <div className="flex items-center justify-between sm:justify-start sm:gap-6 pt-3 border-t border-white/5 mt-4">
                  <button className="flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-blue-400 transition-colors group/btn">
                    <div className="p-1.5 rounded-full group-hover/btn:bg-blue-400/10 transition-colors">
                      <MessageSquare size={16} />
                    </div>
                    {post.stats.replies} Replies
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-green-400 transition-colors group/btn">
                    <div className="p-1.5 rounded-full group-hover/btn:bg-green-400/10 transition-colors">
                      <ArrowUpCircle size={16} />
                    </div>
                    {post.stats.upvotes}
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white/80 transition-colors group/btn">
                    <div className="p-1.5 rounded-full group-hover/btn:bg-white/10 transition-colors">
                      <Eye size={16} />
                    </div>
                    {post.stats.views}
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white/80 transition-colors group/btn ml-auto">
                    <div className="p-1.5 rounded-full group-hover/btn:bg-white/10 transition-colors">
                      <Share2 size={16} />
                    </div>
                  </button>
                </div>

              </div>
            </article>
          ))}
        </div>

      </div>
    </div>
  );
}
