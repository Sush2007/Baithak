"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Bookmark, MessageSquare } from 'lucide-react';

const TABS = ['All', 'Discussions', 'Replies', 'Solved', 'Tagged'];

const MOCK_BOOKMARKS = [
  {
    id: 1,
    author: {
      name: 'Dr. Aris Thorne',
      avatar: 'https://i.pravatar.cc/150?u=1'
    },
    time: '2h ago',
    title: 'Advanced Quantum Computing: Error Correction Methods',
    tags: ['Physics'],
    isHot: true,
    replies: 42
  },
  {
    id: 2,
    author: {
      name: 'Sarah Jenkins',
      avatar: 'https://i.pravatar.cc/150?u=2'
    },
    time: 'Yesterday',
    title: 'Understanding the Ethos in Modern Political Discourse',
    tags: ['Linguistics'],
    isSolved: true,
    replies: 15
  },
  {
    id: 3,
    author: {
      name: 'Mike Chen',
      avatar: 'https://i.pravatar.cc/150?u=3'
    },
    time: '3 days ago',
    title: 'Best Practices for React Server Components in 2024',
    tags: ['Engineering'],
    replies: 88
  },
  {
    id: 4,
    author: {
      name: 'Prof. Elena Rossi',
      avatar: 'https://i.pravatar.cc/150?u=4'
    },
    time: '1 week ago',
    title: 'Archival Research Techniques for Post-Modern Historians',
    tags: ['History'],
    replies: 29
  }
];

export default function BookmarksPage() {
  const [activeTab, setActiveTab] = useState('All');

  return (
    <div className="max-w-3xl w-full mx-auto pb-20 md:pb-0">
      
      {/* Header */}
      <div className="mb-8 px-2">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Bookmarks</h1>
        <p className="text-sm text-white/50">Your saved discussions and useful threads</p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide gap-8 px-2 border-b border-white/5 mb-6">
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

      {/* Bookmarks List */}
      <div className="space-y-4">
        {MOCK_BOOKMARKS.map(post => (
          <article key={post.id} className="bg-[#1A1B22] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors cursor-pointer group relative">
            
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                {post.isHot && (
                  <span className="bg-accent-yellow text-[#1A1B22] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Hot Topic
                  </span>
                )}
                {post.isSolved && (
                  <span className="bg-white/10 text-white/70 border border-white/10 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Solved
                  </span>
                )}
                <span className="text-[11px] text-white/40">• {post.time}</span>
              </div>
              <button className="text-white/40 hover:text-white transition-colors">
                <Bookmark size={18} className="fill-white/10" />
              </button>
            </div>

            <h2 className="text-lg font-bold text-white/90 group-hover:text-blue-400 transition-colors mb-4">
              {post.title}
            </h2>

            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-2">
                <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0">
                  <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" />
                </div>
                <span className="text-xs font-medium text-white/70">{post.author.name}</span>
                <span className="text-xs text-white/30">/</span>
                {post.tags.map(tag => (
                  <span key={tag} className="text-[11px] font-medium text-blue-400">{tag}</span>
                ))}
              </div>
              
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <MessageSquare size={14} />
                {post.replies} replies
              </div>
            </div>

          </article>
        ))}
      </div>
      
    </div>
  );
}
