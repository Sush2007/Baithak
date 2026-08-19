"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Link as LinkIcon, BadgeCheck, Users, Calendar } from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import { useAuth } from '../../../../context/AuthContext';
import PostCard from '../../../../components/post/PostCard';

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState(null);
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

      // Fetch Posts
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *, 
          profiles!posts_author_id_fkey(username, display_name, avatar_url),
          likes(count),
          comments(count)
        `)
        .eq('author_id', id)
        .order('created_at', { ascending: false });
        
      setPosts(postsData || []);

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

  const handleConnect = async () => {
    if (!user || connecting) return;
    
    setConnecting(true);
    try {
      if (connectionState === 'none') {
        // Send request
        await supabase
          .from('connections')
          .insert({ follower_id: user.id, following_id: id, status: 'pending' });
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
    <div className="max-w-3xl w-full mx-auto pb-20 md:pb-8 pt-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 px-4">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h1 className="text-xl font-bold text-white">Profile</h1>
      </div>

      {/* Profile Cover & Info */}
      <div className="bg-[#1A1B22] border border-white/5 rounded-3xl overflow-hidden mb-6 shadow-xl relative">
        <div className="h-32 bg-gradient-to-r from-[#0033A0]/40 to-[#0052FF]/20 relative"></div>
        
        <div className="px-6 pb-6 relative">
          <div className="flex justify-between items-end -mt-12 mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-[#1A1B22] bg-[#0C0E14] overflow-hidden relative">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-[#8A2387] to-[#F27121] flex items-center justify-center text-3xl">👤</div>
              )}
            </div>
            
            {user && (
              <button 
                onClick={handleConnect}
                disabled={connecting}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  connectionState === 'connected' 
                    ? 'bg-transparent border border-white/20 text-white hover:border-red-500 hover:text-red-500' 
                    : connectionState === 'pending_sent'
                    ? 'bg-transparent border border-white/20 text-white/70 hover:border-red-500 hover:text-red-500'
                    : connectionState === 'pending_received'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-[#8FAAFF] text-[#0C0E14] hover:bg-white'
                }`}
              >
                {connecting ? <Loader2 size={16} className="animate-spin" /> : null}
                {connectionState === 'connected' ? 'Connected' : 
                 connectionState === 'pending_sent' ? 'Pending Request' :
                 connectionState === 'pending_received' ? 'Accept Request' : 'Connect'}
              </button>
            )}
          </div>

          <div>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">{profile.display_name}</h2>
                  {profile.is_verified && <BadgeCheck size={20} className="text-[#0052FF]" fill="currentColor" stroke="#1A1B22" strokeWidth={1} />}
                </div>
                <p className="text-[#8E909E] text-sm mb-4">@{profile.username}</p>
              </div>
              
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold text-blue-400">
                  {profile?.lifetime_honor >= 1000 
                    ? `${(profile.lifetime_honor / 1000).toFixed(1)}k`
                    : profile?.lifetime_honor || 0}
                </span>
                <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Honor Points</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-[#C4C5D5] mb-4">
              <Link href={`/profile/${id}/connections`} className="flex items-center gap-1.5 hover:underline">
                <Users size={16} className="text-[#8FAAFF]" />
                <span className="font-semibold text-[#8FAAFF]">{connectionCount}</span> <span className="text-[#8FAAFF]">Connections</span>
              </Link>
            </div>

            {profile.bio && (
              <p className="text-[#E2E1EB] text-sm leading-relaxed whitespace-pre-wrap mt-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* User's Posts */}
      <h3 className="text-lg font-bold text-white mb-4 px-2">Discussions</h3>
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
          <div className="text-center py-10 bg-[#1A1B22] border border-white/5 rounded-2xl">
            <p className="text-[#8E909E]">No discussions started yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
