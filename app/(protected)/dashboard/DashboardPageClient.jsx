"use client";
import { feedCache } from '../../../lib/cache';


import React, { useState, useEffect } from 'react';

import Image from 'next/image';
import { MessageSquare, ArrowUpCircle, Eye, Share2, MoreHorizontal, ChevronDown, Bookmark, Flag, AlertTriangle, X } from 'lucide-react';
import dynamic from 'next/dynamic';
const QuickProfileModal = dynamic(() => import('../../../components/modals/QuickProfileModal'), { ssr: false });
const ReportModal = dynamic(() => import('../../../components/modals/ReportModal'), { ssr: false });
import PostCard from '../../../components/post/PostCard';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';

const TABS = ['For You', 'Unanswered', 'Solved'];



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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pageOffset, setPageOffset] = useState(0);
  const POSTS_PER_PAGE = 10;
  
  

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

  // When tab or tag filter changes, reset and fetch page 0
  useEffect(() => {
    setPosts([]);
    setPageOffset(0);
    setHasMore(true);
    fetchPosts(0, true);
  }, [activeTab, activeTagFilter]);

  // Infinite Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      if (loading || loadingMore || !hasMore) return;
      
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 800; // Load 800px before bottom
      
      if (scrollPosition >= threshold) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, loadingMore, hasMore, pageOffset, activeTab, activeTagFilter]);

    // Listen for optimistic post creation and resolution
    useEffect(() => {
      const handleNewPost = (e) => {
        const newPost = e.detail;
        if (activeTab === 'For You' || activeTab === 'Unanswered') {
          // Check if it already exists to avoid duplicates
          setPosts(prev => {
            if (prev.some(p => p.id === newPost.id)) return prev;
            return [newPost, ...prev];
          });
        }
      };

      const handlePostSuccess = (e) => {
        const { tempId, realPost } = e.detail;
        setPosts(prev => prev.map(p => p.id === tempId ? realPost : p));
      };

      const handlePostFailed = (e) => {
        const { tempId } = e.detail;
        setPosts(prev => prev.filter(p => p.id !== tempId));
      };

      window.addEventListener('new_post_created', handleNewPost);
      window.addEventListener('post_upload_success', handlePostSuccess);
      window.addEventListener('post_upload_failed', handlePostFailed);
      
      return () => {
        window.removeEventListener('new_post_created', handleNewPost);
        window.removeEventListener('post_upload_success', handlePostSuccess);
        window.removeEventListener('post_upload_failed', handlePostFailed);
      };
    }, [activeTab]);

  const fetchPosts = async (offset = 0, isInitial = false) => {
    if (!hasMore && !isInitial) return;
    
    try {
      if (isInitial) {
        const cached = feedCache.get(`${activeTab}-${activeTagFilter}`);
        if (cached) {
          setPosts(cached);
          setLoading(false);
          // fetch silently in background to validate
        } else {
          setLoading(true);
        }
      } else {
        setLoadingMore(true);
      }

      const { data, error } = await supabase.rpc('get_feed_posts', {
        p_user_id: user?.id || null,
        p_tab: activeTab,
        p_tag_filter: activeTagFilter,
        p_limit: POSTS_PER_PAGE,
        p_offset: offset
      });

      if (error) throw error;
      
      const newPosts = data || [];
      
      // Since the RPC returns flat columns (author_username, etc), we map them to match the expected format
      const formattedPosts = newPosts.map(p => ({
        ...p,
        profiles: {
          username: p.author_username,
          display_name: p.author_display_name,
          avatar_url: p.author_avatar_url
        },
        likes: [{ count: Number(p.likes_count) }],
        comments: [{ count: Number(p.comments_count) }]
      }));

      if (isInitial) {
        setPosts(formattedPosts);
        
        // Only fetch all tags once on initial load (for the tag filter UI)
        if (activeTagFilter === 'All') {
           const { data: allTagsData } = await supabase.from('posts').select('tags');
           const tagsSet = new Set();
           allTagsData?.forEach(p => {
             if (p.tags && Array.isArray(p.tags)) {
               p.tags.forEach(t => tagsSet.add(t));
             }
           });
           setDynamicTags(['All', ...Array.from(tagsSet)]);
        }
      } else {
        setPosts(prev => [...prev, ...formattedPosts]);
        if (isInitial && formattedPosts.length > 0) {
          feedCache.set(`${activeTab}-${activeTagFilter}`, formattedPosts);
        }
      }
      
      setHasMore(newPosts.length === POSTS_PER_PAGE);

    } catch (err) {
      console.error('Error fetching posts:', err.message);
    } finally {
      if (isInitial) setLoading(false);
      else setLoadingMore(false);
    }
  };

  const loadMore = () => {
    const nextOffset = pageOffset + POSTS_PER_PAGE;
    setPageOffset(nextOffset);
    fetchPosts(nextOffset, false);
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
            <div className="space-y-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-[#1A1B22] border-b border-white/5 sm:border sm:border-white/5 sm:rounded-2xl p-4 sm:p-5 shadow-lg shadow-black/20 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 bg-white/10 rounded-full shrink-0"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-white/10 rounded w-1/4"></div>
                      <div className="h-3 bg-white/5 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-5 bg-white/10 rounded w-3/4"></div>
                    <div className="h-4 bg-white/5 rounded w-full"></div>
                    <div className="h-4 bg-white/5 rounded w-full"></div>
                    <div className="h-4 bg-white/5 rounded w-5/6"></div>
                  </div>
                  <div className="flex gap-6 mt-6 pt-4 border-t border-white/5">
                    <div className="w-12 h-4 bg-white/10 rounded"></div>
                    <div className="w-12 h-4 bg-white/10 rounded"></div>
                    <div className="w-12 h-4 bg-white/10 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
          <div className="text-center p-8 text-white/50">No discussions found.</div>
        ) : (
          <>
            <div className="space-y-4">
              {posts.map((post) => {
                return (
                  <div key={post.id} className="pb-4">
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
            
            {loadingMore && (
              <div className="flex justify-center p-8 mb-8">
                 <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {!hasMore && posts.length > 0 && (
              <div className="text-center p-8 mb-8 text-white/40 text-sm">
                You have reached the end of the feed.
              </div>
            )}
          </>
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
