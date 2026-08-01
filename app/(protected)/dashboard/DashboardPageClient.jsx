"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MessageSquare, ArrowUpCircle, Eye, Share2, MoreHorizontal, ChevronDown, Bookmark, Flag, AlertTriangle, X } from 'lucide-react';
import QuickProfileModal from '../../../components/modals/QuickProfileModal';
import PostCard from '../../../components/post/PostCard';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';

const TABS = ['For You', 'Latest', 'Trending', 'Unanswered', 'Solved'];
const FILTERS = ['Branch', 'Tags', 'Club'];



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
  const [quickProfileUserId, setQuickProfileUserId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('posts')
        .select(`
          *, 
          profiles(username, display_name, avatar_url),
          likes(count),
          comments(count)
        `);

      if (activeTab === 'Unanswered') {
        // Need to filter posts where comment count is 0 in JS for now, as Supabase RPC might be needed for complex join filters.
        query = query.order('created_at', { ascending: false });
      } else if (activeTab === 'Solved') {
        query = query.contains('tags', ['solved']).order('created_at', { ascending: false });
      } else if (activeTab === 'Trending') {
        query = query.order('created_at', { ascending: false }); // Sort in JS by likes
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let finalData = data || [];
      if (activeTab === 'Unanswered') {
        finalData = finalData.filter(p => p.comments[0]?.count === 0);
      } else if (activeTab === 'Trending') {
        finalData = finalData.sort((a, b) => (b.likes[0]?.count || 0) - (a.likes[0]?.count || 0));
      }

      setPosts(finalData);
    } catch (err) {
      console.error('Error fetching posts:', err.message);
    } finally {
      setLoading(false);
    }
  };

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
        {loading ? (
          <div className="flex justify-center p-8">
             <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center p-8 text-white/50">No discussions found.</div>
        ) : (
          posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onReport={setReportModalPost} 
              onQuickProfile={setQuickProfileUserId}
            />
          ))
        )}
      </div>
      
      {/* Report Modal */}
      <ReportModal 
        isOpen={!!reportModalPost} 
        post={reportModalPost} 
        onClose={() => setReportModalPost(null)} 
      />

      {/* Quick Profile Modal */}
      <QuickProfileModal
        userId={quickProfileUserId}
        onClose={() => setQuickProfileUserId(null)}
        onReport={(profile) => {
          // Open the report modal with dummy post object mimicking the profile
          setReportModalPost({ id: profile.id, type: 'profile' });
        }}
      />
    </div>
  );
};

export default DashboardPageClient;
