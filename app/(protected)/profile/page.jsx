"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { MessageSquare, ArrowUpCircle, Eye, Share2, MoreHorizontal, MapPin, Link as LinkIcon, Calendar } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import PostCard from '../../../components/post/PostCard';

const TABS = ['Discussions', 'Replies', 'Achievements', 'Upvotes'];

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState('Discussions');
  const [items, setItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  
  // Stats
  const [connectionCount, setConnectionCount] = useState(0);
  const [discussionsCount, setDiscussionsCount] = useState(0);
  const [repliesCount, setRepliesCount] = useState(0);

  // Fetch Stats once on load
  useEffect(() => {
    async function fetchStats() {
      if (!profile?.id) return;
      
      // Connections
      const { count: cCount } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`follower_id.eq.${profile.id},following_id.eq.${profile.id}`);
      setConnectionCount(cCount || 0);

      // Discussions Count
      const { count: dCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', profile.id);
      setDiscussionsCount(dCount || 0);

      // Replies Count
      const { count: rCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', profile.id);
      setRepliesCount(rCount || 0);
    }
    fetchStats();
  }, [profile?.id]);

  // Fetch Items when activeTab changes
  useEffect(() => {
    async function fetchItems() {
      if (!profile?.id) return;
      setIsLoadingItems(true);
      setItems([]);
      try {
        let data = [];
        
        if (activeTab === 'Discussions') {
          const { data: postsData } = await supabase
            .from('posts')
            .select(`
              *, 
              profiles!posts_author_id_fkey(display_name, username, avatar_url),
              likes(count),
              comments(count)
            `)
            .eq('author_id', profile.id)
            .order('created_at', { ascending: false });
          data = postsData || [];
        } 
        else if (activeTab === 'Replies') {
          // Fetch posts that the user has replied to
          const { data: commentsData } = await supabase
            .from('comments')
            .select(`
              post_id,
              posts!inner(
                *,
                profiles!posts_author_id_fkey(display_name, username, avatar_url),
                likes(count),
                comments(count)
              )
            `)
            .eq('author_id', profile.id)
            .order('created_at', { ascending: false });
          
          // Extract posts and remove duplicates
          if (commentsData) {
            const uniquePosts = new Map();
            commentsData.forEach(c => {
              if (c.posts && !uniquePosts.has(c.posts.id)) {
                uniquePosts.set(c.posts.id, c.posts);
              }
            });
            data = Array.from(uniquePosts.values());
          }
        }
        else if (activeTab === 'Activity') {
          // Fetch upvoted posts
          const { data: likesData } = await supabase
            .from('likes')
            .select(`
              post_id,
              posts!inner(
                *,
                profiles!posts_author_id_fkey(display_name, username, avatar_url),
                likes(count),
                comments(count)
              )
            `)
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });
            
          if (likesData) {
            const uniquePosts = new Map();
            likesData.forEach(l => {
              if (l.posts && !uniquePosts.has(l.posts.id)) {
                uniquePosts.set(l.posts.id, l.posts);
              }
            });
            data = Array.from(uniquePosts.values());
          }
        }
        
        setItems(data);
      } catch (err) {
        console.error(`Error fetching ${activeTab}:`, err);
      } finally {
        setIsLoadingItems(false);
      }
    }
    fetchItems();
  }, [activeTab, profile?.id]);

  return (
    <div className="max-w-3xl w-full mx-auto pb-20 md:pb-0">
      
      {/* Cover Photo */}
      <div className="w-full h-48 sm:h-64 rounded-2xl sm:rounded-[32px] overflow-hidden relative mb-16 px-2 sm:px-0">
        <Image 
          src={profile?.cover_url || "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=1200"} 
          alt="Cover" 
          fill 
          className="object-cover opacity-80" 
          unoptimized={true}
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
                <Image src={profile.avatar_url} alt="Profile Avatar" fill className="object-cover" unoptimized={true} />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-[#8A2387] to-[#F27121] flex items-center justify-center text-4xl">👤</div>
              )}
            </div>

            <div className="pb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {profile?.display_name || 'Loading...'}
              </h1>
              <p className="text-sm text-blue-400 font-medium">@{profile?.username || 'loading'}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
            <Link href="/settings" className="bg-white/10 hover:bg-white/20 text-white border border-white/10 text-sm font-semibold px-6 py-2.5 rounded-full transition-colors w-full sm:w-auto text-center">
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Bio & Details */}
        <div className="mb-8">
          <p className="text-sm text-white/80 leading-relaxed max-w-2xl mb-4">
            {profile?.bio || 'No bio provided yet.'}
          </p>
          
          <div className="flex flex-wrap items-center justify-between gap-y-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/50">
              <span className="flex items-center gap-1.5"><MapPin size={14} /> VSSUT Burla, Odisha</span>
              <Link href="/connections" className="flex items-center gap-1.5 font-medium text-[#8FAAFF] hover:underline">
                {connectionCount} Connections
              </Link>
            </div>
            
            <div className="flex items-center gap-3">
              {profile?.instagram_url && (
                <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors" title="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              )}
              {profile?.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors" title="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between sm:justify-start sm:gap-8 mb-8 pb-8 border-b border-white/5">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white">{discussionsCount}</span>
            <span className="text-xs text-white/50 uppercase tracking-wider font-medium">Discussions</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white">{repliesCount}</span>
            <span className="text-xs text-white/50 uppercase tracking-wider font-medium">Replies</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-blue-400">
              {profile?.lifetime_honor >= 1000 
                ? `${(profile.lifetime_honor / 1000).toFixed(1)}k` 
                : profile?.lifetime_honor || 0}
            </span>
            <span className="text-xs text-white/50 uppercase tracking-wider font-medium">Honour Points</span>
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

        {/* Profile Feed / Content */}
        <div className="space-y-4 min-h-[300px]">
          {isLoadingItems ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : activeTab === 'Achievements' ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
               <h3 className="text-xl font-bold text-white mb-2">Achievements & Badges</h3>
               <p className="text-white/50 text-sm max-w-md mx-auto mb-6">Unlock badges by participating in discussions, helping others, and maintaining streaks.</p>
               <div className="flex justify-center gap-4">
                 <div className="flex flex-col items-center gap-2 p-4 bg-black/40 rounded-lg opacity-50 grayscale">
                    <span className="text-3xl">🔥</span>
                    <span className="text-xs font-bold text-white/70">7 Day Streak</span>
                 </div>
                 <div className="flex flex-col items-center gap-2 p-4 bg-black/40 rounded-lg opacity-50 grayscale">
                    <span className="text-3xl">💡</span>
                    <span className="text-xs font-bold text-white/70">Top Answerer</span>
                 </div>
                 <div className="flex flex-col items-center gap-2 p-4 bg-black/40 rounded-lg opacity-50 grayscale">
                    <span className="text-3xl">🌟</span>
                    <span className="text-xs font-bold text-white/70">Popular</span>
                 </div>
               </div>
               <p className="text-xs text-blue-400 mt-6 font-medium tracking-widest uppercase">Coming Soon</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-white/50">
              {activeTab === 'Discussions' && 'No discussions posted yet.'}
              {activeTab === 'Replies' && 'You haven\'t replied to any discussions yet.'}
              {activeTab === 'Activity' && 'You haven\'t upvoted any discussions yet.'}
            </div>
          ) : (
            items.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onDelete={(deletedId) => setItems(prev => prev.filter(p => p.id !== deletedId))}
                onReport={(p) => console.log('Report', p)}
                onQuickProfile={(id) => window.location.href = `/profile/${id}`}
              />
            ))
          )}
        </div>

      </div>
    </div>
  );
}
