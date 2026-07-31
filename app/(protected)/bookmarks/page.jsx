"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Bookmark, MessageSquare } from 'lucide-react';

const TABS = ['All', 'Discussions', 'Replies', 'Solved', 'Tagged'];

import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';

export default function BookmarksPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('All');
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    async function fetchBookmarks() {
      if (!user) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('bookmarks')
          .select(`
            post_id,
            created_at,
            posts (
              id, title, created_at, tags,
              profiles (display_name, avatar_url),
              comments (count)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setBookmarks(data || []);
      } catch (err) {
        console.error('Error fetching bookmarks:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBookmarks();
  }, [user]);

  const handleUnbookmark = async (postId, e) => {
    e.stopPropagation();
    if (!user) return;
    
    // Optimistic update
    setBookmarks(prev => prev.filter(b => b.post_id !== postId));
    
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);
        
      if (error) throw error;
    } catch (err) {
      console.error('Error removing bookmark:', err);
      // Revert if error
      window.location.reload();
    }
  };

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
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-10 text-white/50">No bookmarks yet. Save discussions to read them later!</div>
        ) : (
          bookmarks.map(bookmark => {
            const post = bookmark.posts;
            if (!post) return null;
            return (
              <article key={bookmark.post_id} className="bg-[#1A1B22] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors cursor-pointer group relative">
                
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {post.tags?.includes('hot') && (
                      <span className="bg-accent-yellow text-[#1A1B22] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        Hot Topic
                      </span>
                    )}
                    {post.tags?.includes('solved') && (
                      <span className="bg-white/10 text-white/70 border border-white/10 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        Solved
                      </span>
                    )}
                    <span className="text-[11px] text-white/40">• {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                  </div>
                  <button 
                    onClick={(e) => handleUnbookmark(post.id, e)}
                    className="text-white hover:text-red-400 transition-colors"
                  >
                    <Bookmark size={18} className="fill-white" />
                  </button>
                </div>

                <h2 className="text-lg font-bold text-white/90 group-hover:text-blue-400 transition-colors mb-4">
                  {post.title}
                </h2>

                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-2">
                    <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 bg-gray-600">
                      {post.profiles?.avatar_url && <Image src={post.profiles.avatar_url} alt={post.profiles.display_name} fill className="object-cover" />}
                    </div>
                    <span className="text-xs font-medium text-white/70">{post.profiles?.display_name}</span>
                    <span className="text-xs text-white/30">/</span>
                    {post.tags?.map(tag => (
                      <span key={tag} className="text-[11px] font-medium text-blue-400">{tag}</span>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <MessageSquare size={14} />
                    {post.comments?.[0]?.count || 0} replies
                  </div>
                </div>

              </article>
            );
          })
        )}
      </div>
      
    </div>
  );
}
