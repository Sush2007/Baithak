"use client";

import React, { useState, useEffect } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import PostCard from '../../../components/post/PostCard';
import ReportModal from '../../../components/modals/ReportModal';
import { useRouter } from 'next/navigation';

export default function BookmarksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportModalPost, setReportModalPost] = useState(null);

  useEffect(() => {
    if (user) fetchBookmarks();
  }, [user]);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          post_id,
          post:posts (
            *,
            profiles!posts_author_id_fkey(username, display_name, avatar_url),
            likes(count),
            comments(count)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const posts = data.map(bm => bm.post).filter(Boolean);
      setBookmarkedPosts(posts);
    } catch (err) {
      console.error('Error fetching bookmarks:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = (deletedId) => {
    setBookmarkedPosts(prev => prev.filter(p => p.id !== deletedId));
  };

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0C0E14]/80 backdrop-blur-md border-b border-white/5 px-4 py-4 sm:px-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
          <Bookmark className="text-yellow-400" size={24} />
          Saved Discussions
        </h1>
        <p className="text-[13px] text-[#8E909E] mt-1">Posts you've bookmarked for later</p>
      </div>

      {/* Content */}
      <div className="mt-6 px-4 sm:px-6 space-y-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 text-[#0052FF] animate-spin" />
          </div>
        ) : bookmarkedPosts.length === 0 ? (
          <div className="text-center py-20 px-4 border border-white/5 rounded-2xl bg-[#1A1B22]/50">
            <Bookmark className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No bookmarks yet</h3>
            <p className="text-sm text-[#8E909E]">Click the bookmark icon on any post to save it here for quick access later.</p>
          </div>
        ) : (
          bookmarkedPosts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onReport={setReportModalPost}
              onQuickProfile={(id) => router.push(`/profile/${id}`)}
              onDelete={handleDeletePost}
            />
          ))
        )}
      </div>

      <ReportModal 
        isOpen={!!reportModalPost} 
        post={reportModalPost} 
        onClose={() => setReportModalPost(null)} 
      />
    </div>
  );
}
