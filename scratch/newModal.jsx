"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ImageIcon, Film, Trash2, Loader2, UploadCloud, HelpCircle, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import imageCompression from 'browser-image-compression';
import { toast } from 'react-hot-toast';
import { useFFmpeg } from '../../hooks/useFFmpeg';

const STANDARD_HASHTAGS = [
  'cse', 'ece', 'mech', 'civil', 'ee', 'metallurgy', 'production', 'chemical', 'architecture',
  'robotics', 'gdsc', 'music', 'dance', 'drama', 'sports', 'coding', 'photography', 'art',
  'general', 'doubt', 'placement', 'internship', 'events', 'hostel', 'academics', 'exam', 'alumni'
];

export default function OpenDiscussionModal({ isOpen, onClose }) {
  const { user, session } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Smart features state
  const [isDoubt, setIsDoubt] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [linkPreview, setLinkPreview] = useState(null);
  const [isFetchingLink, setIsFetchingLink] = useState(false);

  // Hashtag Autocomplete State
  const [hashtagOptions, setHashtagOptions] = useState([]);
  const [showHashtags, setShowHashtags] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);
  
  // FFmpeg
  const { compressVideo, progress: videoProgress, isLoading: ffmpegLoading } = useFFmpeg();

  // Derived tags
  const tags = Array.from(new Set(content.match(/#(\w+)/g) || [])).map(t => t.slice(1).toLowerCase());
  const characterCount = content.length;

  useEffect(() => {
    setMounted(true);
    // Listen for Ctrl+Enter
    const handleKeyDown = (e) => {
      if (isOpen && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (content.trim() && !isSubmitting) handleSubmit();
      }
      if (isOpen && e.key === 'Escape' && !showHashtags) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, content, isSubmitting, showHashtags]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Link preview debouncing
  useEffect(() => {
    const urlMatch = content.match(/https?:\/\/[^\s]+/);
    if (urlMatch && !linkPreview && !isFetchingLink) {
      const url = urlMatch[0];
      setIsFetchingLink(true);
      fetch('/api/link-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      .then(res => res.json())
      .then(data => {
        if (!data.error && data.title) {
          setLinkPreview(data);
        }
      })
      .catch(() => {})
      .finally(() => setIsFetchingLink(false));
    } else if (!urlMatch && linkPreview) {
      setLinkPreview(null);
    }
  }, [content]);

  const handleClose = () => {
    if ((content.trim() || title.trim() || mediaFile) && !isSubmitting) {
      if (!window.confirm("You have unsaved changes. Discard?")) return;
    }
    onClose();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error("Only images and videos are supported.");
      return;
    }
    
    if (file.size > 30 * 1024 * 1024) {
      toast.error("File size exceeds 30MB limit.");
      return;
    }

    let processedFile = file;

    if (file.type.startsWith('image/')) {
      try {
        setUploadProgress(5); 
        const options = {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 1280,
          initialQuality: 0.7,
          useWebWorker: true,
        };
        processedFile = await imageCompression(file, options);
      } catch (error) {
        console.error("Error compressing image:", error);
      } finally {
        setUploadProgress(0);
      }
    } else if (file.type.startsWith('video/')) {
      try {
        setUploadProgress(1); // Indicate compression started
        // Attempt FFmpeg compression
        processedFile = await compressVideo(file, (pct) => setUploadProgress(pct));
      } catch (error) {
        console.error("FFmpeg error, using raw file:", error);
        toast("Video compression skipped (browser unsupported). Uploading raw file.", { icon: '⚠️' });
      } finally {
        setUploadProgress(0);
      }
    }

    setMediaFile(processedFile);
    setMediaPreview(URL.createObjectURL(processedFile));
  };

  const handleMediaUpload = (e) => {
    processFile(e.target.files[0]);
  };

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
    
    const cursor = e.target.selectionStart;
    setCursorPosition(cursor);
    
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/#(\w*)$/);
    
    if (match) {
      const searchWord = match[1].toLowerCase();
      const matches = STANDARD_HASHTAGS.filter(tag => tag.includes(searchWord) && tag !== searchWord).slice(0, 5);
      
      if (matches.length > 0) {
        setHashtagOptions(matches);
        setShowHashtags(true);
      } else {
        setShowHashtags(false);
      }
    } else {
      setShowHashtags(false);
    }
  };

  const insertHashtag = (tag) => {
    const textBeforeCursor = content.slice(0, cursorPosition);
    const textAfterCursor = content.slice(cursorPosition);
    const newTextBeforeCursor = textBeforeCursor.replace(/#\w*$/, `#${tag} `);
    setContent(newTextBeforeCursor + textAfterCursor);
    setShowHashtags(false);
    
    if (textareaRef.current) {
      textareaRef.current.focus();
      setTimeout(() => {
        textareaRef.current.selectionStart = newTextBeforeCursor.length;
        textareaRef.current.selectionEnd = newTextBeforeCursor.length;
      }, 0);
    }
  };

  const removeTag = (tagToRemove) => {
    // Regex to match the hashtag (case insensitive) and optional trailing space
    const regex = new RegExp(`#${tagToRemove}\\b\\s?`, 'gi');
    setContent(content.replace(regex, ''));
  };

  const toggleDoubt = () => {
    if (isDoubt) {
      setIsDoubt(false);
      removeTag('doubt');
    } else {
      setIsDoubt(true);
      if (!tags.includes('doubt')) {
        setContent(prev => prev.trim() + ' #doubt ');
      }
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || !user || tags.length > 5) return;
    
    setIsSubmitting(true);
    const toastId = toast.loading('Preparing post...');
    
    try {
      let finalMediaUrl = null;
      let finalMediaType = null;

      if (mediaFile) {
        toast.loading('Uploading media...', { id: toastId });
        const token = session?.access_token;
        if (!token) throw new Error("Not authenticated");

        const extension = (mediaFile.name && mediaFile.name.includes('.')) 
          ? mediaFile.name.split('.').pop() 
          : (mediaFile.type.split('/')[1] || 'mp4');
        const filename = `users/${user.id}/posts/${Date.now()}.${extension}`;
        
        const res = await fetch(`/api/v1/storage/presigned-url?filename=${encodeURIComponent(filename)}&content_type=${encodeURIComponent(mediaFile.type)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to get upload URL");
        }
        const { presigned_url, public_url } = await res.json();

        const uploadRes = await fetch(presigned_url, {
          method: 'PUT',
          headers: { 'Content-Type': mediaFile.type },
          body: mediaFile
        });

        if (!uploadRes.ok) throw new Error("Failed to upload file to storage");
        
        finalMediaUrl = public_url;
        finalMediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
      }

      toast.loading('Checking content...', { id: toastId });

      // PRE-INSERT MODERATION
      const modRes = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'Discussion',
          content: content.trim(),
          mediaUrl: finalMediaUrl,
          mediaType: finalMediaType
        })
      });

      if (modRes.ok) {
        const modData = await modRes.json();
        if (modData.isSafe === false) {
          throw new Error(`Blocked by Moderator: ${modData.reason || 'Inappropriate content'}`);
        }
      }

      toast.loading('Publishing...', { id: toastId });

      // INSTANT DATABASE INSERTION
      const { data: insertedPost, error } = await supabase.from('posts').insert([
        {
          author_id: user.id,
          title: title.trim() || 'Discussion', 
          content: content.trim(),
          tags,
          media_url: finalMediaUrl,
          media_type: finalMediaType,
          is_solved: false
        }
      ]).select('*, profiles!posts_author_id_fkey(username, display_name, avatar_url)').single();

      if (error) throw error;
      
      // Award Honor Points (Fire & Forget)
      fetch('/api/honor/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'POST_CREATE',
          points: 3,
          referenceId: insertedPost.id
        })
      }).catch(() => {});

      // Inject into feed
      const formattedPost = {
        ...insertedPost,
        likes: [{ count: 0 }],
        comments: [{ count: 0 }]
      };
      window.dispatchEvent(new CustomEvent('new_post_created', { detail: formattedPost }));

      toast.success('Post created successfully!', { id: toastId });
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to post', { id: toastId, duration: 4000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-4"
         onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full h-full sm:h-auto sm:max-h-[85vh] max-w-[540px] bg-[#1E1F26] border ${isDragging ? 'border-[#0052FF] scale-[1.02]' : 'border-white/10'} sm:rounded-[16px] shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col transition-all`}>
        
        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-[#0052FF]/10 backdrop-blur-sm flex items-center justify-center rounded-[16px] pointer-events-none">
            <div className="bg-[#1E1F26] p-6 rounded-2xl shadow-xl flex flex-col items-center border border-[#0052FF]/50">
              <UploadCloud size={48} className="text-[#0052FF] mb-3 animate-bounce" />
              <p className="text-white font-bold text-lg">Drop media here</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="relative px-5 py-4 sm:px-6 sm:py-5 border-b border-white/5 shrink-0 flex justify-between items-start">
          <div className="pr-10">
            <h2 className="text-xl sm:text-[24px] font-bold text-[#E2E1EB] leading-tight">Open a Discussion</h2>
            <p className="text-[12px] sm:text-[13px] text-[#C4C5D5] mt-1">Ask a doubt, seek opinions, or share updates</p>
          </div>
          <button 
            onClick={handleClose}
            className="text-white/50 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto scrollbar-hide flex-1">
          
          {/* Smart Toggles */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={toggleDoubt}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${isDoubt ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'}`}
            >
              <HelpCircle size={14} />
              This is a Doubt
            </button>
            {/* Quick tag suggestions */}
            {!tags.includes('placement') && (
              <button onClick={() => setContent(prev => prev.trim() + ' #placement ')} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 whitespace-nowrap">
                #placement
              </button>
            )}
            {!tags.includes('academics') && (
              <button onClick={() => setContent(prev => prev.trim() + ' #academics ')} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 whitespace-nowrap">
                #academics
              </button>
            )}
          </div>

          {/* Title Field */}
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder="Title (Optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-[44px] sm:h-[40px] bg-[#0C0E14] border border-white/10 rounded-lg px-3.5 text-[14px] font-semibold text-white placeholder:text-[#8E909E] outline-none focus:border-[#0052FF]/50 transition-colors"
            />
          </div>
          
          {/* Description Field */}
          <div className="space-y-2 relative">
            <textarea 
              ref={textareaRef}
              placeholder="Share context, details, or questions... Try typing # to add tags!"
              value={content}
              onChange={handleContentChange}
              onKeyUp={(e) => setCursorPosition(e.target.selectionStart)}
              onClick={(e) => setCursorPosition(e.target.selectionStart)}
              className="w-full min-h-[120px] bg-[#0C0E14] border border-white/10 rounded-lg p-3.5 text-[14px] text-white placeholder:text-[#8E909E] outline-none focus:border-[#0052FF]/50 resize-none transition-colors"
            />
            
            {/* Character Counter */}
            <div className={`absolute bottom-3 right-3 text-[10px] font-medium ${characterCount > 2000 ? 'text-red-500' : characterCount > 1800 ? 'text-amber-500' : 'text-white/30'}`}>
              {characterCount}/2000
            </div>

            {/* Hashtag Autocomplete Popup */}
            {showHashtags && (
              <div className="absolute z-10 left-0 mt-1 w-auto min-w-[200px] bg-[#1A1B22] border border-white/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in">
                <div className="px-3 py-2 border-b border-white/5 bg-white/5">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Suggested Tags</span>
                </div>
                <div className="p-1.5 flex flex-col">
                  {hashtagOptions.map(tag => (
                    <button
                      key={tag}
                      onClick={() => insertHashtag(tag)}
                      className="text-left px-3 py-2 text-sm text-[#E2E1EB] hover:bg-[#0033A0] hover:text-white rounded transition-colors"
                    >
                      <span className="text-blue-400 mr-1">#</span>{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tag Pills */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <div key={tag} className="flex items-center gap-1.5 bg-[#0052FF]/10 text-[#8FAAFF] px-2.5 py-1 rounded-md text-[12px] font-medium border border-[#0052FF]/20">
                  <span>#{tag}</span>
                  <button onClick={() => removeTag(tag)} className="hover:text-white transition-colors">
                    <X size={12} />
                  </button>
                </div>
              ))}
              {tags.length > 5 && (
                <span className="text-[11px] text-red-400 flex items-center">Max 5 tags allowed</span>
              )}
            </div>
          )}

          {/* Smart Link Preview */}
          {linkPreview && (
            <div className="flex items-start gap-3 p-3 bg-[#0C0E14] border border-white/10 rounded-lg relative group">
              {linkPreview.images?.[0] ? (
                <img src={linkPreview.images[0]} alt="Preview" className="w-16 h-16 object-cover rounded-md shrink-0" />
              ) : (
                <div className="w-16 h-16 bg-white/5 rounded-md flex items-center justify-center shrink-0">
                  <LinkIcon size={24} className="text-white/20" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-white truncate">{linkPreview.title || linkPreview.url}</p>
                <p className="text-[11px] text-white/50 mt-1 line-clamp-2">{linkPreview.description}</p>
                <p className="text-[10px] text-white/30 mt-1 truncate">{new URL(linkPreview.url).hostname}</p>
              </div>
            </div>
          )}

          {/* Upload Media Field */}
          <div className="space-y-2">
            {!mediaPreview && uploadProgress === 0 && (
              <div className="flex gap-3">
                <label className="flex items-center gap-2 px-4 py-4 sm:py-3 bg-[#0C0E14] border border-white/10 border-dashed rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white hover:border-white/30 cursor-pointer transition-all w-full justify-center">
                  <UploadCloud size={18} className="text-[#0052FF]" />
                  <span className="font-medium text-center">Upload Image or Video</span>
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
                </label>
              </div>
            )}
            
            {uploadProgress > 0 && (
              <div className="flex flex-col justify-center p-4 border border-[#0052FF]/30 bg-[#0052FF]/5 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[12px] font-semibold text-[#8FAAFF]">
                    Compressing Media...
                  </p>
                  <span className="text-[12px] text-[#8FAAFF] font-bold">{Math.min(uploadProgress, 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#0052FF] transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {mediaPreview && uploadProgress === 0 && (
              <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-[#0C0E14]">
                {mediaFile?.type.startsWith('video/') ? (
                  <video src={mediaPreview} controls className="w-full h-auto max-h-[250px] object-cover" />
                ) : (
                  <img src={mediaPreview} alt="Preview" className="w-full h-auto max-h-[250px] object-cover" />
                )}
                <button 
                  onClick={() => { setMediaPreview(null); setMediaFile(null); }}
                  className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-all sm:opacity-0 group-hover:opacity-100 shadow-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#282A31] px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between mt-auto border-t border-white/5 shrink-0">
          <p className="hidden sm:block text-[11px] text-white/30 font-medium">
            <span className="inline-block px-1.5 py-0.5 bg-white/10 rounded mr-1">Ctrl</span> + <span className="inline-block px-1.5 py-0.5 bg-white/10 rounded mr-1">Enter</span> to post
          </p>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={handleClose}
              className="w-full sm:w-auto text-[14px] font-medium text-[#C4C5D5] hover:text-white transition-colors px-4 py-2"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting || tags.length > 5 || characterCount > 2000}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0052FF] hover:bg-[#0040CC] disabled:bg-white/10 disabled:text-white/30 text-white text-[14px] font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.1)]"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Publishing...</>
              ) : (
                "Open Discussion"
              )}
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
