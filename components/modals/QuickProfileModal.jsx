"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { X, ExternalLink, Flag, Loader2, ShieldAlert } from 'lucide-react';

const InstagramIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const LinkedinIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);
import { supabase } from '../../lib/supabaseClient';

export default function QuickProfileModal({ userId, onClose, onReport }) {
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (userId) {
      document.body.style.overflow = 'hidden';
      fetchProfile();
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url, instagram_url, linkedin_url')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!userId || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[400px] bg-[#1A1B22] border border-white/10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cover Photo / Gradient Header */}
        <div className="h-32 w-full bg-gradient-to-r from-[#0033A0] via-[#8A2387] to-[#F27121] relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full backdrop-blur-md transition-all shadow-lg"
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center min-h-[250px]">
            <Loader2 className="w-8 h-8 animate-spin text-white/50 mb-3" />
            <p className="text-white/50 text-sm font-medium">Loading profile...</p>
          </div>
        ) : profile ? (
          <div className="px-6 pb-6 pt-0 relative">
            {/* Avatar */}
            <div className="absolute -top-12 left-6">
              <div className="w-24 h-24 rounded-full border-4 border-[#1A1B22] overflow-hidden bg-[#282A31] shadow-xl relative">
                {profile.avatar_url ? (
                  <Image 
                    src={profile.avatar_url} 
                    alt={profile.display_name || 'Avatar'} 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-[#8A2387] to-[#F27121] flex items-center justify-center text-3xl">
                    👤
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="pt-14 pb-4">
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                {profile.display_name || 'Anonymous'}
              </h2>
              <p className="text-[#8E909E] text-[15px] font-medium mt-0.5">
                @{profile.username || 'unknown'}
              </p>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mb-6">
              {profile.instagram_url && (
                <a 
                  href={profile.instagram_url.startsWith('http') ? profile.instagram_url : `https://${profile.instagram_url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-90 rounded-xl text-white font-semibold text-sm transition-opacity shadow-md"
                >
                  <InstagramIcon size={18} />
                  <span>Instagram</span>
                </a>
              )}
              {profile.linkedin_url && (
                <a 
                  href={profile.linkedin_url.startsWith('http') ? profile.linkedin_url : `https://${profile.linkedin_url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0A66C2] hover:bg-[#004182] rounded-xl text-white font-semibold text-sm transition-colors shadow-md"
                >
                  <LinkedinIcon size={18} />
                  <span>LinkedIn</span>
                </a>
              )}
            </div>

            <div className="space-y-3">
              {profile.id && (
                <Link 
                  href={`/profile/${profile.id}`}
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold text-sm transition-all"
                >
                  <ExternalLink size={16} />
                  View Full Profile
                </Link>
              )}
              
              <button 
                onClick={() => {
                  onClose();
                  if (onReport) onReport(profile);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-semibold text-sm transition-all"
              >
                <Flag size={16} />
                Report Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center justify-center min-h-[250px]">
            <ShieldAlert className="w-12 h-12 text-white/20 mb-3" />
            <p className="text-white/50 text-sm font-medium">Profile not found.</p>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
