"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { ArrowLeft, Users, Check, X, Loader2 } from 'lucide-react';

export default function ConnectionsPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('connections');
  
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchConnections();
  }, [profile?.id]);

  async function fetchConnections() {
    if (!profile?.id) return;
    setLoading(true);
    try {
      // Fetch accepted connections (where you are either follower or following)
      const { data: acceptedData } = await supabase
        .from('connections')
        .select(`
          *,
          follower:profiles!connections_follower_id_fkey(id, username, display_name, avatar_url),
          following:profiles!connections_following_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('status', 'accepted')
        .or(`follower_id.eq.${profile.id},following_id.eq.${profile.id}`);
        
      const connectionProfiles = acceptedData?.map(c => 
        c.follower_id === profile.id ? c.following : c.follower
      ) || [];

      // Fetch pending requests (where someone else followed you)
      const { data: pendingData } = await supabase
        .from('connections')
        .select('follower_id')
        .eq('following_id', profile.id)
        .eq('status', 'pending');
        
      const pendingIds = pendingData?.map(p => p.follower_id) || [];
      const { data: pendingProfiles } = pendingIds.length > 0
        ? await supabase.from('profiles').select('id, display_name, username, avatar_url').in('id', pendingIds)
        : { data: [] };

      setConnections(connectionProfiles || []);
      setPendingRequests(pendingProfiles || []);
    } catch (err) {
      console.error('Error fetching connections:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAccept = async (requesterId) => {
    setActionLoading(requesterId);
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('follower_id', requesterId)
        .eq('following_id', profile.id);
        
      if (!error) {
        // Move from pending to connections locally
        const user = pendingRequests.find(u => u.id === requesterId);
        if (user) {
          setPendingRequests(prev => prev.filter(u => u.id !== requesterId));
          setConnections(prev => [...prev, user]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (requesterId) => {
    setActionLoading(requesterId);
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('follower_id', requesterId)
        .eq('following_id', profile.id);
        
      if (!error) {
        setPendingRequests(prev => prev.filter(u => u.id !== requesterId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto pb-20 md:pb-12 mt-4 md:mt-0 px-4 sm:px-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/profile" className="text-white/70 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">My connections</h1>
      </div>

      <div className="bg-[#1A1B22] border border-white/5 rounded-2xl p-5 md:p-6 shadow-sm min-h-[60vh]">
        <div className="flex border-b border-white/5 mb-6">
          <button
            onClick={() => setActiveTab('connections')}
            className={`flex-1 pb-4 text-sm font-medium transition-colors relative ${activeTab === 'connections' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
          >
            Connections ({connections.length})
            {activeTab === 'connections' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 pb-4 text-sm font-medium transition-colors relative ${activeTab === 'pending' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
          >
            Pending connections ({pendingRequests.length})
            {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full" />}
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : activeTab === 'connections' ? (
            connections.length === 0 ? (
              <div className="text-center py-10 text-white/50 flex flex-col items-center">
                <Users size={48} className="mb-4 opacity-20" />
                <p>No connections yet.</p>
              </div>
            ) : (
              connections.map(userProfile => (
                <div key={userProfile.id} className="flex items-center justify-between p-4 bg-[#0C0E14]/50 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.location.href = `/profile/${userProfile.id}`}>
                    <div className="w-12 h-12 rounded-full bg-[#2A2B32] overflow-hidden relative">
                      {userProfile.avatar_url ? (
                        <Image src={userProfile.avatar_url} alt={userProfile.display_name || 'User'} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-[#8A2387] to-[#F27121] flex items-center justify-center text-lg">👤</div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{userProfile.display_name || 'Anonymous User'}</h3>
                      <p className="text-xs text-blue-400">@{userProfile.username}</p>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            pendingRequests.length === 0 ? (
              <div className="text-center py-10 text-white/50 flex flex-col items-center">
                <Users size={48} className="mb-4 opacity-20" />
                <p>No pending requests.</p>
              </div>
            ) : (
              pendingRequests.map(userProfile => (
                <div key={userProfile.id} className="flex items-center justify-between p-4 bg-[#0C0E14]/50 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.location.href = `/profile/${userProfile.id}`}>
                    <div className="w-12 h-12 rounded-full bg-[#2A2B32] overflow-hidden relative">
                      {userProfile.avatar_url ? (
                        <Image src={userProfile.avatar_url} alt={userProfile.display_name || 'User'} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-[#8A2387] to-[#F27121] flex items-center justify-center text-lg">👤</div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{userProfile.display_name || 'Anonymous User'}</h3>
                      <p className="text-xs text-blue-400">@{userProfile.username}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAccept(userProfile.id); }}
                      disabled={actionLoading === userProfile.id}
                      className="w-10 h-10 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                      {actionLoading === userProfile.id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDecline(userProfile.id); }}
                      disabled={actionLoading === userProfile.id}
                      className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                      {actionLoading === userProfile.id ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
