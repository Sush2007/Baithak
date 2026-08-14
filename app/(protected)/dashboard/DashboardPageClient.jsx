"use client";

import React, { useState, useEffect } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import Image from 'next/image';
import { MessageSquare, ArrowUpCircle, Eye, Share2, MoreHorizontal, ChevronDown, Bookmark, Flag, AlertTriangle, X } from 'lucide-react';
import QuickProfileModal from '../../../components/modals/QuickProfileModal';
import ReportModal from '../../../components/modals/ReportModal';
import PostCard from '../../../components/post/PostCard';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';

const TABS = ['For You', 'Latest', 'Trending', 'Unanswered', 'Solved'];



// Removed inline ReportModal

const DashboardPageClient = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('For You');
  const [activeTagFilter, setActiveTagFilter] = useState('All');
  const [dynamicTags, setDynamicTags] = useState(['All']);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [reportModalPost, setReportModalPost] = useState(null);
  const [quickProfileUserId, setQuickProfileUserId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const virtualizer = useWindowVirtualizer({
    count: posts.length,
    estimateSize: () => 200, // Estimated height of a PostCard
    overscan: 5,
  });

  const scrollRef = React.useRef(null);

  // Allow horizontal scrolling with mouse wheel on desktop
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [activeTab, activeTagFilter]);

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
        query = query.neq('is_solved', true).order('created_at', { ascending: false });
      } else if (activeTab === 'Solved') {
        query = query.eq('is_solved', true).order('created_at', { ascending: false });
      } else if (activeTab === 'Trending') {
        query = query.neq('is_solved', true).order('created_at', { ascending: false }); // Sort in JS by likes
      } else {
        query = query.neq('is_solved', true).order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let finalData = data || [];

      // Extract unique tags from fetched data before filtering
      const tagsSet = new Set();
      finalData.forEach(p => {
        if (p.tags && Array.isArray(p.tags)) {
          p.tags.forEach(t => tagsSet.add(t));
        }
      });
      setDynamicTags(['All', ...Array.from(tagsSet)]);
      
      if (activeTagFilter !== 'All') {
        finalData = finalData.filter(p => p.tags && p.tags.includes(activeTagFilter));
      }
      
      if (activeTab === 'Unanswered') {
        finalData = finalData.filter(p => p.comments[0]?.count === 0);
      } else if (activeTab === 'Trending') {
        finalData = finalData.sort((a, b) => (b.likes[0]?.count || 0) - (a.likes[0]?.count || 0));
      } else if (activeTab === 'For You' && user) {
        try {
          // 1. Fetch connections
          const { data: connData } = await supabase.from('connections').select('following_id').eq('follower_id', user.id);
          const followingIds = connData?.map(c => c.following_id) || [];
          
          // 2. Fetch top user interests
          const { data: interestsData } = await supabase
            .from('user_interests')
            .select('tag, interaction_score')
            .eq('user_id', user.id)
            .order('interaction_score', { ascending: false })
            .limit(10);
            
          const topTags = interestsData?.map(i => i.tag) || [];

          // 3. Score and sort posts
          const now = new Date().getTime();
          
          finalData = finalData.sort((a, b) => {
            const getScore = (post) => {
              let score = 0;
              
              // Base Connections Boost (+100)
              if (followingIds.includes(post.author_id)) score += 100;
              
              // Tag Interests Boost (+20 per matched top tag)
              if (post.tags && post.tags.length > 0) {
                post.tags.forEach(tag => {
                  if (topTags.includes(tag)) score += 20;
                });
              }
              
              // Popularity Boost (+2 per like, +3 per comment)
              score += (post.likes?.[0]?.count || 0) * 2;
              score += (post.comments?.[0]?.count || 0) * 3;
              
              // Recency Decay (Lose 1 point per hour old)
              const hoursOld = (now - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
              score -= (hoursOld * 1);
              
              return score;
            };
            
            return getScore(b) - getScore(a);
          });
          
        } catch (e) {
          console.error('Error fetching data for personalized feed:', e);
        }
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

        {/* YouTube-style Horizontal Scrollable Tags */}
        <div className="py-3 px-4 border-b border-white/5 bg-[#0C0E14]">
          <div 
            ref={scrollRef}
            className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth"
          >
            {dynamicTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTagFilter(tag)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                  activeTagFilter === tag
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {tag === 'All' ? tag : `#${tag}`}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Feed Content */}
      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center p-8">
             <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center p-8 text-white/50">No discussions found.</div>
        ) : (
          <div 
            style={{ 
              height: `${virtualizer.getTotalSize()}px`, 
              width: '100%', 
              position: 'relative' 
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const post = posts[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                    paddingBottom: '1rem',
                  }}
                >
                  <PostCard 
                    post={post} 
                    onReport={setReportModalPost} 
                    onQuickProfile={(id) => router.push(`/profile/${id}`)}
                    onDelete={(deletedId) => setPosts(prev => prev.filter(p => p.id !== deletedId))}
                  />
                </div>
              );
            })}
          </div>
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
