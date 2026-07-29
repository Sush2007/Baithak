"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { MessageSquare, ArrowUpCircle, Eye, Share2, MoreHorizontal, ChevronDown, Bookmark, Flag, AlertTriangle, X } from 'lucide-react';

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
    title: 'Advanced Quantum Computing: Error Correction Methods',
    content: 'Has anyone looked into the latest paper on surface codes for quantum error correction? The threshold improvements seem significant.',
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1200'
    },
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
    title: 'Best Practices for React Server Components in 2024',
    content: 'Here is a comprehensive guide I wrote on when to use Server Components vs Client Components. Let me know your thoughts!',
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200'
    },
    tags: ['Engineering', 'Web Dev'],
    isHot: true,
    stats: { replies: 88, upvotes: 342, views: '4.5k' }
  }
];

const ReportModal = ({ isOpen, onClose, post }) => {
  const [reportReason, setReportReason] = useState('');
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1A1B22] border border-white/10 rounded-[24px] w-full max-w-[700px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#1C2136]/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFC300]/10 rounded-lg">
              <AlertTriangle size={20} className="text-[#FFC300]" />
            </div>
            <div>
              <h3 className="text-[20px] font-bold text-white tracking-tight">Submit a Report</h3>
              <p className="text-[14px] text-[#C4C5D5] mt-0.5">Help us keep Baithak safe and respectful</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 space-y-6">
          <div>
            <label className="text-[12px] font-bold text-[#C4C5D5] mb-4 block uppercase tracking-wide">Why are you reporting this?</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Fake profile / impersonation', 'Harassment or hate speech', 'Inappropriate content', 'Misinformation', 'Spam or unsolicited promotion', 'Other'].map(reason => (
                <label key={reason} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${reportReason === reason ? 'bg-[#FFC300]/5 border-[#FFC300]' : 'bg-[#0C0E14] border-white/5 hover:border-white/20'}`}>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${reportReason === reason ? 'border-[#FFC300]' : 'border-white/40'}`}>
                    {reportReason === reason && <div className="w-2 h-2 rounded-full bg-[#FFC300]" />}
                  </div>
                  <span className={`text-[14px] font-semibold ${reportReason === reason ? 'text-[#E2E1EB]' : 'text-white/70'}`}>{reason}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="text-[12px] font-bold text-[#C4C5D5] uppercase tracking-wide block">Additional Details (Optional)</label>
            <textarea 
              className="w-full bg-[#0C0E14] border border-white/5 rounded-xl p-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FFC300]/50 focus:ring-1 focus:ring-[#FFC300]/50 transition-all resize-none h-24"
              placeholder="Provide more context..."
            />
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="p-5 border-t border-white/5 bg-[#1C2136]/30 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => { alert('Report submitted successfully.'); onClose(); }}
            disabled={!reportReason}
            className="px-6 py-2.5 rounded-xl text-[14px] font-semibold text-[#1A1B22] bg-[#FFC300] hover:bg-[#E8B82F] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
};

const DashboardPageClient = () => {
  const [activeTab, setActiveTab] = useState('For You');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [reportModalPost, setReportModalPost] = useState(null);

  return (
    <div className="max-w-3xl w-full mx-auto pb-20 md:pb-0">
      
      {/* Feed Header */}
      <div className="relative md:sticky top-0 md:top-0 z-10 bg-[#0C0E14]/80 backdrop-blur-xl border-b border-white/5 pt-0 mt-0">
        {/* Tabs - X Style */}
        <div className="flex overflow-x-auto scrollbar-hide w-full border-b border-white/5">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 flex justify-center min-w-[100px] hover:bg-white/5 transition-colors"
            >
              <div className="relative py-4">
                <span className={`text-[15px] font-bold ${activeTab === tab ? 'text-white' : 'text-[#8E909E]'}`}>
                  {tab}
                </span>
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-[#1d9bf0] rounded-t-full" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Feed Content */}
      <div className="mt-6 space-y-4">
        {MOCK_POSTS.map(post => (
          <article key={post.id} className="bg-[#1A1B22] border border-white/5 rounded-2xl p-4 sm:p-5 hover:border-white/10 transition-colors cursor-pointer group">
            
            {/* Post Header */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                  <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-[15px] text-white hover:underline cursor-pointer">{post.author.name}</span>
                    <span className="text-[15px] text-[#8E909E]">{post.author.handle}</span>
                    <span className="text-[15px] text-[#8E909E]">· {post.time}</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdownId(openDropdownId === post.id ? null : post.id);
                  }}
                  className="text-white/30 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors"
                >
                  <MoreHorizontal size={18} />
                </button>
                
                {/* Dropdown Menu */}
                {openDropdownId === post.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-[#1A1B22] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(null);
                            setReportModalPost(post);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                        >
                          <Flag size={16} />
                          Report Post
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Post Content */}
            <div className="pl-0 sm:pl-[52px] space-y-3">
              
              <div className="flex items-center gap-2 flex-wrap">
                {post.isHot && (
                  <span className="bg-yellow-400 text-[#1A1B22] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Hot Topic
                  </span>
                )}
                {post.tags.map(tag => (
                  <span key={tag} className="text-[10px] text-blue-400 font-medium">#{tag}</span>
                ))}
              </div>

              <h3 className="text-lg font-bold text-white leading-snug">{post.title}</h3>
              <p className="text-[15px] text-white/80 leading-relaxed">
                {post.content}
              </p>

              {post.media && (
                <div className="mt-3 mb-1 rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors shadow-sm bg-black/40">
                  {post.media.type === 'image' ? (
                    <img src={post.media.url} alt="Post media" className="w-full h-auto object-cover max-h-[500px]" />
                  ) : (
                    <video src={post.media.url} controls className="w-full h-auto max-h-[500px] object-cover" />
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between sm:justify-start sm:gap-8 pt-3 border-t border-white/5 mt-4">
                <button className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-green-400 transition-colors group/btn">
                  <div className="p-1.5 rounded-full group-hover/btn:bg-green-400/10 transition-colors flex items-center justify-center">
                    <ArrowUpCircle size={18} />
                  </div>
                  <span className="min-w-[20px] text-left">{post.stats.upvotes}</span>
                </button>
                <button className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-blue-400 transition-colors group/btn">
                  <div className="p-1.5 rounded-full group-hover/btn:bg-blue-400/10 transition-colors flex items-center justify-center">
                    <MessageSquare size={18} />
                  </div>
                  <span className="min-w-[20px] text-left">{post.stats.replies} Replies</span>
                </button>
                <button className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-yellow-400 transition-colors group/btn">
                  <div className="p-1.5 rounded-full group-hover/btn:bg-yellow-400/10 transition-colors flex items-center justify-center">
                    <Bookmark size={18} />
                  </div>
                </button>
                <button className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white/80 transition-colors group/btn">
                  <div className="p-1.5 rounded-full group-hover/btn:bg-white/10 transition-colors flex items-center justify-center">
                    <Eye size={18} />
                  </div>
                  <span className="min-w-[20px] text-left">{post.stats.views}</span>
                </button>
                <button className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white/80 transition-colors group/btn ml-auto">
                  <div className="p-1.5 rounded-full group-hover/btn:bg-white/10 transition-colors flex items-center justify-center">
                    <Share2 size={18} />
                  </div>
                </button>
              </div>

            </div>
          </article>
        ))}
      </div>
      
      {/* Report Modal */}
      <ReportModal 
        isOpen={!!reportModalPost} 
        post={reportModalPost} 
        onClose={() => setReportModalPost(null)} 
      />
    </div>
  );
};

export default DashboardPageClient;
