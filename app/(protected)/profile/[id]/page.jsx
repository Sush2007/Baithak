"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Loader2, 
  BadgeCheck, 
  Users, 
  Calendar, 
  MapPin, 
  Share2, 
  Check, 
  Clock, 
  UserPlus, 
  Trophy, 
  MessageSquare, 
  HelpCircle, 
  Award,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import { useAuth } from '../../../../context/AuthContext';
import PostCard from '../../../../components/post/PostCard';
import { getCurrentHonorBadge } from '../../../../lib/badges';
import { toast } from 'react-hot-toast';

const TABS = [
  { id: 'Discussions', label: 'Discussions', icon: MessageSquare },
  { id: 'Solved Discussions', label: 'Solved Doubts', icon: HelpCircle },
  { id: 'Best Replies', label: 'Best Answers', icon: Award }
];

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('Discussions');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  
  // Connection states
  const [connectionState, setConnectionState] = useState('none'); // 'none' | 'pending_sent' | 'pending_received' | 'connected'
  const [connectionCount, setConnectionCount] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [isHoveringConnected, setIsHoveringConnected] = useState(false);

  // Profile stats
  const [stats, setStats] = useState({
    discussions: 0,
    solved: 0,
    bestReplies: 0
  });

  // Redirect to own profile if viewing oneself
  useEffect(() => {
    if (id && user && id === user.id) {
      router.replace('/profile');
    }
  }, [id, user, router]);

  const fetchProfileData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      
      // 1. Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (profileError) throw profileError;
      setProfile(profileData);

      // 2. Fetch Connection Count (Accepted)
      const { count: acceptedCount } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`follower_id.eq.${id},following_id.eq.${id}`);
        
      setConnectionCount(acceptedCount || 0);

      // 3. Fetch Discussions Count
      const { count: dCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', id);

      // 4. Fetch Solved Count
      const { count: sCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', id)
        .eq('is_solved', true);

      // 5. Fetch Best Replies Count
      const { count: rCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', id)
        .eq('is_best_answer', true);

      setStats({
        discussions: dCount || 0,
        solved: sCount || 0,
        bestReplies: rCount || 0
      });

      // 6. Check connection status between current user and this profile
      if (user && user.id !== id) {
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
        } else {
          setConnectionState('none');
        }
      }
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    if (id && (!user || id !== user.id)) {
      fetchProfileData();
    }
  }, [id, user, fetchProfileData]);

  // Fetch Items when activeTab changes
  useEffect(() => {
    async function fetchItems() {
      if (!id) return;
      try {
        setLoadingPosts(true);
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
      } finally {
        setLoadingPosts(false);
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
        toast.success('Connection request sent!');
      } else if (connectionState === 'pending_sent') {
        // Cancel request
        await supabase
          .from('connections')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', id);
        setConnectionState('none');
        toast('Connection request cancelled', { icon: '↩️' });
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
        toast.success('Connection request accepted!');
      } else if (connectionState === 'connected') {
        // Remove connection
        await supabase
          .from('connections')
          .delete()
          .or(`and(follower_id.eq.${user.id},following_id.eq.${id}),and(follower_id.eq.${id},following_id.eq.${user.id})`);
        setConnectionState('none');
        setConnectionCount(prev => Math.max(0, prev - 1));
        toast('Connection removed', { icon: '👋' });
      }
    } catch (err) {
      console.error('Error toggling connection:', err);
      toast.error('Failed to update connection status');
    } finally {
      setConnecting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${profile?.display_name || 'User'} on Baithak`;
    const text = `Check out ${profile?.display_name}'s profile (@${profile?.username}) on Baithak!`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        if (err.name !== 'AbortError') {
          await navigator.clipboard.writeText(url);
          toast.success('Profile link copied to clipboard!');
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Profile link copied to clipboard!');
    }
  };

  const formattedJoinedDate = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const currentHonorBadge = getCurrentHonorBadge(profile?.lifetime_honor || 0);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
        <Loader2 className="w-9 h-9 text-[#0052FF] animate-spin" />
        <p className="text-sm font-medium text-white/50">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
          <Users size={28} className="text-white/40" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">User Not Found</h2>
        <p className="text-sm text-[#8E909E] mb-6">The profile you are looking for does not exist or has been deactivated.</p>
        <button 
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-semibold transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl w-full mx-auto pb-24 md:pb-12">
      
      {/* Top Floating Glass Navigation */}
      <div className="sticky top-0 z-40 bg-[#0C0E14]/80 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-95"
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
              {profile.display_name}
              {profile.is_verified && <BadgeCheck size={16} className="text-[#0052FF]" fill="currentColor" stroke="#0C0E14" strokeWidth={1} />}
            </h2>
            <p className="text-[11px] text-[#8E909E] font-medium">@{profile.username}</p>
          </div>
        </div>

        <button 
          onClick={handleShare}
          className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-95"
          title="Share Profile"
        >
          <Share2 size={16} />
        </button>
      </div>

      {/* Cover Photo */}
      <div className="w-full h-36 sm:h-52 overflow-hidden relative sm:rounded-b-2xl border-b sm:border border-white/5">
        {profile.cover_url ? (
          <img 
            src={profile.cover_url} 
            alt="Cover" 
            className="w-full h-full object-cover opacity-90" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#002266] via-[#0033A0]/40 to-[#0052FF]/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0C0E14]/30 to-[#0C0E14]" />
      </div>

      {/* Main Profile Info Container */}
      <div className="px-4 sm:px-6 relative z-10 -mt-14 sm:-mt-16 mb-6">
        
        {/* Avatar + Actions Row */}
        <div className="flex items-end justify-between gap-4 mb-4">
          
          {/* Avatar with Ring */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-[#0C0E14] bg-[#1A1B22] shadow-2xl ring-2 ring-white/10 shrink-0">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.display_name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-[#0033A0] to-[#FFC300] flex items-center justify-center text-3xl font-bold text-white shadow-inner">
                {profile.display_name?.[0]?.toUpperCase() || '👤'}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pb-1">
            <button 
              onClick={handleShare}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all active:scale-95"
              title="Share Profile"
            >
              <Share2 size={16} />
            </button>

            {user && (
              <button 
                onClick={handleConnect}
                disabled={connecting}
                onMouseEnter={() => setIsHoveringConnected(true)}
                onMouseLeave={() => setIsHoveringConnected(false)}
                className={`min-w-[130px] sm:min-w-[140px] px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm ${
                  connectionState === 'connected' 
                    ? isHoveringConnected
                      ? 'bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20'
                      : 'bg-white/5 border border-white/15 text-white hover:bg-white/10' 
                    : connectionState === 'pending_sent'
                    ? 'bg-amber-500/10 border border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                    : connectionState === 'pending_received'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
                    : 'bg-[#0052FF] hover:bg-[#0042D0] text-white shadow-lg shadow-[#0052FF]/20'
                }`}
              >
                {connecting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : connectionState === 'connected' ? (
                  isHoveringConnected ? (
                    'Disconnect'
                  ) : (
                    <><Check size={15} className="text-emerald-400" /> Connected</>
                  )
                ) : connectionState === 'pending_sent' ? (
                  <><Clock size={15} /> Requested</>
                ) : connectionState === 'pending_received' ? (
                  <><Check size={15} /> Accept</>
                ) : (
                  <><UserPlus size={15} /> Connect</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Identity Details */}
        <div className="space-y-3">
          
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
                {profile.display_name}
              </h1>
              {profile.is_verified && (
                <BadgeCheck size={20} className="text-[#0052FF]" fill="currentColor" stroke="#0C0E14" strokeWidth={1} />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-[#8E909E] font-medium">@{profile.username}</p>

              {/* Honor Rank Pill */}
              {currentHonorBadge && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8B82F]/10 border border-[#E8B82F]/20 text-[#E8B82F] text-[11px] font-bold">
                  <Trophy size={11} className="text-[#E8B82F]" />
                  <span>{currentHonorBadge.name}</span>
                  <span className="text-white/40 font-normal">·</span>
                  <span className="text-white/80 font-semibold">{profile.lifetime_honor || 0} HP</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal whitespace-pre-wrap max-w-2xl pt-1">
              {profile.bio}
            </p>
          )}

          {/* Metadata Row: Location, Connections, Joined Date, Social Links */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-xs text-[#8E909E] font-medium pt-1">
            <span className="flex items-center gap-1.5 text-white/70">
              <MapPin size={14} className="text-emerald-400 shrink-0" />
              VSSUT Burla
            </span>

            <Link 
              href={`/profile/${id}/connections`} 
              className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors group"
            >
              <Users size={14} className="group-hover:scale-110 transition-transform text-blue-400 shrink-0" />
              <span className="font-bold text-white">{connectionCount}</span> Connections
            </Link>

            {formattedJoinedDate && (
              <span className="flex items-center gap-1.5 text-white/60">
                <Calendar size={14} className="shrink-0" />
                Joined {formattedJoinedDate}
              </span>
            )}

            {/* Social Links */}
            {(profile.instagram_url || profile.linkedin_url) && (
              <div className="flex items-center gap-3 pl-1 sm:pl-3 sm:border-l border-white/10">
                {profile.instagram_url && (
                  <a 
                    href={profile.instagram_url.startsWith('http') ? profile.instagram_url : `https://instagram.com/${profile.instagram_url.replace('@', '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-white/50 hover:text-pink-400 transition-colors p-1"
                    title="Instagram Profile"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  </a>
                )}
                {profile.linkedin_url && (
                  <a 
                    href={profile.linkedin_url.startsWith('http') ? profile.linkedin_url : `https://${profile.linkedin_url}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-white/50 hover:text-blue-400 transition-colors p-1"
                    title="LinkedIn Profile"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                  </a>
                )}
              </div>
            )}
          </div>

        </div>

        {/* 4-Metric Academic & Community Reputation Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 my-6">
          
          <div className="bg-[#161822] border border-white/5 rounded-xl p-3 text-center">
            <span className="block text-lg sm:text-xl font-extrabold text-white leading-tight">
              {stats.discussions}
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-[#8E909E] uppercase tracking-wider">
              Discussions
            </span>
          </div>

          <div className="bg-[#161822] border border-white/5 rounded-xl p-3 text-center">
            <span className="block text-lg sm:text-xl font-extrabold text-emerald-400 leading-tight">
              {stats.solved}
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-[#8E909E] uppercase tracking-wider">
              Solved Doubts
            </span>
          </div>

          <div className="bg-[#161822] border border-white/5 rounded-xl p-3 text-center">
            <span className="block text-lg sm:text-xl font-extrabold text-[#8FAAFF] leading-tight">
              {stats.bestReplies}
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-[#8E909E] uppercase tracking-wider">
              Best Answers
            </span>
          </div>

          <div className="col-span-3 sm:col-span-1 bg-[#161822] border border-[#E8B82F]/15 rounded-xl p-3 text-center flex sm:flex-col items-center justify-between sm:justify-center px-4 sm:px-3">
            <div className="text-left sm:text-center">
              <span className="block text-lg sm:text-xl font-extrabold text-[#E8B82F] leading-tight">
                {profile.lifetime_honor || 0}
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-[#E8B82F]/70 uppercase tracking-wider">
                Honor Points
              </span>
            </div>
            <div className="sm:hidden text-right">
              <span className="text-xs font-bold text-[#E8B82F]">
                {currentHonorBadge?.name}
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 mb-6 px-4 sm:px-6 gap-2 sm:gap-6 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = 
            tab.id === 'Discussions' ? stats.discussions :
            tab.id === 'Solved Discussions' ? stats.solved :
            stats.bestReplies;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3.5 px-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap relative flex items-center gap-2 ${
                isActive ? 'text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-[#0052FF]' : 'text-white/40'} />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-[#0052FF]/20 text-[#8FAAFF]' : 'bg-white/5 text-white/40'
              }`}>
                {count}
              </span>
              
              {isActive && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0052FF] rounded-t-full shadow-[0_-2px_6px_rgba(0,82,255,0.8)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* User's Posts Feed */}
      <div className="space-y-4 px-4 sm:px-6">
        {loadingPosts ? (
          <div className="flex flex-col justify-center items-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-[#0052FF] animate-spin" />
            <p className="text-xs text-white/50">Fetching {activeTab.toLowerCase()}...</p>
          </div>
        ) : posts.length > 0 ? (
          posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onDelete={(deletedId) => setPosts(prev => prev.filter(p => p.id !== deletedId))}
              onQuickProfile={(id) => window.location.href = `/profile/${id}`}
            />
          ))
        ) : (
          <div className="text-center py-14 bg-[#161822] border border-white/5 rounded-2xl p-6">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 text-white/40 border border-white/5">
              {activeTab === 'Discussions' && <MessageSquare size={20} />}
              {activeTab === 'Solved Discussions' && <HelpCircle size={20} />}
              {activeTab === 'Best Replies' && <Award size={20} />}
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              {activeTab === 'Discussions' && 'No discussions posted yet'}
              {activeTab === 'Solved Discussions' && 'No solved doubts yet'}
              {activeTab === 'Best Replies' && 'No best answers earned yet'}
            </h3>
            <p className="text-xs text-[#8E909E] max-w-sm mx-auto">
              {activeTab === 'Discussions' && `${profile.display_name} has not started any open discussions.`}
              {activeTab === 'Solved Discussions' && `${profile.display_name} has no resolved academic discussions.`}
              {activeTab === 'Best Replies' && `${profile.display_name}'s replies haven't been selected as the best answer yet.`}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
