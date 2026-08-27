"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { User, Bell, Shield, Award, AlertTriangle, Edit2, CheckCircle2, ChevronRight, LogOut, Trash2, Link as LinkIcon, Save } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { usePushNotifications } from '../../../hooks/usePushNotifications';
import { getCurrentHonorBadge, getNextHonorBadge } from '../../../lib/badges';
import Link from 'next/link';

const R2_BASE_URL = (process.env.NEXT_PUBLIC_R2_URL || 'https://pub-a45e2aa5add24ba0a8813221a09a64a9.r2.dev').replace(/\/$/, '');

const PRESET_AVATARS = Array.from({ length: 10 }, (_, i) => 
  `${R2_BASE_URL}/avatars/preset/avatar${i + 1}.png`
);

export default function SettingsPage() {
  const { profile, user, session, refreshProfile } = useAuth();
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();
  
  const currentBadge = getCurrentHonorBadge(profile?.lifetime_honor || 0);
  const nextBadge = getNextHonorBadge(profile?.lifetime_honor || 0);
  const hp = profile?.lifetime_honor || 0;
  
  // Calculate percentage
  let percentage = 100;
  if (nextBadge) {
    const prevRequirement = currentBadge?.requirement || 0;
    const pointsNeeded = nextBadge.requirement - prevRequirement;
    const pointsEarned = hp - prevRequirement;
    percentage = Math.min(100, Math.max(0, (pointsEarned / pointsNeeded) * 100));
  }
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    username: '',
    bio: '',
    instagram_url: '',
    linkedin_url: '',
    cover_url: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  
  const coverInputRef = useRef(null);
  const [coverFile, setCoverFile] = useState(null);
  const [localCoverUrl, setLocalCoverUrl] = useState('');
  
  const avatarInputRef = useRef(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        username: profile.username || '',
        bio: profile.bio || 'Exploring the intersections of distributed systems and artificial intelligence.',
        instagram_url: profile.instagram_url || '',
        linkedin_url: profile.linkedin_url || '',
        cover_url: profile.cover_url || ''
      });
    }
  }, [profile]);

  const [toggles, setToggles] = useState({
    replies: true,
    bestAnswer: true,
    honorPoints: true,
    mentions: true,
    verification: true,
    platform: false,
  });

  const handleToggle = (key) => setToggles(prev => ({ ...prev, [key]: !prev[key] }));

  // Username Limit Calculation
  const lastChange = profile?.last_username_change ? new Date(profile.last_username_change) : null;
  const daysSinceChange = lastChange ? Math.floor((new Date() - lastChange) / (1000 * 60 * 60 * 24)) : null;
  const canChangeUsername = !lastChange || daysSinceChange >= 15;
  const daysUntilCanChange = canChangeUsername ? 0 : 15 - daysSinceChange;

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Import here if dynamic, but usually better at top level. Let's assume standard import at top.
      // Wait, let's just use it and rely on top-level import.
      const imageCompression = (await import('browser-image-compression')).default;

      let finalCoverUrl = formData.cover_url;
      let finalAvatarUrl = profile?.avatar_url || '';

      const compressOptions = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1280,
        initialQuality: 0.7,
        useWebWorker: true,
      };

      if (coverFile) {
        let processedCover = coverFile;
        if (coverFile.type.startsWith('image/')) {
          processedCover = await imageCompression(coverFile, { ...compressOptions, maxWidthOrHeight: 1920 });
        }
        const fileExt = processedCover.name.split('.').pop();
        const uniqueFilename = `users/${user.id}/covers/${Date.now()}.${fileExt}`;
        const presignedRes = await fetch(
          `/api/v1/storage/presigned-url?filename=${encodeURIComponent(uniqueFilename)}&content_type=${encodeURIComponent(processedCover.type)}`,
          { headers: { 'Authorization': `Bearer ${session?.access_token || ''}` } }
        );
        if (!presignedRes.ok) throw new Error('Failed to retrieve secure presigned upload URL.');
        const { presigned_url, public_url } = await presignedRes.json();
        const uploadRes = await fetch(presigned_url, {
          method: 'PUT',
          headers: { 'Content-Type': processedCover.type },
          body: processedCover
        });
        if (!uploadRes.ok) throw new Error('Failed uploading cover to storage.');
        finalCoverUrl = public_url;
      }

      if (avatarFile) {
        let processedAvatar = avatarFile;
        if (avatarFile.type.startsWith('image/')) {
          processedAvatar = await imageCompression(avatarFile, { ...compressOptions, maxWidthOrHeight: 800 });
        }
        const fileExt = processedAvatar.name.split('.').pop();
        const uniqueFilename = `users/${user.id}/avatars/${Date.now()}.${fileExt}`;
        const presignedRes = await fetch(
          `/api/v1/storage/presigned-url?filename=${encodeURIComponent(uniqueFilename)}&content_type=${encodeURIComponent(processedAvatar.type)}`,
          { headers: { 'Authorization': `Bearer ${session?.access_token || ''}` } }
        );
        if (!presignedRes.ok) throw new Error('Failed to retrieve secure presigned upload URL.');
        const { presigned_url, public_url } = await presignedRes.json();
        const uploadRes = await fetch(presigned_url, {
          method: 'PUT',
          headers: { 'Content-Type': processedAvatar.type },
          body: processedAvatar
        });
        if (!uploadRes.ok) throw new Error('Failed uploading avatar to storage.');
        finalAvatarUrl = public_url;
      }

      const updateData = {
        display_name: formData.display_name,
        username: formData.username,
        bio: formData.bio,
        instagram_url: formData.instagram_url,
        linkedin_url: formData.linkedin_url,
        cover_url: finalCoverUrl
      };
      
      if (avatarFile) {
        updateData.avatar_url = finalAvatarUrl;
      } else if (customAvatarUrl) {
        updateData.avatar_url = customAvatarUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
      
      if (error) throw error;
      if (refreshProfile) await refreshProfile();
      setIsEditing(false);
      setCoverFile(null);
      setAvatarFile(null);
      setCustomAvatarUrl('');
      // Optional: alert success or rely on local state
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.message?.includes('15 days')) {
        alert('Username can only be changed once every 15 days.');
      } else {
        alert('Failed to update profile: ' + error.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to permanently delete your account? This will erase all your posts, comments, and honor points. This action cannot be undone.")) {
      try {
        const res = await fetch('/api/user/delete', { method: 'POST' });
        if (!res.ok) throw new Error('Failed to delete account');
        
        await supabase.auth.signOut();
        window.location.href = '/';
      } catch (err) {
        alert('Could not delete account. Please try again.');
        console.error(err);
      }
    }
  };

  const ToggleSwitch = ({ checked, onChange }) => (
    <button 
      onClick={onChange}
      className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex ${checked ? 'bg-blue-600 justify-end' : 'bg-white/10 justify-start'}`}
    >
      <div className="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform" />
    </button>
  );

  return (
    <div className="max-w-3xl w-full mx-auto pb-20 md:pb-12 space-y-8 mt-4 md:mt-0 px-2 md:px-0">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Settings</h1>
        <p className="text-sm text-[#8E909E]">Manage your account, verification, and preferences.</p>
      </div>

      {/* 👤 Account */}
      <section className="bg-[#1A1B22] border border-white/5 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-white">
            <User size={18} className="text-blue-400" />
            <h2 className="text-base font-semibold">Account</h2>
          </div>
          {isEditing ? (
            <button 
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex items-center gap-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg border border-blue-500 transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 text-xs font-medium bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
            >
              <Edit2 size={14} />
              Edit Profile
            </button>
          )}
        </div>
        
        <div className="space-y-6">
          {/* Cover & Avatar */}
          <div className="flex flex-col gap-4">
            <div 
              className={`w-full h-32 bg-[#2A2B32] rounded-xl overflow-hidden relative group border border-white/5 ${isEditing ? 'cursor-pointer' : ''}`}
              onClick={() => isEditing && coverInputRef.current?.click()}
            >
              {(localCoverUrl || profile?.cover_url) && (
                <Image src={localCoverUrl || profile.cover_url} alt="Cover" fill className="object-cover" unoptimized={true} />
              )}
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-medium text-white flex items-center gap-1"><Edit2 size={12}/> Click to Upload Cover</span>
                </div>
              )}
              <input 
                type="file" 
                ref={coverInputRef} 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCoverFile(file);
                    setLocalCoverUrl(URL.createObjectURL(file));
                  }
                }} 
              />
            </div>
            
            <div className="flex items-end gap-4 -mt-10 px-4">
              <div 
                className={`w-20 h-20 rounded-full border-4 border-[#1A1B22] bg-[#2A2B32] overflow-hidden relative group z-10 shrink-0 ${isEditing ? 'cursor-pointer' : ''}`}
                onClick={() => isEditing && avatarInputRef.current?.click()}
              >
                {(localAvatarUrl || customAvatarUrl || profile?.avatar_url) ? (
                  <Image src={localAvatarUrl || customAvatarUrl || profile.avatar_url} alt="Avatar" fill className="object-cover" unoptimized={true} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-[#8A2387] to-[#F27121] flex items-center justify-center text-2xl">👤</div>
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit2 size={14} className="text-white" />
                  </div>
                )}
                <input 
                  type="file" 
                  ref={avatarInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAvatarFile(file);
                      setLocalAvatarUrl(URL.createObjectURL(file));
                      setCustomAvatarUrl('');
                    }
                  }} 
                />
              </div>
              <div className="flex-1 pb-1">
                <h3 className="text-sm font-semibold text-white">Profile Picture</h3>
                <p className="text-[11px] text-[#8E909E]">Recommended: 512x512px</p>
              </div>
            </div>

            {/* PRESET AVATARS UI */}
            {isEditing && (
              <div className="px-4 mt-2">
                <p className="text-[11px] font-bold text-[#8E909E] uppercase tracking-wider mb-3">Or choose an avatar</p>
                <div className="flex flex-wrap gap-3">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setLocalAvatarUrl('');
                        setAvatarFile(null);
                        setCustomAvatarUrl(url);
                      }}
                      className={`relative w-12 h-12 rounded-full transition-all duration-300 overflow-hidden hover:scale-105 cursor-pointer bg-black/40 ${
                        (customAvatarUrl === url || (!customAvatarUrl && !localAvatarUrl && profile?.avatar_url === url))
                          ? 'ring-2 ring-offset-2 ring-offset-[#1A1B22] ring-[#FFC300]'
                          : 'border border-transparent'
                      }`}
                    >
                      <Image src={url} alt={`Preset ${idx + 1}`} fill sizes="48px" className="object-cover" unoptimized={true} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#8E909E] uppercase tracking-wider pl-1">Display Name</label>
              <input 
                type="text" 
                disabled={!isEditing}
                value={formData.display_name} 
                onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                className="w-full bg-[#0C0E14] border border-white/5 rounded-xl px-4 py-3 text-[15px] font-medium text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:text-white/40 disabled:bg-[#0C0E14]/50 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#8E909E] uppercase tracking-wider pl-1 flex items-center justify-between">
                <span>Username</span>
                <span className={`text-[10px] lowercase font-semibold border px-2 py-0.5 rounded-full ${canChangeUsername ? 'text-[#8E909E] border-white/10' : 'text-red-400 border-red-500/20 bg-red-500/10'}`}>
                  {canChangeUsername ? 'change limit: once every 15 days' : `Available in ${daysUntilCanChange} days`}
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-medium">@</span>
                <input 
                  type="text" 
                  disabled={!isEditing || !canChangeUsername}
                  value={formData.username} 
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className={`w-full bg-[#0C0E14] border border-white/5 rounded-xl pl-9 pr-4 py-3 text-[15px] font-medium text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:text-white/40 disabled:bg-[#0C0E14]/50 transition-all ${(!isEditing || !canChangeUsername) ? 'cursor-not-allowed' : ''}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#8E909E] uppercase tracking-wider pl-1">Bio</label>
              <textarea 
                disabled={!isEditing}
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                className="w-full bg-[#0C0E14] border border-white/5 rounded-xl px-4 py-3 text-[15px] font-medium text-white outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:text-white/40 disabled:bg-[#0C0E14]/50 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#8E909E] uppercase tracking-wider pl-1 flex items-center gap-1.5">
                <LinkIcon size={14} className="text-pink-500" /> Instagram Link
              </label>
              <input 
                type="url" 
                disabled={!isEditing}
                placeholder="https://instagram.com/yourusername"
                value={formData.instagram_url}
                onChange={(e) => setFormData({...formData, instagram_url: e.target.value})}
                className="w-full bg-[#0C0E14] border border-white/5 rounded-xl px-4 py-3 text-[15px] font-medium text-white placeholder:text-white/20 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 disabled:text-white/40 disabled:bg-[#0C0E14]/50 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#8E909E] uppercase tracking-wider pl-1 flex items-center gap-1.5">
                <LinkIcon size={14} className="text-blue-500" /> LinkedIn Link
              </label>
              <input 
                type="url" 
                disabled={!isEditing}
                placeholder="https://linkedin.com/in/yourusername"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
                className="w-full bg-[#0C0E14] border border-white/5 rounded-xl px-4 py-3 text-[15px] font-medium text-white placeholder:text-white/20 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:text-white/40 disabled:bg-[#0C0E14]/50 transition-all"
              />
            </div>
          </div>
        </div>
      </section>



      {/* 🔔 Notifications */}
      <section className="bg-[#1A1B22] border border-white/5 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6 text-white">
          <Bell size={18} className="text-yellow-400" />
          <h2 className="text-base font-semibold">Notifications</h2>
        </div>
        
        <div className="space-y-1">
          {/* Push Notifications Toggle */}
          {isSupported && (
            <div className="flex items-center justify-between py-4 border-b border-white/5 bg-[#1d9bf0]/5 rounded-xl px-4 mb-2">
              <div>
                <span className="text-sm font-bold text-white block">Device Push Notifications</span>
                <span className="text-xs text-white/50">Receive alerts even when the app is closed</span>
              </div>
              <button 
                onClick={isSubscribed ? unsubscribe : subscribe}
                disabled={isLoading}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors disabled:opacity-50 ${isSubscribed ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-[#1d9bf0] text-white hover:bg-[#1a8cd8]'}`}
              >
                {isLoading ? 'Wait...' : isSubscribed ? 'Disable' : 'Enable'}
              </button>
            </div>
          )}

          {[
            { id: 'replies', label: 'Replies to My Discussions' },
            { id: 'bestAnswer', label: 'Best Answer Selected' },
            { id: 'honorPoints', label: 'Honor Points Earned' },
            { id: 'mentions', label: 'Mentions (@username)' },
            { id: 'verification', label: 'Verification Updates' },
          ].map((item, idx) => (
            <div key={item.id} className={`flex items-center justify-between py-3 ${idx !== 4 ? 'border-b border-white/5' : ''}`}>
              <span className="text-sm text-white/90">{item.label}</span>
              <ToggleSwitch checked={toggles[item.id]} onChange={() => handleToggle(item.id)} />
            </div>
          ))}
        </div>
      </section>

      {/* 🎖 Honor Points */}
      <section className="bg-[#1A1B22] border border-white/5 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6 text-white">
          <Award size={18} className="text-[#FFC300]" />
          <h2 className="text-base font-semibold">Honor Points</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#0C0E14] border border-white/5 rounded-xl p-4 text-center">
            <p className="text-[10px] text-[#8E909E] uppercase font-bold tracking-wider mb-2">Current Points</p>
            <p className="text-2xl font-bold text-white">{hp.toLocaleString()}</p>
          </div>
          <div className="bg-[#0C0E14] border border-white/5 rounded-xl p-4 text-center flex flex-col items-center justify-center">
            <p className="text-[10px] text-[#8E909E] uppercase font-bold tracking-wider mb-2">Current Badge</p>
            <p className="text-sm font-bold text-[#FFC300] whitespace-nowrap">{currentBadge?.name || 'Loading...'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-white/80">Badge Progress: {nextBadge ? nextBadge.name : 'Max Level Reached'}</span>
              <span className="text-[#FFC300]">{hp} / {nextBadge ? nextBadge.requirement : hp}</span>
            </div>
            <div className="w-full bg-[#0C0E14] rounded-full h-1.5 overflow-hidden border border-white/5">
              <div className="bg-gradient-to-r from-[#FFC300] to-[#FF8C00] h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
            </div>
          </div>
          
          <Link href="/dashboard/honor" className="w-full bg-[#0C0E14] border border-white/5 hover:border-white/10 rounded-xl px-4 py-3 text-sm text-left text-white transition-colors flex items-center justify-between group mt-2">
            <span className="font-medium text-[#8E909E] group-hover:text-white transition-colors">View Honor Point History</span>
            <ChevronRight size={16} className="text-[#8E909E] group-hover:text-white transition-colors" />
          </Link>
        </div>
      </section>

      {/* Account Actions & Danger Zone */}
      <section className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="space-y-3">

          
          <button 
            onClick={handleLogout}
            className="w-full bg-[#0C0E14]/80 border border-red-500/10 hover:bg-red-500/10 rounded-xl px-4 py-3 text-sm text-left text-red-400 transition-colors flex items-center gap-3"
          >
            <LogOut size={16} />
            <span className="font-medium">Log Out</span>
          </button>
          
          <button 
            onClick={handleDeleteAccount}
            className="w-full bg-[#0C0E14]/80 border border-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl px-4 py-3 text-sm text-left transition-colors flex items-center gap-3 group"
          >
            <Trash2 size={16} className="group-hover:text-white transition-colors" />
            <span className="font-medium">Delete Account</span>
          </button>
        </div>
      </section>

    </div>
  );
}
