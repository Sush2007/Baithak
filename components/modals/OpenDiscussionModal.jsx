"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Image as ImageIcon, Film, Trash2, Loader2, UploadCloud } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import imageCompression from 'browser-image-compression';
import { toast } from 'react-hot-toast';

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

  // Hashtag Autocomplete State
  const [hashtagOptions, setHashtagOptions] = useState([]);
  const [showHashtags, setShowHashtags] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = React.useRef(null);

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 30MB)
    if (file.size > 30 * 1024 * 1024) {
      alert("File size exceeds 30MB limit.");
      return;
    }

    let processedFile = file;

    // Compress images if it's an image
    if (file.type.startsWith('image/')) {
      try {
        setIsSubmitting(true);
        // Force the progress bar to show so the user knows it's doing something
        setUploadProgress(5); 
        
        const options = {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 1280,
          initialQuality: 0.7,
          useWebWorker: false, // Prevents silent hanging on mobile browsers
        };
        processedFile = await imageCompression(file, options);
      } catch (error) {
        console.error("Error compressing image:", error);
      } finally {
        setIsSubmitting(false);
        setUploadProgress(0);
      }
    }

    setMediaFile(processedFile);
    setMediaPreview(URL.createObjectURL(processedFile));
  };

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    
    // Autocomplete logic
    const cursor = e.target.selectionStart;
    setCursorPosition(cursor);
    
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/#(\w*)$/);
    
    if (match) {
      const searchWord = match[1].toLowerCase();
      // Show matches that contain the typed characters, but don't show if they typed the whole word exactly
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
    
    // Replace the partial hashtag with the full tag
    const newTextBeforeCursor = textBeforeCursor.replace(/#\w*$/, `#${tag} `);
    
    setContent(newTextBeforeCursor + textAfterCursor);
    setShowHashtags(false);
    
    // Refocus and set cursor
    if (textareaRef.current) {
      textareaRef.current.focus();
      setTimeout(() => {
        textareaRef.current.selectionStart = newTextBeforeCursor.length;
        textareaRef.current.selectionEnd = newTextBeforeCursor.length;
      }, 0);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;
    
    // 1. Create a temporary Optimistic Post
    const tempId = `temp-${Date.now()}`;
    const optimisticPost = {
      id: tempId,
      author_id: user.id,
      title: title.trim(),
      content: content.trim(),
      media_url: mediaPreview, // Use the local Blob URL instantly!
      media_type: mediaFile ? (mediaFile.type.startsWith('video/') ? 'video' : 'image') : null,
      profiles: {
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'Unknown',
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Unknown',
        avatar_url: user.user_metadata?.avatar_url
      },
      created_at: new Date().toISOString(),
      likes: [{ count: 0 }],
      comments: [{ count: 0 }],
      isOptimistic: true // flag for the feed UI
    };

    // 2. Optimistically close modal and inject instantly into feed
    onClose();
    window.dispatchEvent(new CustomEvent('new_post_created', { detail: optimisticPost }));

    // 3. Background Upload Process
    const toastId = toast.loading('Uploading media...');
    
    (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second strict timeout
      
      try {
        let finalMediaUrl = null;
        let finalMediaType = null;

        if (mediaFile) {
          // 1. Get Session Token instantly
          const token = session?.access_token;
          if (!token) throw new Error("Not authenticated");

          // 2. Request Presigned URL
          const extension = (mediaFile.name && mediaFile.name.includes('.')) 
            ? mediaFile.name.split('.').pop() 
            : (mediaFile.type.split('/')[1] || 'jpg');
          const filename = `users/${user.id}/posts/${Date.now()}.${extension}`;
          
          const res = await fetch(`/api/v1/storage/presigned-url?filename=${encodeURIComponent(filename)}&content_type=${encodeURIComponent(mediaFile.type)}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: controller.signal
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to get upload URL");
          }
          const { presigned_url, public_url } = await res.json();

          // 3. Upload to R2
          const uploadRes = await fetch(presigned_url, {
            method: 'PUT',
            headers: { 'Content-Type': mediaFile.type },
            body: mediaFile,
            signal: controller.signal
          });

          if (!uploadRes.ok) throw new Error("Failed to upload file to storage");
          
          finalMediaUrl = public_url;
          finalMediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
        }

        const tags = [];
        const hashtagRegex = /#(\w+)/g;
        let match;
        while ((match = hashtagRegex.exec(content)) !== null) {
          const tag = match[1].toLowerCase();
          if (!tags.includes(tag)) {
            tags.push(tag);
          }
        }

        // 4. INSTANT DATABASE INSERTION!
        const { data: insertedPost, error } = await supabase.from('posts').insert([
          {
            author_id: user.id,
            title: title.trim() || 'Discussion', // Fallback title just in case
            content: content.trim(),
            tags,
            media_url: finalMediaUrl,
            media_type: finalMediaType
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
        }).catch(honorErr => console.error('Failed to award honor points', honorErr));

        // 5. BACKGROUND AI MODERATION (Fire & Forget)
        fetch('/api/moderate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId: insertedPost.id,
            title: title.trim() || 'Discussion',
            content: content.trim(),
            mediaUrl: finalMediaUrl,
            mediaType: finalMediaType
          })
        }).catch(err => console.error("Moderation error:", err));

        setTitle('');
        setContent('');
        setMediaFile(null);
        setMediaPreview(null);
        
        // Replace temp post with real post
        const formattedPost = {
          ...insertedPost,
          likes: [{ count: 0 }],
          comments: [{ count: 0 }]
        };
        window.dispatchEvent(new CustomEvent('post_upload_success', { 
          detail: { tempId, realPost: formattedPost } 
        }));

        clearTimeout(timeoutId);
        toast.success('Post created successfully!', { id: toastId });
      } catch (err) {
        clearTimeout(timeoutId);
        // Rollback the optimistic post if anything fails
        window.dispatchEvent(new CustomEvent('post_upload_failed', { detail: { tempId } }));
        toast.error(`Failed: ${err.message}`, { id: toastId });
      }
    })();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[540px] bg-[#1E1F26] border border-white/10 rounded-[12px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] animate-fade-in overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="relative px-6 py-6 border-b border-white/5">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-white/50 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
          <div className="pr-10">
            <h2 className="text-[24px] font-bold text-[#E2E1EB] leading-tight">Open a Discussion</h2>
            <p className="text-[13px] text-[#C4C5D5] mt-1.5">Ask a doubt, seek opinions, or start a meaningful conversation</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[65vh] scrollbar-hide">
          {/* Title Field */}
          <div className="space-y-2.5">
            <label className="block text-[12px] font-semibold text-[#E2E1EB] uppercase tracking-wider">
              DISCUSSION TITLE (OPTIONAL)
            </label>
            <input 
              type="text" 
              placeholder="Enter a descriptive title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-[40px] bg-[#0C0E14] border border-white/10 rounded-lg px-3.5 text-[14px] text-white placeholder:text-[#8E909E] outline-none focus:border-[#0033A0] transition-colors"
            />
          </div>
          
          {/* Description Field */}
          <div className="space-y-2.5 relative">
            <label className="block text-[12px] font-semibold text-[#E2E1EB] uppercase tracking-wider">
              DISCUSSION DESCRIPTION
            </label>
            <textarea 
              ref={textareaRef}
              placeholder="Share more context, details, or questions... Try typing # to add tags!"
              value={content}
              onChange={handleContentChange}
              onKeyUp={(e) => setCursorPosition(e.target.selectionStart)}
              onClick={(e) => setCursorPosition(e.target.selectionStart)}
              className="w-full min-h-[100px] bg-[#0C0E14] border border-white/10 rounded-lg p-3.5 text-[14px] text-white placeholder:text-[#8E909E] outline-none focus:border-[#0033A0] resize-none transition-colors"
            />
            {/* Hashtag Autocomplete Popup */}
            {showHashtags && (
              <div className="absolute z-10 left-0 mt-1 w-auto min-w-[200px] bg-[#1A1B22] border border-white/10 rounded-lg shadow-xl overflow-hidden animate-fade-in">
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
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Upload Media Field */}
          <div className="space-y-2.5">
            <label className="block text-[12px] font-semibold text-[#E2E1EB] uppercase tracking-wider">
              UPLOAD MEDIA (OPTIONAL)
            </label>
            {!mediaPreview && uploadProgress === 0 && (
              <div className="flex gap-3">
                <label className="flex items-center gap-2 px-4 py-3 bg-[#0C0E14] border border-white/10 border-dashed rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white hover:border-white/30 cursor-pointer transition-all w-full justify-center">
                  <UploadCloud size={18} className="text-[#0033A0]" />
                  <span className="font-medium">Upload Image or Video (Max 30MB)</span>
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
                </label>
              </div>
            )}
            
            {uploadProgress > 0 && (
              <div className="flex flex-col justify-center p-6 border border-white/10 bg-[#0C0E14] rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[13px] font-semibold text-[#E2E1EB]">
                    {uploadProgress < 100 ? 'Uploading & Compressing...' : 'Processing complete!'}
                  </p>
                  <span className="text-[12px] text-[#FFC300] font-bold">{Math.min(uploadProgress, 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#0033A0] to-[#FFC300] transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-white/40 mt-3 flex items-center gap-1.5">
                  <Loader2 size={12} className={uploadProgress < 100 ? "animate-spin" : "hidden"} />
                  High-efficiency codec applied
                </p>
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
                  className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#282A31] px-6 py-5 flex items-center justify-end gap-3 mt-auto border-t border-white/5">
          <button 
            onClick={onClose}
            className="text-[14px] font-medium text-[#C4C5D5] hover:text-white transition-colors px-4 py-2"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="flex items-center gap-2 bg-[#003B95] hover:bg-[#002B73] disabled:bg-[#003B95]/50 disabled:text-white/50 text-white text-[14px] font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.1)]"
          >
            {isSubmitting ? (
              <><Loader2 size={16} className="animate-spin" /> Posting...</>
            ) : (
              "Open Discussion"
            )}
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
