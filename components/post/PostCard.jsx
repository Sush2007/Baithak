"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { MessageSquare, ArrowUpCircle, Eye, Share2, MoreHorizontal, Bookmark, Flag, Send, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import LinkPreview from './LinkPreview';

const timeAgo = (dateStr) => {
  const date = new Date(dateStr);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "just now";
};

const PostCard = ({ post, onReport, onQuickProfile, onDelete }) => {
  const { user } = useAuth();
  const [openDropdownId, setOpenDropdownId] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes?.[0]?.count || 0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Replies State
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [repliesCount, setRepliesCount] = useState(post.comments?.[0]?.count || 0);

  useEffect(() => {
    if (user && post.id) {
      checkInteractions();
    }
  }, [user, post.id]);

  // View Tracking Logic
  const postRef = useRef(null);
  const [viewTracked, setViewTracked] = useState(false);
  const [localViewsCount, setLocalViewsCount] = useState(post.views_count || 0);

  useEffect(() => {
    if (!postRef.current || viewTracked || !user) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Unobserve and mark as tracked locally to prevent multiple fires
          observer.disconnect();
          setViewTracked(true);
          
          // Increment via Supabase RPC
          supabase.rpc('increment_view', { p_id: post.id, u_id: user.id })
            .then(({ error }) => {
              if (!error) {
                setLocalViewsCount(prev => prev + 1);
              }
            });
        }
      },
      { threshold: 0.5 } // Trigger when 50% of the post is visible
    );

    observer.observe(postRef.current);
    
    return () => observer.disconnect();
  }, [post.id, user, viewTracked]);

  const checkInteractions = async () => {
    const { data: likeData } = await supabase.from('likes').select('id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle();
    setIsLiked(!!likeData);

    const { data: bmData } = await supabase.from('bookmarks').select('post_id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle();
    if (bmData) setIsBookmarked(true);
  };

  const handleLike = () => {
    if (!user) return;
    
    // Optimistic update
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1);
    
    // Background sync
    if (wasLiked) {
      supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id).then(({error}) => {
        if (error) { setIsLiked(true); setLikesCount(prev => prev + 1); }
      });
    } else {
      supabase.from('likes').insert({ post_id: post.id, user_id: user.id }).then(({error}) => {
        if (error) { setIsLiked(false); setLikesCount(prev => Math.max(0, prev - 1)); }
      });
        
      fetch('/api/honor/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: 'RECEIVE_UPVOTE', points: 2, referenceId: post.id })
      }).catch(console.error);
    }
  };

  const handleBookmark = () => {
    if (!user) return;
    
    // Optimistic update
    const wasBookmarked = isBookmarked;
    setIsBookmarked(!wasBookmarked);
    
    // Background sync
    if (wasBookmarked) {
      supabase.from('bookmarks').delete().eq('post_id', post.id).eq('user_id', user.id).then(({error}) => {
        if (error) setIsBookmarked(true);
      });
    } else {
      supabase.from('bookmarks').insert({ post_id: post.id, user_id: user.id }).then(({error}) => {
        if (error) setIsBookmarked(false);
      });
        
      fetch('/api/honor/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: 'BOOKMARK', points: 1, referenceId: post.id })
      }).catch(console.error);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({ title: post.title, url });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const handleDeletePost = () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    // Optimistic delete
    if (onDelete) onDelete(post.id);
    
    // Background sync
    supabase.from('posts').delete().eq('id', post.id).then(({error}) => {
      if (error) {
        console.error(error);
        alert('Failed to delete post. Please refresh the page.');
      }
    });
    setOpenDropdownId(false);
  };

  const handleMarkAsSolved = async () => {
    if (!window.confirm('Mark this post as solved?')) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('posts').update({ is_solved: true }).eq('id', post.id);
      if (error) throw error;
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to mark as solved.');
    } finally {
      setIsSubmitting(false);
      setOpenDropdownId(false);
    }
  };

  const handleMarkAsBestAnswer = async (replyId) => {
    if (!window.confirm('Mark this as the Best Response? This will close the discussion.')) return;
    setIsSubmitting(true);
    try {
      // Mark the comment and post via secure RPC
      const { error: rpcError } = await supabase.rpc('mark_best_answer', { p_comment_id: replyId });
      if (rpcError) throw rpcError;

      // Award Honor Points
      await fetch('/api/honor/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: 'BEST_ANSWER', points: 15, referenceId: replyId })
      });

      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to mark as best response.');
      setIsSubmitting(false);
    }
  };

  const toggleReplies = () => {
    if (!showReplies) {
      fetchReplies();
    }
    setShowReplies(!showReplies);
  };

  const fetchReplies = async () => {
    setLoadingReplies(true);
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id, content, created_at, is_best_answer, author_id,
        profiles(username, display_name, avatar_url)
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
      
    if (!error && data) {
      setReplies(data);
    }
    setLoadingReplies(false);
  };

  const submitReply = async () => {
    if (!replyContent.trim() || !user) return;
    setIsSubmitting(true);
    try {
      // --- AI Moderation Step ---
      const modRes = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Reply to post',
          content: replyContent.trim()
        })
      });

      if (modRes.ok) {
        const modData = await modRes.json();
        if (modData.isSafe === false) {
          throw new Error(`Your reply was blocked by Auto-Moderator: ${modData.reason || 'Inappropriate content'}`);
        }
      }
      // --------------------------

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          author_id: user.id,
          content: replyContent
        })
        .select(`
          id, content, created_at, is_best_answer,
          profiles(username, display_name, avatar_url)
        `)
        .single();
        
      if (error) throw error;
      
      setReplies([...replies, data]);
      setRepliesCount(prev => prev + 1);
      setReplyContent('');
      
      // Award Honor Points
      fetch('/api/honor/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: 'HELPFUL_REPLY', points: 3, referenceId: post.id })
      }).catch(console.error);
    } catch (err) {
      console.error('Error posting reply', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article 
      ref={postRef} 
      className={`bg-[#1A1B22] border border-white/5 rounded-2xl p-4 sm:p-5 hover:border-white/10 transition-all duration-300 cursor-pointer group relative overflow-hidden ${post.isOptimistic ? 'opacity-70 pointer-events-none' : 'opacity-100'}`}
    >
      {post.isOptimistic && (
        <div className="absolute top-0 left-0 w-full h-1 bg-white/10 z-10">
          <div className="h-full bg-gradient-to-r from-[#0033A0] to-[#FFC300] w-1/3 animate-[slide_1s_ease-in-out_infinite]" />
        </div>
      )}
      {/* Post Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <div 
            onClick={(e) => { e.stopPropagation(); onQuickProfile && onQuickProfile(post.author_id); }}
            className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 cursor-pointer border border-white/10 hover:border-white/30 transition-all"
          >
            {post.profiles?.avatar_url ? (
              <Image src={post.profiles.avatar_url} alt={post.profiles.display_name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-[#8A2387] to-[#F27121] flex items-center justify-center text-sm">👤</div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span 
                onClick={(e) => { e.stopPropagation(); onQuickProfile && onQuickProfile(post.author_id); }}
                className="font-bold text-[15px] text-white hover:underline cursor-pointer"
              >
                {post.profiles?.display_name || 'Anonymous'}
              </span>
              <span className="text-[15px] text-[#8E909E]">@{post.profiles?.username || 'unknown'}</span>
              <span className="text-[15px] text-[#8E909E]">· {timeAgo(post.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setOpenDropdownId(!openDropdownId); }}
            className="text-white/30 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors"
          >
            <MoreHorizontal size={18} />
          </button>
          
          {openDropdownId && (
            <>
              <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(false); }}></div>
              <div className="absolute right-0 mt-2 w-48 bg-[#1A1B22] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-1">
                  {user?.id === post.author_id && !post.is_solved && repliesCount === 0 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleMarkAsSolved(); }}
                      disabled={isSubmitting}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#00E5FF] hover:text-[#00B3CC] hover:bg-[#00E5FF]/10 rounded-lg transition-colors text-left disabled:opacity-50"
                    >
                      <Bookmark size={16} />
                      Mark as Solved
                    </button>
                  )}
                  {user?.id === post.author_id && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeletePost(); }}
                      disabled={isSubmitting}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      Delete Post
                    </button>
                  )}
                  {user?.id !== post.author_id && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setOpenDropdownId(false); onReport && onReport(post); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                    >
                      <Flag size={16} />
                      Report Post
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="pl-0 sm:pl-[52px] space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {post.is_solved && (
            <span className="bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
              ✓ Solved
            </span>
          )}
          {post.tags?.includes('hot') && (
            <span className="bg-yellow-400 text-[#1A1B22] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Hot Topic
            </span>
          )}
          {post.tags?.filter(t => t !== 'hot').map(tag => (
            <span key={tag} className="text-[10px] text-blue-400 font-medium">#{tag}</span>
          ))}
        </div>

        <h3 className="text-lg font-bold text-white leading-snug">{post.title}</h3>
        <p className="text-[15px] text-white/80 leading-relaxed whitespace-pre-wrap">
          {post.content?.split(/((?:https?:\/\/[^\s]+)|(?:#\w+))/g).map((part, i) => {
            if (part.match(/(https?:\/\/[^\s]+)/)) {
              return <a key={i} href={part} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-blue-400 hover:underline">{part}</a>;
            } else if (part.match(/#\w+/)) {
              return <span key={i} className="text-blue-400 font-medium">{part}</span>;
            }
            return part;
          })}
        </p>

        {post.content?.match(/(https?:\/\/[^\s]+)/) && (
          <LinkPreview url={post.content.match(/(https?:\/\/[^\s]+)/)[0]} />
        )}

        {post.media_url && (
          <div className="mt-3 mb-1 rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors shadow-sm bg-black/40">
            {post.media_type === 'image' ? (
              <img src={post.media_url} alt="Post media" className="w-full h-auto object-cover max-h-[500px]" />
            ) : (
              <video src={post.media_url} controls className="w-full h-auto max-h-[500px] object-cover" />
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between sm:justify-start sm:gap-8 pt-3 border-t border-white/5 mt-4">
          <button 
            onClick={(e) => { e.stopPropagation(); handleLike(); }}
            className={`flex items-center gap-2 text-xs font-medium transition-colors group/btn ${isLiked ? 'text-green-400' : 'text-white/50 hover:text-green-400'}`}
          >
            <div className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${isLiked ? 'bg-green-400/20' : 'group-hover/btn:bg-green-400/10'}`}>
              <ArrowUpCircle size={18} className={isLiked ? 'fill-green-400/20' : ''} />
            </div>
            <span className="min-w-[20px] text-left">{likesCount}</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); toggleReplies(); }}
            className={`flex items-center gap-2 text-xs font-medium transition-colors group/btn ${showReplies ? 'text-blue-400' : 'text-white/50 hover:text-blue-400'}`}
          >
            <div className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${showReplies ? 'bg-blue-400/20' : 'group-hover/btn:bg-blue-400/10'}`}>
              <MessageSquare size={18} className={showReplies ? 'fill-blue-400/20' : ''} />
            </div>
            <span className="min-w-[20px] text-left">{repliesCount} Replies</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleBookmark(); }}
            className={`flex items-center gap-2 text-xs font-medium transition-colors group/btn ${isBookmarked ? 'text-yellow-400' : 'text-white/50 hover:text-yellow-400'}`}
          >
            <div className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${isBookmarked ? 'bg-yellow-400/20' : 'group-hover/btn:bg-yellow-400/10'}`}>
              <Bookmark size={18} className={isBookmarked ? 'fill-yellow-400' : ''} />
            </div>
          </button>
          <button className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white/80 transition-colors group/btn hidden sm:flex">
            <div className="p-1.5 rounded-full group-hover/btn:bg-white/10 transition-colors flex items-center justify-center">
              <Eye size={18} />
            </div>
            <span className="min-w-[20px] text-left">{localViewsCount.toLocaleString()}</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleShare(); }}
            className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white/80 transition-colors group/btn ml-auto"
          >
            <div className="p-1.5 rounded-full group-hover/btn:bg-white/10 transition-colors flex items-center justify-center">
              <Share2 size={18} />
            </div>
          </button>
        </div>

        {/* Replies Section */}
        {showReplies && (
          <div className="mt-3 pt-3 animate-in slide-in-from-top-2 duration-300" onClick={(e) => e.stopPropagation()}>
            {loadingReplies ? (
              <div className="flex justify-center p-4">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-0 relative ml-2">
                {/* Vertical thread line for the original post connecting to replies */}
                {replies.length > 0 && (
                   <div className="absolute left-[15px] top-[-10px] w-[2px] h-[calc(100%-20px)] bg-white/5 z-0 rounded-full" />
                )}
                
                {replies.length > 0 ? (
                  replies.map((reply, idx) => (
                    <div 
                      key={reply.id} 
                      className={`relative flex gap-3 pt-3 pb-4 px-3 mt-2 group z-10 rounded-xl transition-colors border ${
                        reply.is_best_answer 
                          ? 'bg-[#00E5FF]/5 border-[#00E5FF]/30 shadow-[0_0_15px_rgba(0,229,255,0.1)]' 
                          : 'border-transparent hover:bg-white/5'
                      }`}
                    >
                      <div className="flex flex-col items-center pt-1">
                        <div className={`relative w-8 h-8 rounded-full overflow-hidden shrink-0 border bg-[#0C0E14] ring-4 ring-[#1A1B22] ${reply.is_best_answer ? 'border-[#00E5FF]' : 'border-white/10'}`}>
                          {reply.profiles?.avatar_url ? (
                            <Image src={reply.profiles.avatar_url} alt={reply.profiles.display_name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-[#8A2387] to-[#F27121] flex items-center justify-center text-xs">👤</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5 mb-1 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span 
                              className="font-bold text-[14px] text-white hover:underline cursor-pointer truncate max-w-[120px] sm:max-w-none"
                              onClick={(e) => { e.stopPropagation(); onQuickProfile && onQuickProfile(reply.author_id); }}
                            >
                              {reply.profiles?.display_name || 'Anonymous'}
                            </span>
                            <span className="text-[14px] text-[#8E909E] truncate max-w-[100px] sm:max-w-none">@{reply.profiles?.username || 'unknown'}</span>
                            <span className="text-[14px] text-[#8E909E] shrink-0">· {timeAgo(reply.created_at)}</span>
                          </div>
                          
                          {reply.is_best_answer && (
                            <span className="bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0">
                              <Bookmark size={10} className="fill-current" /> Best Response
                            </span>
                          )}
                        </div>
                        <p className="text-[14px] text-white/90 leading-relaxed whitespace-pre-wrap break-words">{reply.content}</p>
                        
                        {/* Interactive mini-actions for replies */}
                        <div className="mt-2 flex items-center justify-end gap-2">
                          {user?.id !== reply.author_id && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onReport && onReport({ ...reply, type: 'comment' }); }}
                              className="text-[11px] font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 py-1 rounded transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                            >
                              <Flag size={12} /> Report
                            </button>
                          )}
                          {user?.id === post.author_id && !post.is_solved && !reply.is_best_answer && reply.author_id !== user?.id && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMarkAsBestAnswer(reply.id); }}
                              disabled={isSubmitting}
                              className="text-[11px] font-semibold text-[#00E5FF] hover:text-[#00B3CC] hover:bg-[#00E5FF]/10 px-2.5 py-1 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              <Bookmark size={12} /> Mark as Best Response
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-white/40 py-4">No replies yet. Be the first to start the discussion!</p>
                )}
                
                {/* Reply Input */}
                {post.is_solved ? (
                  <div className="text-center mt-4 pb-2">
                    <p className="text-sm text-white/50">This discussion has been marked as solved and is closed to new replies.</p>
                  </div>
                ) : user ? (
                  <div className="flex gap-3 mt-2 items-start pt-3 relative z-10">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10 ring-4 ring-[#1A1B22] bg-[#0C0E14]">
                      {user.user_metadata?.avatar_url || (user.identities && user.identities[0]?.identity_data?.avatar_url) ? (
                        <Image src={user.user_metadata?.avatar_url || user.identities[0]?.identity_data?.avatar_url} alt="You" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-[#0052FF] to-[#0040DB] flex items-center justify-center text-xs">👤</div>
                      )}
                    </div>
                    <div className="flex-1 relative group">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Post your reply..."
                        className="w-full bg-transparent border-none p-0 text-[15px] text-white placeholder-[#8E909E] focus:outline-none focus:ring-0 resize-none min-h-[44px] max-h-[200px] mt-1"
                        rows={1}
                        onInput={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = (e.target.scrollHeight) + 'px';
                        }}
                      />
                      <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                         <div className="text-xs text-[#8E909E]">Replying to @{post.profiles?.username || 'user'}</div>
                         <button 
                           onClick={submitReply}
                           disabled={!replyContent.trim() || isSubmitting}
                           className="px-4 py-1.5 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold text-sm rounded-full disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                         >
                           {isSubmitting ? <span className="animate-pulse">Posting...</span> : 'Reply'}
                         </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center mt-4 pb-2">
                    <p className="text-sm text-white/50">Log in to join the conversation.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default PostCard;
