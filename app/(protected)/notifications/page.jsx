"use client";

import React, { useState, useEffect } from 'react';
import { CheckCheck, MessageSquare, Award, AtSign, ShieldCheck, AlertCircle, Heart } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const TABS = ['All', 'Replies', 'Mentions', 'System'];

const timeAgo = (dateStr) => {
  const date = new Date(dateStr);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "just now";
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, activeTab]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('notifications')
        .select(`
          id, type, is_read, created_at, post_id,
          actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_url),
          post:posts(title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (activeTab === 'Replies') {
        query = query.eq('type', 'comment');
      } else if (activeTab === 'System') {
        query = query.in('type', ['system', 'verification']);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Deduplicate notifications (in case of duplicate DB triggers)
      const uniqueNotifications = [];
      const seen = new Set();
      
      (data || []).forEach(notif => {
        // Create a unique key for the notification event
        const key = `${notif.type}-${notif.post_id}-${notif.actor?.username || notif.actor_id}-${new Date(notif.created_at).getTime()}`;
        // Fallback looser key if timestamps differ slightly but it's the same event
        const looseKey = `${notif.type}-${notif.post_id}-${notif.actor?.username || notif.actor_id}`;
        
        if (!seen.has(key) && !seen.has(looseKey)) {
          seen.add(key);
          seen.add(looseKey);
          uniqueNotifications.push(notif);
        }
      });
      
      setNotifications(uniqueNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id, notification.is_read);
    if (notification.post_id) {
      router.push(`/post/${notification.post_id}`);
    }
  };

  const getIconConfig = (type) => {
    switch(type) {
      case 'comment': return { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-400/10' };
      case 'like': return { icon: Heart, color: 'text-red-400', bg: 'bg-red-400/10' };
      case 'system': return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' };
      default: return { icon: Award, color: 'text-accent-yellow', bg: 'bg-accent-yellow/10' };
    }
  };

  const renderContent = (notification) => {
    const actorName = notification.actor?.display_name || 'Someone';
    switch(notification.type) {
      case 'comment': 
        return (
          <>
            <p className="text-sm font-medium text-white/90">
              {actorName} <span className="font-normal text-white/60">replied to your post</span> <span className="text-blue-400">{notification.post?.title}</span>
            </p>
          </>
        );
      case 'like':
        return (
          <>
            <p className="text-sm font-medium text-white/90">
              {actorName} <span className="font-normal text-white/60">liked your post</span> <span className="text-blue-400">{notification.post?.title}</span>
            </p>
          </>
        );
      default:
        return <p className="text-sm font-medium text-white/90">New notification received.</p>;
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto pb-20 md:pb-0">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-8 px-2 mt-4 md:mt-0">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Notifications</h1>
          <p className="text-sm text-white/50">Stay updated with replies, rewards, and account activity</p>
        </div>
        <button onClick={markAllAsRead} className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white transition-colors">
          <CheckCheck size={16} /> Mark all as read
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide gap-8 px-2 border-b border-white/5 mb-6">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-medium transition-colors whitespace-nowrap relative ${
              activeTab === tab ? 'text-white' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center p-8 text-white/50">You have no notifications here.</div>
        ) : (
          notifications.map(notification => {
            const { icon: Icon, color, bg } = getIconConfig(notification.type);
            
            return (
              <div 
                key={notification.id} 
                onClick={() => handleNotificationClick(notification)}
                className={`bg-[#1A1B22] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors relative flex gap-4 cursor-pointer ${!notification.is_read ? 'bg-white/[0.03]' : ''}`}
              >
                {/* Unread Indicator */}
                {!notification.is_read && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1.5 bg-blue-500 rounded-r-full" />
                )}

                {/* Actor Avatar or Icon */}
                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-white/10 overflow-hidden ${notification.actor?.avatar_url ? '' : bg} ${color}`}>
                  {notification.actor?.avatar_url ? (
                    <Image src={notification.actor.avatar_url} alt="actor" fill className="object-cover" />
                  ) : (
                    <Icon size={18} />
                  )}
                  {notification.actor?.avatar_url && (
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${bg} ${color} flex items-center justify-center border-2 border-[#1A1B22]`}>
                      <Icon size={10} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex justify-between items-start mb-2">
                    {renderContent(notification)}
                    <span className="text-xs text-white/40 shrink-0 ml-4">{timeAgo(notification.created_at)}</span>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>
      
    </div>
  );
}
