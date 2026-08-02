"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Image as ImageIcon, Film, Trash2, Loader2, UploadCloud } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import imageCompression from 'browser-image-compression';

export default function OpenDiscussionModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [branch, setBranch] = useState('');
  const [club, setClub] = useState('');
  const [isGeneral, setIsGeneral] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        processedFile = await imageCompression(file, options);
      } catch (error) {
        console.error("Error compressing image:", error);
      }
    }

    setMediaFile(processedFile);
    setMediaPreview(URL.createObjectURL(processedFile));
  };

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;
    
    setIsSubmitting(true);
    let finalMediaUrl = null;
    let finalMediaType = null;

    try {
      if (mediaFile) {
        setUploadProgress(10);
        
        // 1. Get Session Token
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) throw new Error("Not authenticated");

        // 2. Request Presigned URL
        const extension = mediaFile.name.split('.').pop();
        const filename = `users/${user.id}/posts/${Date.now()}.${extension}`;
        const res = await fetch(`/api/v1/storage/presigned-url?filename=${encodeURIComponent(filename)}&content_type=${encodeURIComponent(mediaFile.type)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to get upload URL");
        }
        const { presigned_url, public_url } = await res.json();
        setUploadProgress(50);

        // 3. Upload to R2
        const uploadRes = await fetch(presigned_url, {
          method: 'PUT',
          headers: { 'Content-Type': mediaFile.type },
          body: mediaFile
        });

        if (!uploadRes.ok) throw new Error("Failed to upload file to storage");
        
        finalMediaUrl = public_url;
        finalMediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
        setUploadProgress(90);
      }

      const tags = [];
      if (branch) tags.push(branch);
      if (club) tags.push(club);
      if (isGeneral) tags.push('general');

      // Extract hashtags
      const hashtagRegex = /#(\w+)/g;
      let match;
      while ((match = hashtagRegex.exec(content)) !== null) {
        const tag = match[1].toLowerCase();
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      }

      const { error } = await supabase.from('posts').insert([
        {
          author_id: user.id,
          title: title.trim(),
          content: content.trim(),
          tags,
          media_url: finalMediaUrl,
          media_type: finalMediaType
        }
      ]);

      if (error) throw error;
      
      setTitle('');
      setContent('');
      setBranch('');
      setClub('');
      setMediaFile(null);
      setMediaPreview(null);
      setIsGeneral(false);
      setUploadProgress(100);
      onClose();
      
      window.location.reload();
      
    } catch (err) {
      console.error('Error creating post:', err.message);
      alert(`Failed to post discussion: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
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
          <div className="space-y-2.5">
            <label className="block text-[12px] font-semibold text-[#E2E1EB] uppercase tracking-wider">
              DISCUSSION DESCRIPTION
            </label>
            <textarea 
              placeholder="Share more context, details, or questions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[100px] bg-[#0C0E14] border border-white/10 rounded-lg p-3.5 text-[14px] text-white placeholder:text-[#8E909E] outline-none focus:border-[#0033A0] resize-none transition-colors"
            />
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

          {/* Selectors Row */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-2.5">
              <label className="block text-[12px] font-semibold text-[#E2E1EB] uppercase tracking-wider">
                SELECT BRANCH
              </label>
              <div className="relative">
                <select 
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full h-[40px] bg-[#0C0E14] border border-white/10 rounded-lg pl-3.5 pr-9 text-[14px] text-white appearance-none outline-none focus:border-[#0033A0] transition-colors"
                >
                  <option value="" disabled className="text-[#8E909E]">Select...</option>
                  <option value="cse">Computer Science</option>
                  <option value="ece">Electronics</option>
                  <option value="mech">Mechanical</option>
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              <label className="block text-[12px] font-semibold text-[#E2E1EB] uppercase tracking-wider">
                SELECT CLUB
              </label>
              <div className="relative">
                <select 
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  className="w-full h-[40px] bg-[#0C0E14] border border-white/10 rounded-lg pl-3.5 pr-9 text-[14px] text-white appearance-none outline-none focus:border-[#0033A0] transition-colors"
                >
                  <option value="" disabled className="text-[#8E909E]">Select...</option>
                  <option value="robotics">Robotics Club</option>
                  <option value="gdsc">GDSC</option>
                  <option value="music">Music Club</option>
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* General Toggle */}
          <div className="bg-[#1A1B22] border border-white/5 rounded-lg p-3.5 flex justify-between items-center">
            <div>
              <h3 className="text-[14px] text-[#E2E1EB]">Post as General</h3>
              <p className="text-[12px] text-[#C4C5D5] mt-0.5">Make this discussion visible to all departments</p>
            </div>
            <button 
              onClick={() => setIsGeneral(!isGeneral)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 cursor-pointer ${isGeneral ? 'bg-[#0033A0]' : 'bg-white/10'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isGeneral ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
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
