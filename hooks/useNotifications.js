import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export function useNotifications() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Fetch initial count
    const fetchInitial = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (count !== null) setUnreadCount(count);
    };

    fetchInitial();

    // Subscribe to realtime inserts
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          if (payload.new.actor_id !== user.id) {
            setUnreadCount((prev) => prev + 1);
            
            // Dispatch event for UI updates globally
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('new_notification_received', { detail: payload.new }));
            }
            
            // Show toast
            const { data: actorData } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', payload.new.actor_id)
              .single();
              
            const actorName = actorData?.display_name || 'Someone';
            
            let actionText = 'interacted with your post';
            let icon = '🔔';
            
            if (payload.new.type === 'like') {
              actionText = 'liked your post';
              icon = '❤️';
            } else if (payload.new.type === 'comment') {
              actionText = 'replied to your post';
              icon = '💬';
            } else if (payload.new.type === 'mention' || payload.new.type === 'mention_comment') {
              actionText = 'mentioned you!';
              icon = '👋';
            } else if (payload.new.type === 'connection_request') {
              actionText = 'sent you a connection request!';
              icon = '🤝';
            } else if (payload.new.type === 'connection_accepted') {
              actionText = 'accepted your connection request!';
              icon = '🎉';
            }

            toast(`${actorName} ${actionText}`, { 
              icon,
              style: {
                background: '#1A1B22',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '14px',
                fontWeight: '500'
              }
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.is_read && !payload.old.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setUnreadCount(0);
  };

  return { unreadCount, markAllAsRead };
}
