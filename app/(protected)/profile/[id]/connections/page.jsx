"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { supabase } from '../../../../../lib/supabaseClient';

export default function UserConnectionsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch Profile to get display name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (profileData) setProfile(profileData);

      // Fetch accepted connections
      const { data: acceptedData } = await supabase
        .from('connections')
        .select('*')
        .eq('status', 'accepted')
        .or(`follower_id.eq.${id},following_id.eq.${id}`);
        
      const connectionIds = acceptedData?.map(c => 
        c.follower_id === id ? c.following_id : c.follower_id
      ) || [];
      
      const { data: connectionProfiles } = connectionIds.length > 0 
        ? await supabase.from('profiles').select('id, display_name, username, avatar_url').in('id', connectionIds)
        : { data: [] };

      setConnections(connectionProfiles || []);
    } catch (err) {
      console.error('Error fetching connections:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl w-full mx-auto pb-20 md:pb-12 mt-4 md:mt-0 px-4 sm:px-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-white/70 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {profile ? `${profile.display_name}'s connections` : 'Connections'}
        </h1>
      </div>

      <div className="bg-[#1A1B22] border border-white/5 rounded-2xl p-5 md:p-6 shadow-sm min-h-[60vh]">
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : connections.length === 0 ? (
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
          )}
        </div>
      </div>
    </div>
  );
}
