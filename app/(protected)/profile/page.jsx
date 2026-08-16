"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { MessageSquare, ArrowUpCircle, Eye, Share2, MoreHorizontal, MapPin, Link as LinkIcon, Calendar } from 'lucide-react';

const TABS = ['Discussions', 'Replies', 'Achievements', 'Activity'];

import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../../lib/supabaseClient';
import PostCard from '../../../components/post/PostCard';

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState('Discussions');
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [connectionCount, setConnectionCount] = useState(0);

  React.useEffect(() => {
    async function fetchPosts() {
      if (!profile?.id) return;
      setIsLoadingPosts(true);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles(display_name, username, avatar_url),
            likes(count),
            comments(count)
          `)
          .eq('author_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPosts(data || []);

        const { count } = await supabase
          .from('connections')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'accepted')
          .or(`follower_id.eq.${profile.id},following_id.eq.${profile.id}`);
          
        setConnectionCount(count || 0);
      } catch (err) {
        console.error('Error fetching user posts:', err);
      } finally {
        setIsLoadingPosts(false);
      }
    }
    fetchPosts();
  }, [profile?.id]);

  return (
    <div className="max-w-3xl w-full mx-auto pb-20 md:pb-0">
      
      {/* Cover Photo */}
      <div className="w-full h-48 sm:h-64 rounded-2xl sm:rounded-[32px] overflow-hidden relative mb-16 px-2 sm:px-0">
        <Image 
          src={profile?.cover_url || "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=1200"} 
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
            <span className="text-xl font-bold text-white">{posts.length}</span>
            <span className="text-xs text-white/50 uppercase tracking-wider font-medium">Discussions</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white">0</span>
            <span className="text-xs text-white/50 uppercase tracking-wider font-medium">Replies</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-blue-400">2.4k</span>
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

        {/* Profile Feed */}
        <div className="space-y-4">
          {isLoadingPosts ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-10 text-white/50">No discussions posted yet.</div>
          ) : (
            posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onDelete={(deletedId) => setPosts(prev => prev.filter(p => p.id !== deletedId))}
                onReport={(p) => console.log('Report', p)}
              />
            ))
          )}
        </div>

      </div>
    </div>
  );
}
