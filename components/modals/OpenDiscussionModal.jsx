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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-[600px] bg-[#1E1F26] sm:rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
        
        {/* Header - Mobile friendly */}
        <div className="flex items-center justify-between px-4 py-3 sm:py-4 border-b border-white/5">
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex gap-3">
            <button 
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-white/10 disabled:text-white/30 text-white font-bold px-5 py-1.5 rounded-full text-sm transition-colors active:scale-95 flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Post'}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">
          <div className="p-4 sm:p-5 flex gap-3 sm:gap-4 flex-1">
            <div className="shrink-0">
               <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-[#0033A0] to-[#FFC300] overflow-hidden shadow-inner flex items-center justify-center">
                 {user?.user_metadata?.avatar_url ? (
                   <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                 ) : (
                   <span className="text-white/80 text-lg">👤</span>
                 )}
               </div>
            </div>
            
            <div className="flex-1 flex flex-col min-h-[150px]">
              <input 
                type="text" 
                placeholder="Title (Optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-xl sm:text-2xl font-extrabold text-white placeholder:text-white/30 outline-none mb-2"
              />
              <textarea 
                ref={textareaRef}
                placeholder="What do you want to discuss? Type # to add tags"
                value={content}
                onChange={handleContentChange}
                onKeyUp={(e) => setCursorPosition(e.target.selectionStart)}
                onClick={(e) => setCursorPosition(e.target.selectionStart)}
                className="w-full flex-1 bg-transparent text-base sm:text-lg text-white/90 placeholder:text-white/30 outline-none resize-none"
              />

              {/* Hashtag Autocomplete Popup */}
              {showHashtags && (
                <div className="relative">
                  <div className="absolute z-10 top-0 left-0 mt-1 w-auto min-w-[200px] bg-[#1A1B22] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-1.5 flex flex-col">
                      {hashtagOptions.map(tag => (
                        <button
                          key={tag}
                          onClick={() => insertHashtag(tag)}
                          className="text-left px-3 py-2 text-sm text-[#E2E1EB] hover:bg-white/10 hover:text-white rounded-lg transition-colors font-medium"
                        >
                          <span className="text-blue-400 mr-1">#</span>{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Media Preview inside the body */}
          {mediaPreview && uploadProgress === 0 && (
            <div className="px-4 sm:px-[72px] pb-4">
              <div className="relative group rounded-2xl overflow-hidden border border-white/10">
                {mediaFile?.type.startsWith('video/') ? (
                  <video src={mediaPreview} controls className="w-full h-auto max-h-[300px] object-cover bg-black/50" />
                ) : (
                  <img src={mediaPreview} alt="Preview" className="w-full h-auto max-h-[300px] object-cover bg-black/50" />
                )}
                <button 
                  onClick={() => { setMediaPreview(null); setMediaFile(null); }}
                  className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur hover:bg-black rounded-full text-white transition-all shadow-lg"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {uploadProgress > 0 && (
            <div className="px-4 sm:px-[72px] pb-4">
              <div className="flex flex-col justify-center p-4 border border-emerald-500/30 bg-emerald-500/5 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-emerald-400">
                    {uploadProgress < 100 ? 'Compressing media...' : 'Done!'}
                  </p>
                  <span className="text-xs text-emerald-400 font-bold">{Math.min(uploadProgress, 100)}%</span>
                </div>
                <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar Footer */}
        <div className="px-4 py-3 sm:px-[72px] sm:py-3 flex items-center gap-2 border-t border-white/5 bg-[#1E1F26]">
          <label className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-full cursor-pointer transition-colors">
            <ImageIcon size={20} />
            <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
          </label>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
