"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { MessageSquare, ArrowUpCircle, Eye, Share2, MoreHorizontal, ChevronDown } from 'lucide-react';

const TABS = ['For You', 'Latest', 'Trending', 'Unanswered', 'Solved'];
const FILTERS = ['Branch', 'Tags', 'Club'];

const MOCK_POSTS = [
  {
    id: 1,
    author: {
      name: 'Dr. Aris Thorne',
      handle: '@aris_thorne',
      avatar: 'https://i.pravatar.cc/150?u=1'
    },
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
    author: {
      name: 'Sarah Jenkins',
      handle: '@sarah_j',
      avatar: 'https://i.pravatar.cc/150?u=2'
    },
    time: '4h ago',
    action: 'asked a question',
    title: 'Understanding the Ethos in Modern Political Discourse',
    content: 'I am struggling to find good primary sources for my paper on rhetorical strategies in recent political debates. Any recommendations?',
    tags: ['Linguistics', 'Politics'],
    isHot: false,
    stats: { replies: 15, upvotes: 34, views: '320' }
  },
  {
    id: 3,
    author: {
      name: 'Mike Chen',
      handle: '@mchen_dev',
      avatar: 'https://i.pravatar.cc/150?u=3'
    },
    time: '6h ago',
    action: 'shared a resource',
    title: 'Best Practices for React Server Components in 2024',
    content: 'Here is a comprehensive guide I wrote on when to use Server Components vs Client Components. Let me know your thoughts!',
    tags: ['Engineering', 'Web Dev'],
    isHot: true,
    stats: { replies: 88, upvotes: 342, views: '4.5k' }
  }
];

const DashboardPageClient = () => {
  const [activeTab, setActiveTab] = useState('For You');

  return (
    <div className="max-w-3xl w-full mx-auto pb-20 md:pb-0">
      
      {/* Feed Header */}
      <div className="relative md:sticky top-0 md:top-0 z-10 bg-[#0C0E14]/80 backdrop-blur-xl border-b border-white/5 pt-4 md:pt-4 pb-0 mt-4 md:mt-0">
        <div className="flex items-center justify-between px-2 mb-4">
          <h1 className="text-xl font-bold text-white tracking-tight">Main Feed</h1>
          <div className="flex gap-2">
            {FILTERS.map(filter => (
              <button key={filter} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                {filter} <ChevronDown size={12} />
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide gap-6 px-2 border-b border-white/5">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium transition-colors whitespace-nowrap relative ${
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
      </div>

      {/* Feed Content */}
      <div className="mt-6 space-y-4">
        {MOCK_POSTS.map(post => (
          <article key={post.id} className="bg-[#1A1B22] border border-white/5 rounded-2xl p-4 sm:p-5 hover:border-white/10 transition-colors cursor-pointer group">
            
            {/* Post Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                  <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm text-white">{post.author.name}</span>
                    <span className="text-xs text-white/40">{post.author.handle}</span>
                    <span className="text-xs text-white/30">•</span>
                    <span className="text-xs text-white/40">{post.time}</span>
                  </div>
                  <span className="text-[11px] text-white/50">{post.action}</span>
                </div>
              </div>
              <button className="text-white/30 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors">
                <MoreHorizontal size={18} />
              </button>
            </div>

            {/* Post Content */}
            <div className="pl-0 sm:pl-13 space-y-3">
              
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

              {/* Action Buttons */}
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
  );
};

export default DashboardPageClient;
