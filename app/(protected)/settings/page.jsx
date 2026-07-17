"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { User, Bell, Eye, Lock, Moon, ChevronDown, ChevronRight, Edit2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function SettingsPage() {
  const { profile, user } = useAuth();
  
  // Local state for toggles
  const [threadReplies, setThreadReplies] = useState(true);
  const [mentions, setMentions] = useState(true);

  return (
    <div className="max-w-3xl w-full mx-auto pb-20 md:pb-0 space-y-6">
      
      {/* Header */}
      <div className="mb-8 px-2">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Settings</h1>
        <p className="text-sm text-white/50">Manage your academic profile and community preferences.</p>
      </div>

      {/* Account Information */}
      <section className="bg-[#1A1B22] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6 text-white/90">
          <User size={18} />
          <h2 className="text-sm font-semibold">Account Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-1">Full Name</label>
            <input 
              type="text" 
              defaultValue={profile?.display_name || 'Loading...'} 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-1">Email Address</label>
            <input 
              type="email" 
              disabled
              defaultValue={user?.email || 'loading@student.edu'} 
              className="w-full bg-[#0C0E14] border border-white/5 rounded-xl px-4 py-3 text-sm text-white/50 outline-none cursor-not-allowed"
            />
          </div>
        </div>
      </section>

      {/* Profile Avatar */}
      <section className="bg-[#1A1B22] border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 relative">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-[#8A2387] to-[#F27121] flex items-center justify-center text-3xl">👤</div>
            )}
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-[#1A1B22] hover:bg-blue-500 transition-colors">
            <Edit2 size={12} className="text-white" />
          </button>
        </div>
        
        <div className="flex-1 text-center sm:text-left space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Profile Avatar</h3>
            <p className="text-xs text-white/50 mt-1 max-w-[300px]">
              Update your photo to be recognized across discussions. Recommended size: 512x512px.
            </p>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-3">
            <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors">
              Upload New
            </button>
            <button className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 text-xs font-medium px-4 py-2 rounded-xl transition-colors">
              Remove
            </button>
          </div>
        </div>
      </section>

      {/* Notification Preferences */}
      <section className="bg-[#1A1B22] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6 text-white/90">
          <Bell size={18} />
          <h2 className="text-sm font-semibold">Notification Preferences</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div>
              <p className="text-sm font-medium text-white">Thread Replies</p>
              <p className="text-xs text-white/50">Get notified when someone replies to your post.</p>
            </div>
            {/* Custom Toggle */}
            <button 
              onClick={() => setThreadReplies(!threadReplies)}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex ${threadReplies ? 'bg-blue-600 justify-end' : 'bg-white/10 justify-start'}`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform" />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Mentions</p>
              <p className="text-xs text-white/50">Notify when your @username is mentioned.</p>
            </div>
            {/* Custom Toggle */}
            <button 
              onClick={() => setMentions(!mentions)}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex ${mentions ? 'bg-blue-600 justify-end' : 'bg-white/10 justify-start'}`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Privacy & Security (Grid layout on md) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-[#1A1B22] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6 text-white/90">
            <Eye size={18} />
            <h2 className="text-sm font-semibold">Privacy</h2>
          </div>
          <div className="relative">
            <select className="w-full bg-[#0C0E14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white appearance-none outline-none focus:border-blue-500/50 transition-colors cursor-pointer">
              <option>Public Profile</option>
              <option>Private Profile (Connections Only)</option>
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>
          <p className="text-xs text-white/50 mt-3">
            Determines who can view your academic portfolio and history.
          </p>
        </section>

        <section className="bg-[#1A1B22] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6 text-white/90">
            <Lock size={18} />
            <h2 className="text-sm font-semibold">Security</h2>
          </div>
          <button className="w-full bg-[#0C0E14] border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 text-sm text-left text-white transition-colors flex items-center justify-between group">
            <div className="flex flex-col">
              <span className="font-medium">Change Password</span>
              <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">Last changed 3 months ago</span>
            </div>
            <ChevronRight size={16} className="text-white/40 group-hover:text-white/80 transition-colors" />
          </button>
        </section>
      </div>

    </div>
  );
}
