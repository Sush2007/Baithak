"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Link as LinkIcon, BadgeCheck, Users, Calendar } from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import { useAuth } from '../../../../context/AuthContext';
import PostCard from '../../../../components/post/PostCard';
import HonorWidget from '../../../../components/profile/HonorWidget';

const TABS = ['Discussions', 'Solved Discussions', 'Best Replies'];

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('Discussions');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Connection states
  const [connectionState, setConnectionState] = useState('none'); // none, pending_sent, pending_received, connected
  const [connectionCount, setConnectionCount] = useState(0);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (id) {
      if (user && id === user.id) {
        // If it's the current user's profile, they can just go to /profile
        router.replace('/profile');
        return;
      }
      fetchProfileData();
    }
  }, [id, user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (profileError) throw profileError;
      setProfile(profileData);

      // Removed initial post fetch, now handled by activeTab effect

      // Fetch Connection Count (Accepted)
      const { count: acceptedCount } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`follower_id.eq.${id},following_id.eq.${id}`);
        
      setConnectionCount(acceptedCount || 0);

      // Check connection status between current user and this profile
      if (user) {
        const { data: connData } = await supabase
          .from('connections')
          .select('*')
          .or(`and(follower_id.eq.${user.id},following_id.eq.${id}),and(follower_id.eq.${id},following_id.eq.${user.id})`)
          .maybeSingle();
          
        if (connData) {
          if (connData.status === 'accepted') {
            setConnectionState('connected');
          } else if (connData.follower_id === user.id) {
            setConnectionState('pending_sent');
          } else if (connData.follower_id === id) {
            setConnectionState('pending_received');
          }
        }
      }
      
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Items when activeTab changes
  useEffect(() => {
    async function fetchItems() {
      if (!id) return;
      try {
        let data = [];
        if (activeTab === 'Discussions') {
          const { data: postsData } = await supabase
            .from('posts')
            .select('*, profiles!posts_author_id_fkey(display_name, username, avatar_url), likes(count), comments(count)')
            .eq('author_id', id)
            .order('created_at', { ascending: false });
          data = postsData || [];
        } else if (activeTab === 'Solved Discussions') {
          const { data: postsData } = await supabase
            .from('posts')
            .select('*, profiles!posts_author_id_fkey(display_name, username, avatar_url), likes(count), comments(count)')
            .eq('author_id', id)
            .eq('is_solved', true)
            .order('created_at', { ascending: false });
          data = postsData || [];
        } else if (activeTab === 'Best Replies') {
          const { data: commentsData } = await supabase
            .from('comments')
            .select('post_id')
            .eq('author_id', id)
            .eq('is_best_answer', true);
            
          if (commentsData && commentsData.length > 0) {
            const postIds = commentsData.map(c => c.post_id);
            const { data: postsData } = await supabase
              .from('posts')
              .select('*, profiles!posts_author_id_fkey(display_name, username, avatar_url), likes(count), comments(count)')
              .in('id', postIds)
              .order('created_at', { ascending: false });
            data = postsData || [];
          }
        }
        setPosts(data);
      } catch (err) {
        console.error('Error fetching items:', err);
      }
    }
    fetchItems();
  }, [activeTab, id]);

  const handleConnect = async () => {
    if (!user || connecting) return;
    
    setConnecting(true);
    try {
      if (connectionState === 'none') {
        // Send request
        await supabase
          .from('connections')
          .insert({ follower_id: user.id, following_id: id, status: 'pending' });
        
        await supabase
          .from('notifications')
          .insert({ user_id: id, actor_id: user.id, type: 'connection_request' });

        setConnectionState('pending_sent');
      } else if (connectionState === 'pending_sent') {
        // Cancel request
        await supabase
          .from('connections')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', id);
        setConnectionState('none');
      } else if (connectionState === 'pending_received') {
        // Accept request
        await supabase
          .from('connections')
          .update({ status: 'accepted' })
          .eq('follower_id', id)
          .eq('following_id', user.id);
            
          // Notify the requester
          await supabase
            .from('notifications')
            .insert({ 
              user_id: id, 
              actor_id: user.id, 
              type: 'connection_accepted' 
            });
            
          setConnectionState('connected');
        setConnectionCount(prev => prev + 1);
      } else if (connectionState === 'connected') {
        // Remove connection
        await supabase
          .from('connections')
          .delete()
          .or(`and(follower_id.eq.${user.id},following_id.eq.${id}),and(follower_id.eq.${id},following_id.eq.${user.id})`);
        setConnectionState('none');
        setConnectionCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error toggling connection:', err);
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 text-[#8FAAFF] animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 text-[#8E909E]">
        <p>Profile not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl w-full mx-auto pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 absolute top-0 z-50">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
      </div>

      {/* Cover Photo */}
      <div className="w-full h-32 sm:h-56 overflow-hidden relative sm:rounded-b-3xl">
        {profile?.cover_url ? (
          <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover opacity-90" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#0033A0]/40 to-[#0052FF]/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0C0E14]/10 to-[#0C0E14]" />
      </div>
      
      <div className="px-4 sm:px-8 -mt-16 sm:-mt-20 relative z-10 max-w-3xl mx-auto w-full mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-5">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-[#0C0E14] bg-[#1A1B22] shadow-2xl ring-4 ring-white/5">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-[#8A2387] via-[#E2336B] to-[#F27121] flex items-center justify-center text-3xl shadow-inner">👤</div>
              )}
            </div>
            
            <div className="pb-1 sm:pb-3">
              <div className="flex items-center gap-2 mb-1.5">
                <h1 className="text-2xl sm:text-[28px] font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70 tracking-tight leading-none">
                  {profile.display_name}
                </h1>
                {profile.is_verified && <BadgeCheck size={24} className="text-[#0052FF]" fill="currentColor" stroke="#1A1B22" strokeWidth={1} />}
              </div>
              <p className="text-[15px] text-[#8E909E] font-medium">@{profile.username}</p>
            </div>
          </div>
            
          {user && (
            <div className="w-full sm:w-auto mt-2 sm:mt-0 sm:pb-3">
              <button 
                onClick={handleConnect}
                disabled={connecting}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  connectionState === 'connected' 
                    ? 'bg-transparent border border-white/20 text-white hover:border-red-500 hover:text-red-500' 
                    : connectionState === 'pending_sent'
                    ? 'bg-transparent border border-white/20 text-white/70 hover:border-red-500 hover:text-red-500'
                    : connectionState === 'pending_received'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
                    : 'bg-white text-[#0C0E14] hover:bg-white/90 shadow-lg shadow-white/10'
                }`}
              >
                {connecting ? <Loader2 size={16} className="animate-spin" /> : null}
                {connectionState === 'connected' ? 'Connected' : 
                 connectionState === 'pending_sent' ? 'Pending Request' :
                 connectionState === 'pending_received' ? 'Accept Request' : 'Connect'}
              </button>
            </div>
          )}
        </div>
        
        <div className="mb-8">
            {profile.bio && (
              <p className="text-[#E2E1EB] text-sm leading-relaxed whitespace-pre-wrap mt-2 mb-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                {profile.bio}
              </p>
            )}

            <div className="mb-8 max-w-md">
              <HonorWidget isOwnProfile={false} profileData={profile} />
            </div>
          </div>
        </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide gap-8 border-b border-white/5 mb-6 px-4">
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

      {/* User's Posts */}
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onDelete={(deletedId) => setPosts(prev => prev.filter(p => p.id !== deletedId))}
              onQuickProfile={(id) => window.location.href = `/profile/${id}`}
            />
          ))
        ) : (
          <div className="text-center py-10 bg-[#1A1B22] border border-white/5 rounded-2xl mx-4">
            <p className="text-[#8E909E]">
              {activeTab === 'Discussions' && 'No discussions started yet.'}
              {activeTab === 'Solved Discussions' && 'No solved discussions yet.'}
              {activeTab === 'Best Replies' && 'No best replies earned yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
