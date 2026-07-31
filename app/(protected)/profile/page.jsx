"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { MessageSquare, ArrowUpCircle, Eye, Share2, MoreHorizontal, MapPin, Link as LinkIcon, Calendar } from 'lucide-react';

const TABS = ['Discussions', 'Replies', 'Achievements', 'Activity'];

import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../../lib/supabaseClient';

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState('Discussions');
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

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

          <Link href="/settings" className="bg-white/10 hover:bg-white/20 text-white border border-white/10 text-sm font-semibold px-6 py-2.5 rounded-full transition-colors w-full sm:w-auto mt-2 sm:mt-0 text-center">
            Edit Profile
          </Link>
        </div>

        {/* Bio & Details */}
        <div className="mb-8">
          <p className="text-sm text-white/80 leading-relaxed max-w-2xl mb-4">
            {profile?.bio || 'No bio provided yet.'}
          </p>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/50">
            <span className="flex items-center gap-1.5"><MapPin size={14} /> VSSUT Burla, Odisha</span>
            {profile?.instagram_url && (
              <span className="flex items-center gap-1.5">
                <LinkIcon size={14} /> 
                <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Instagram</a>
              </span>
            )}
            {profile?.linkedin_url && (
              <span className="flex items-center gap-1.5">
                <LinkIcon size={14} /> 
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">LinkedIn</a>
              </span>
            )}
            <span className="flex items-center gap-1.5"><Calendar size={14} /> Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric'}) : 'recently'}</span>
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
          {isLoadingPosts ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-10 text-white/50">No discussions posted yet.</div>
          ) : (
            posts.map(post => (
              <article key={post.id} className="bg-[#1A1B22] border border-white/5 rounded-2xl p-4 sm:p-5 hover:border-white/10 transition-colors cursor-pointer group">
                
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-[#8E909E]">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <button className="text-white/30 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {post.tags?.map(tag => (
                      <span key={tag} className="text-[10px] text-blue-400 font-medium bg-blue-500/10 px-2 py-0.5 rounded uppercase tracking-wider">#{tag}</span>
                    ))}
                  </div>

                  <h2 className="text-base font-bold text-white/90 group-hover:text-blue-400 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-white/60 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                    {post.content}
                  </p>
                  
                  {post.media_url && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-white/10 bg-[#0C0E14]">
                      {post.media_type === 'video' ? (
                        <video src={post.media_url} controls className="w-full max-h-[300px] object-contain" />
                      ) : (
                        <img src={post.media_url} alt="Post media" className="w-full max-h-[300px] object-cover" />
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between sm:justify-start sm:gap-6 pt-3 border-t border-white/5 mt-4">
                    <button className="flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-blue-400 transition-colors group/btn">
                      <div className="p-1.5 rounded-full group-hover/btn:bg-blue-400/10 transition-colors">
                        <MessageSquare size={16} />
                      </div>
                      {post.comments?.[0]?.count || 0} Replies
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-green-400 transition-colors group/btn">
                      <div className="p-1.5 rounded-full group-hover/btn:bg-green-400/10 transition-colors">
                        <ArrowUpCircle size={16} />
                      </div>
                      {post.likes?.[0]?.count || 0}
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white/80 transition-colors group/btn">
                      <div className="p-1.5 rounded-full group-hover/btn:bg-white/10 transition-colors">
                        <Eye size={16} />
                      </div>
                      --
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white/80 transition-colors group/btn ml-auto">
                      <div className="p-1.5 rounded-full group-hover/btn:bg-white/10 transition-colors">
                        <Share2 size={16} />
                      </div>
                    </button>
                  </div>

                </div>
              </article>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
