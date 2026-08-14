"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { User, Bell, Shield, Award, AlertTriangle, Edit2, CheckCircle2, ChevronRight, LogOut, Trash2, Link as LinkIcon, Save } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { usePushNotifications } from '../../../hooks/usePushNotifications';

export default function SettingsPage() {
  const { profile, user } = useAuth();
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    instagram_url: '',
    linkedin_url: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        bio: profile.bio || 'Exploring the intersections of distributed systems and artificial intelligence.',
        instagram_url: profile.instagram_url || '',
        linkedin_url: profile.linkedin_url || ''
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

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: formData.bio,
          instagram_url: formData.instagram_url,
          linkedin_url: formData.linkedin_url
        })
        .eq('id', user.id);
      
      if (error) throw error;
      setIsEditing(false);
      // Optional: alert success or rely on local state
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      // In a real app with RLS, we'd need an admin function. 
      // For now, clear their profile data and log them out to simulate deletion securely.
      if (user) {
        await supabase.from('profiles').update({
          display_name: 'Deleted User',
          username: `deleted_${Date.now()}`,
          bio: '',
          avatar_url: null
        }).eq('id', user.id);
      }
      await supabase.auth.signOut();
      window.location.href = '/';
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
            <div className="w-full h-32 bg-[#2A2B32] rounded-xl overflow-hidden relative group cursor-pointer border border-white/5">
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-medium text-white flex items-center gap-1"><Edit2 size={12}/> Change Cover Photo</span>
              </div>
            </div>
            
            <div className="flex items-end gap-4 -mt-10 px-4">
              <div className="w-20 h-20 rounded-full border-4 border-[#1A1B22] bg-[#2A2B32] overflow-hidden relative group cursor-pointer z-10 shrink-0">
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt="Avatar" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-[#8A2387] to-[#F27121] flex items-center justify-center text-2xl">👤</div>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit2 size={14} className="text-white" />
                </div>
              </div>
              <div className="flex-1 pb-1">
                <h3 className="text-sm font-semibold text-white">Profile Picture</h3>
                <p className="text-[11px] text-[#8E909E]">Recommended: 512x512px</p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#8E909E] uppercase tracking-wider pl-1">Display Name</label>
              <input 
                type="text" 
                disabled
                defaultValue={profile?.display_name || 'Loading...'} 
                className="w-full bg-[#0C0E14] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white/50 outline-none"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#8E909E] uppercase tracking-wider pl-1 flex items-center justify-between">
                <span>Username</span>
                <span className="text-[9px] text-[#8E909E] lowercase font-normal border border-white/10 px-1.5 py-0.5 rounded">change limit: 2 times every 15 days</span>
              </label>
              <input 
                type="text" 
                disabled
                defaultValue={`@${profile?.username || 'loading'}`} 
                className="w-full bg-[#0C0E14] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white/50 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#8E909E] uppercase tracking-wider pl-1">Bio</label>
              <textarea 
                disabled={!isEditing}
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                className="w-full bg-[#0C0E14] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none resize-none focus:border-white/20 disabled:text-white/50"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#8E909E] uppercase tracking-wider pl-1 flex items-center gap-1">
                <LinkIcon size={12} /> Instagram Link
              </label>
              <input 
                type="url" 
                disabled={!isEditing}
                placeholder="https://instagram.com/yourusername"
                value={formData.instagram_url}
                onChange={(e) => setFormData({...formData, instagram_url: e.target.value})}
                className="w-full bg-[#0C0E14] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 disabled:text-white/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#8E909E] uppercase tracking-wider pl-1 flex items-center gap-1">
                <LinkIcon size={12} /> LinkedIn Link
              </label>
              <input 
                type="url" 
                disabled={!isEditing}
                placeholder="https://linkedin.com/in/yourusername"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
                className="w-full bg-[#0C0E14] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 disabled:text-white/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 🎓 Verification */}
      <section className="bg-[#1A1B22] border border-white/5 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6 text-white">
          <Shield size={18} className="text-green-400" />
          <h2 className="text-base font-semibold">Verification</h2>
        </div>
        
        <div className="bg-[#0C0E14]/50 border border-white/5 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 size={16} className="text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Verified Student</h3>
              <p className="text-xs text-[#8E909E]">Your academic status is verified</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-[#8E909E] uppercase font-bold tracking-wider mb-1">Verified University</p>
              <p className="text-sm text-white font-medium">Stanford University</p>
            </div>
            <div>
              <p className="text-[10px] text-[#8E909E] uppercase font-bold tracking-wider mb-1">Verified Branch</p>
              <p className="text-sm text-white font-medium">Computer Science</p>
            </div>
            <div>
              <p className="text-[10px] text-[#8E909E] uppercase font-bold tracking-wider mb-1">Verified Year</p>
              <p className="text-sm text-white font-medium">Class of 2026</p>
            </div>
            <div>
              <p className="text-[10px] text-[#8E909E] uppercase font-bold tracking-wider mb-1">Registration Number</p>
              <p className="text-sm text-white font-medium">SU-10293481</p>
            </div>
          </div>
        </div>
        
        <button className="w-full bg-white/5 hover:bg-white/10 text-white/90 text-sm font-medium py-2.5 rounded-xl transition-colors border border-white/5">
          Apply to Update Verified Details
        </button>
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
            <p className="text-2xl font-bold text-white">2,450</p>
          </div>
          <div className="bg-[#0C0E14] border border-white/5 rounded-xl p-4 text-center">
            <p className="text-[10px] text-[#8E909E] uppercase font-bold tracking-wider mb-2">Current Badge</p>
            <p className="text-base font-bold text-[#FFC300]">Gold Scholar</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-white/80">Badge Progress: Platinum</span>
              <span className="text-[#FFC300]">2450 / 5000</span>
            </div>
            <div className="w-full bg-[#0C0E14] rounded-full h-1.5 overflow-hidden border border-white/5">
              <div className="bg-gradient-to-r from-[#FFC300] to-[#FF8C00] h-full rounded-full" style={{ width: '49%' }} />
            </div>
          </div>
          
          <button className="w-full bg-[#0C0E14] border border-white/5 hover:border-white/10 rounded-xl px-4 py-3 text-sm text-left text-white transition-colors flex items-center justify-between group mt-2">
            <span className="font-medium text-[#8E909E] group-hover:text-white transition-colors">View Honor Point History</span>
            <ChevronRight size={16} className="text-[#8E909E] group-hover:text-white transition-colors" />
          </button>
        </div>
      </section>

      {/* Account Actions & Danger Zone */}
      <section className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="space-y-3">
          <a 
            href="/api/user/export"
            download
            className="w-full bg-[#0C0E14]/80 border border-white/10 hover:bg-white/5 rounded-xl px-4 py-3 text-sm text-left text-white transition-colors flex items-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span className="font-medium">Download My Data (GDPR)</span>
          </a>
          
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
