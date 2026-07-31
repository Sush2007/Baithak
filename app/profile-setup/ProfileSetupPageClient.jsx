"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, User, Camera, Check, AlertCircle, ArrowRight, Loader2, Sparkles, UploadCloud } from 'lucide-react';
import Button from '../../components/ui/Button';
import ProtectedRoute from '../../components/ProtectedRoute';
import Image from 'next/image';

const R2_BASE_URL = (process.env.NEXT_PUBLIC_R2_URL || 'https://pub-a45e2aa5add24ba0a8813221a09a64a9.r2.dev').replace(/\/$/, '');

const PRESET_AVATARS = Array.from({ length: 10 }, (_, i) => 
  `${R2_BASE_URL}/avatars/preset/avatar${i + 1}.png`
);

const SwipeToSubmit = ({ isSubmitting, disabled, onSubmit }) => {
  const [sliderPosition, setSliderPosition] = useState(0);
  const sliderRef = useRef(null);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const handleStart = (clientX) => {
    if (disabled || isSubmitting) return;
    isDragging.current = true;
  };

  const handleMove = (clientX) => {
    if (!isDragging.current || !containerRef.current || !sliderRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const sliderWidth = sliderRef.current.offsetWidth;
    const maxScroll = containerRect.width - sliderWidth - 8;
    let newX = clientX - containerRect.left - sliderWidth / 2;
    newX = Math.max(0, Math.min(newX, maxScroll));
    setSliderPosition(newX);
  };

  const handleEnd = () => {
    if (!isDragging.current || !containerRef.current || !sliderRef.current) return;
    isDragging.current = false;
    const containerRect = containerRef.current.getBoundingClientRect();
    const sliderWidth = sliderRef.current.offsetWidth;
    const maxScroll = containerRect.width - sliderWidth - 8;
    
    if (sliderPosition > maxScroll * 0.8) {
      setSliderPosition(maxScroll);
      onSubmit();
    } else {
      setSliderPosition(0);
    }
  };

  useEffect(() => {
    if (!isSubmitting && sliderPosition > 0) {
      setSliderPosition(0);
    }
  }, [isSubmitting]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-12 bg-bg-dark/80 rounded-xl border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] overflow-hidden select-none flex md:hidden ${disabled ? 'opacity-50' : ''}`}
    >
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-widest z-0 pointer-events-none">
        {isSubmitting ? (
           <span className="flex items-center gap-2 text-accent-yellow"><Loader2 size={14} className="animate-spin" /> Submitting...</span>
        ) : (
           "Slide to complete"
        )}
      </div>
      <div 
        ref={sliderRef}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => isDragging.current && handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        style={{ transform: `translateX(${sliderPosition}px)` }}
        className={`absolute top-1 left-1 bottom-1 w-12 bg-accent-yellow rounded-lg flex items-center justify-center z-10 ${disabled || isSubmitting ? 'cursor-not-allowed' : 'cursor-grab'} ${!isDragging.current ? 'transition-transform duration-300' : ''}`}
      >
        <ArrowRight size={16} className="text-bg-dark" />
      </div>
    </div>
  );
};

const ProfileSetupPageClient = () => {
  const { user, session, profile, signOut, refreshProfile } = useAuth();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Status & Validation States
  const [usernameError, setUsernameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  
  const fileInputRef = useRef(null);

  // Initialize fields once profile loads
  useEffect(() => {
    if (profile) {
      if (profile.display_name) setDisplayName(profile.display_name);
      if (profile.username) setUsername(profile.username);
      
      // If profile already had a custom avatar set
      if (profile.avatar_url) {
        setCustomAvatarUrl(profile.avatar_url);
      }
    }
  }, [profile]);

  // Validate Username rules
  const validateUsername = (val) => {
    const cleanVal = val.startsWith('@') ? val.slice(1) : val;
    
    if (cleanVal.trim() === '') {
      return 'Username is required.';
    }
    if (/[A-Z]/.test(cleanVal)) {
      return 'Username must be lowercase only.';
    }
    if (/\s/.test(cleanVal)) {
      return 'Username cannot contain spaces.';
    }
    if (!/^[a-z0-9_]+$/.test(cleanVal)) {
      return 'Only lowercase letters, numbers, and underscores are allowed.';
    }
    if (cleanVal.length < 3) {
      return 'Username must be at least 3 characters.';
    }
    if (cleanVal.length > 15) {
      return 'Username cannot exceed 15 characters.';
    }
    return '';
  };

  const handleUsernameChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/\s/g, '');
    setUsername(val);
    const errorMsg = validateUsername(val);
    setUsernameError(errorMsg);
  };

  // Just validate and hold the file locally
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict validation: max 4MB, must be image
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are allowed.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setUploadError('Image size must be less than 4MB.');
      return;
    }

    setUploadError('');
    setSelectedFile(file);

    // Instantly show local preview
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    
    const errorMsg = validateUsername(username);
    if (errorMsg || !username || !displayName) {
      if (errorMsg) setUsernameError(errorMsg);
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Verify Username Uniqueness
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user.id);

      if (checkError) throw checkError;

      if (existingUser && existingUser.length > 0) {
        setUsernameError('This username is already claimed by another user.');
        setIsSubmitting(false);
        return;
      }

      // 2. Upload to Cloudflare R2 if a new file is selected
      let finalAvatarUrl = customAvatarUrl;

      if (selectedFile) {
        setIsUploading(true);
        const fileExt = selectedFile.name.split('.').pop();
        const uniqueFilename = `users/${user.id}/avatars/${Date.now()}.${fileExt}`;

        const presignedRes = await fetch(
          `/api/v1/storage/presigned-url?filename=${encodeURIComponent(uniqueFilename)}&content_type=${encodeURIComponent(selectedFile.type)}`,
          { headers: { 'Authorization': `Bearer ${session?.access_token || ''}` } }
        );

        if (!presignedRes.ok) throw new Error('Failed to retrieve secure presigned upload URL.');

        const { presigned_url, public_url } = await presignedRes.json();

        const uploadRes = await fetch(presigned_url, {
          method: 'PUT',
          headers: { 'Content-Type': selectedFile.type },
          body: selectedFile
        });

        if (!uploadRes.ok) throw new Error('Failed uploading asset binary to Cloudflare R2.');
        
        finalAvatarUrl = public_url;
      }
      
      // FIX: If no custom avatar and no uploaded file, use the first preset avatar
      if (!finalAvatarUrl) {
        finalAvatarUrl = PRESET_AVATARS[0];
      }


      // 3. Save profile and complete onboarding
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username,
          display_name: displayName,
          avatar_url: finalAvatarUrl,
          setup_completed: true
        });

      if (updateError) throw updateError;

      // 4. Refresh profile state in Context (triggers router switch to /dashboard)
      await refreshProfile();

    } catch (err) {
      console.error('Profile Onboarding Failed:', err);
      setSubmitError(err.message || 'Failed saving onboarding profile details.');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const isFormValid = 
    username.trim() !== '' && 
    displayName.trim() !== '' && 
    usernameError === '' &&
    !isUploading &&
    !isSubmitting;

  return (
    <ProtectedRoute type="onboarding-only">
      <div className="min-h-screen bg-[#0C0E14] text-white font-body flex flex-col items-center justify-center py-12 px-6 select-none relative overflow-hidden">
        {/* Subtle SVG Noise Grain */}
        <div className="noise-overlay"></div>

        {/* Main Figma Form Card */}
        <div className="w-full max-w-[600px] bg-[#1A1B22] border border-white/10 rounded-[24px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] z-10 animate-fade-in relative mx-auto overflow-hidden">
          
          <div className="p-6 md:p-12 flex flex-col items-center w-full">
            
            {/* Header: Logo and Title */}
            <div className="flex flex-col items-center mb-4 space-y-2">
              <div className="flex items-center justify-center">
                <Image 
                  src="/logo.png" 
                  alt="Baithak Logo" 
                  width={140} 
                  height={45} 
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-xl md:text-2xl text-white/90 font-medium tracking-wide">
                Set up your profile
              </h1>
            </div>

            {/* Form */}
            <form id="profile-form" onSubmit={handleSubmit} className="w-full space-y-4">
              
              {/* Errors */}
              {submitError && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/15 rounded-xl px-4 py-3 flex gap-2 text-left items-center animate-fade-in">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* IDENTITY SECTION */}
              <div className="space-y-2 w-full">
                <label className="text-[11px] font-medium text-[#8E909E] tracking-widest uppercase block">
                  IDENTITY
                </label>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                  {/* Avatar Preview */}
                  <div className="relative w-20 h-20 rounded-full border border-white/10 overflow-hidden bg-black/20 shrink-0">
                    {localPreviewUrl || customAvatarUrl ? (
                      <Image 
                        src={localPreviewUrl || customAvatarUrl} 
                        alt="Avatar Preview" 
                        fill
                        sizes="80px"
                        className="object-cover"
                        unoptimized={true}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={32} className="text-white/20" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center sm:items-start gap-3 flex-1 text-center sm:text-left">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 bg-[#0052FF] hover:bg-[#0040DB] transition-colors rounded-xl flex items-center gap-2 text-sm font-medium text-white shadow-sm"
                    >
                      <UploadCloud size={16} />
                      <span>Upload Photo</span>
                    </button>
                    <p className="text-xs text-[#8E909E] leading-relaxed max-w-xs">
                      You can use your own photo or select a premium Baithak avatar.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                </div>
              </div>

              {/* CHOOSE YOUR AVATAR SECTION */}
              <div className="space-y-2 w-full">
                <label className="text-[11px] font-medium text-[#8E909E] tracking-widest uppercase block">
                  CHOOSE YOUR AVATAR
                </label>
                <div className="flex flex-wrap justify-center gap-3 md:gap-4 place-items-center">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setLocalPreviewUrl('');
                        setSelectedFile(null);
                        setCustomAvatarUrl(url);
                      }}
                      className={`relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full transition-all duration-300 overflow-hidden hover:scale-105 cursor-pointer bg-black/40 ${
                        customAvatarUrl === url && !localPreviewUrl
                          ? 'ring-2 ring-offset-2 ring-offset-[#1A1B22] ring-[#FFC300]'
                          : 'border border-transparent'
                      }`}
                    >
                      <Image src={url} alt={`Preset ${idx + 1}`} fill sizes="64px" className="object-cover" unoptimized={true} />
                    </button>
                  ))}
                </div>
              </div>

              {/* DISPLAY NAME SECTION */}
              <div className="space-y-2 w-full pt-2">
                <label className="text-[11px] font-medium text-[#8E909E] tracking-widest uppercase block">
                  DISPLAY NAME
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Aarav Sharma"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-white border border-transparent focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF]/20 rounded-xl px-4 py-3 outline-none transition-all text-sm font-medium text-black placeholder:text-gray-400"
                    required
                  />
                </div>
                <p className="text-xs text-[#8E909E]">This is the name other members will see.</p>
              </div>

              {/* USERNAME SECTION */}
              <div className="space-y-2 w-full pb-2">
                <label className="text-[11px] font-medium text-[#8E909E] tracking-widest uppercase block">
                  USERNAME
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="aarav_baithak"
                    value={username}
                    onChange={handleUsernameChange}
                    className={`w-full bg-white rounded-xl px-4 py-3 pl-8 outline-none transition-all text-sm font-medium text-black placeholder:text-gray-400 border ${
                      usernameError 
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                        : username && !usernameError 
                          ? 'border-transparent focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF]/20' 
                          : 'border-transparent focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF]/20'
                    }`}
                    required
                  />
                  <span className="absolute left-4 text-sm text-gray-400 font-mono font-medium">@</span>
                  {username && !usernameError && (
                    <Check className="text-emerald-500 absolute right-4" size={18} />
                  )}
                </div>
                {usernameError ? (
                  <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{usernameError}</span>
                  </div>
                ) : username && !usernameError ? (
                  <p className="text-xs text-emerald-500 font-medium">Username is available</p>
                ) : null}
              </div>

              {/* ACTION BUTTON */}
              <div className="w-full pt-4 flex flex-col items-center justify-center gap-4">
                {/* Desktop Button (Hidden on Mobile) */}
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="hidden md:flex w-48 bg-[#0052FF] hover:bg-[#0040DB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-xl py-3 items-center justify-center gap-2 text-sm font-medium text-white shadow-lg shadow-[#0052FF]/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                {/* Mobile Swipe to Submit (Hidden on Desktop) */}
                <SwipeToSubmit 
                  isSubmitting={isSubmitting} 
                  disabled={!isFormValid || isSubmitting} 
                  onSubmit={() => {
                    const form = document.getElementById('profile-form');
                    if (form) {
                      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    }
                  }} 
                />
              </div>

            </form>
          </div>
        </div>

        {/* Figma Footer Links */}
        <div className="w-full max-w-[600px] mx-auto mt-8 flex justify-between items-center text-[12px] text-[#8E909E] px-8 z-10">
          <button className="hover:text-white transition-colors">Privacy Policy</button>
          <button className="hover:text-white transition-colors">Terms of Service</button>
          <button className="hover:text-white transition-colors">Support Center</button>
        </div>

      </div>
    </ProtectedRoute>
  );
};

export default ProfileSetupPageClient;
