"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MessageSquare, ArrowUpCircle, Eye, Share2, MoreHorizontal, ChevronDown, Bookmark, Flag, AlertTriangle, X } from 'lucide-react';
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

const PostCard = ({ post, onReport }) => {
  const { user } = useAuth();
  const [openDropdownId, setOpenDropdownId] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes?.[0]?.count || 0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user has liked/bookmarked
    if (user && post.id) {
      checkInteractions();
    }
  }, [user, post.id]);

  const checkInteractions = async () => {
    const { data: likeData } = await supabase.from('likes').select('id').eq('post_id', post.id).eq('user_id', user.id).single();
    if (likeData) setIsLiked(true);

    const { data: bmData } = await supabase.from('bookmarks').select('post_id').eq('post_id', post.id).eq('user_id', user.id).single();
    if (bmData) setIsBookmarked(true);
  };

  const handleLike = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (isLiked) {
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      } else {
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookmark = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (isBookmarked) {
        setIsBookmarked(false);
        await supabase.from('bookmarks').delete().eq('post_id', post.id).eq('user_id', user.id);
      } else {
        setIsBookmarked(true);
        await supabase.from('bookmarks').insert({ post_id: post.id, user_id: user.id });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({ title: post.title, url });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <article className="bg-[#1A1B22] border border-white/5 rounded-2xl p-4 sm:p-5 hover:border-white/10 transition-colors cursor-pointer group">
      {/* Post Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
            {post.profiles?.avatar_url ? (
              <Image src={post.profiles.avatar_url} alt={post.profiles.display_name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-[#8A2387] to-[#F27121] flex items-center justify-center text-sm">👤</div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[15px] text-white hover:underline cursor-pointer">{post.profiles?.display_name || 'Anonymous'}</span>
              <span className="text-[15px] text-[#8E909E]">@{post.profiles?.username || 'unknown'}</span>
              <span className="text-[15px] text-[#8E909E]">· {new Date(post.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setOpenDropdownId(!openDropdownId); }}
            className="text-white/30 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors"
          >
            <MoreHorizontal size={18} />
          </button>
          
          {openDropdownId && (
            <>
              <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(false); }}></div>
              <div className="absolute right-0 mt-2 w-48 bg-[#1A1B22] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setOpenDropdownId(false); onReport(post); }}
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
          {post.tags?.includes('hot') && (
            <span className="bg-yellow-400 text-[#1A1B22] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Hot Topic
            </span>
          )}
          {post.tags?.filter(t => t !== 'hot').map(tag => (
            <span key={tag} className="text-[10px] text-blue-400 font-medium">#{tag}</span>
          ))}
        </div>

        <h3 className="text-lg font-bold text-white leading-snug">{post.title}</h3>
        <p className="text-[15px] text-white/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {post.media_url && (
          <div className="mt-3 mb-1 rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors shadow-sm bg-black/40">
            {post.media_type === 'image' ? (
              <img src={post.media_url} alt="Post media" className="w-full h-auto object-cover max-h-[500px]" />
            ) : (
              <video src={post.media_url} controls className="w-full h-auto max-h-[500px] object-cover" />
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between sm:justify-start sm:gap-8 pt-3 border-t border-white/5 mt-4">
          <button 
            onClick={(e) => { e.stopPropagation(); handleLike(); }}
            className={`flex items-center gap-2 text-xs font-medium transition-colors group/btn ${isLiked ? 'text-green-400' : 'text-white/50 hover:text-green-400'}`}
          >
            <div className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${isLiked ? 'bg-green-400/20' : 'group-hover/btn:bg-green-400/10'}`}>
              <ArrowUpCircle size={18} className={isLiked ? 'fill-green-400/20' : ''} />
            </div>
            <span className="min-w-[20px] text-left">{likesCount}</span>
          </button>
          <button className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-blue-400 transition-colors group/btn">
            <div className="p-1.5 rounded-full group-hover/btn:bg-blue-400/10 transition-colors flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
            <span className="min-w-[20px] text-left">{post.comments?.[0]?.count || 0} Replies</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleBookmark(); }}
            className={`flex items-center gap-2 text-xs font-medium transition-colors group/btn ${isBookmarked ? 'text-yellow-400' : 'text-white/50 hover:text-yellow-400'}`}
          >
            <div className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${isBookmarked ? 'bg-yellow-400/20' : 'group-hover/btn:bg-yellow-400/10'}`}>
              <Bookmark size={18} className={isBookmarked ? 'fill-yellow-400' : ''} />
            </div>
          </button>
          <button className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white/80 transition-colors group/btn">
            <div className="p-1.5 rounded-full group-hover/btn:bg-white/10 transition-colors flex items-center justify-center">
              <Eye size={18} />
            </div>
            <span className="min-w-[20px] text-left">0</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleShare(); }}
            className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white/80 transition-colors group/btn ml-auto"
          >
            <div className="p-1.5 rounded-full group-hover/btn:bg-white/10 transition-colors flex items-center justify-center">
              <Share2 size={18} />
            </div>
          </button>
        </div>
      </div>
    </article>
  );
};

const DashboardPageClient = () => {
  const [activeTab, setActiveTab] = useState('For You');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [reportModalPost, setReportModalPost] = useState(null);
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
            <PostCard key={post.id} post={post} onReport={setReportModalPost} />
          ))
        )}
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
