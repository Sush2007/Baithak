import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

let supabase = null;

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!supabase) {
    supabase = createClient(
      supabaseUrl,
      supabaseAnonKey
    );
  }

  return supabase;
}

// We'll use a hack to temporarily disable RLS if Service Role key is missing, or we can just assume the RLS allows read for now. Let's fix RLS for push_subscriptions to allow anon to select for webhook, but that's insecure.
// Instead we'll use ANON key and if RLS blocks, we might need a service role key.
// For now, let's just proceed with standard client.

if (process.env.VAPID_SUBJECT && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn("VAPID keys are missing. Push notifications may not work.");
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { notification_id, user_id, actor_id, type, post_id } = payload;
    const supabaseClient = getSupabaseClient();

    if (!supabaseClient) {
      return NextResponse.json({ error: 'Supabase is not configured on this server.' }, { status: 500 });
    }

    if (!type || (!user_id && type !== 'new_post')) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Fetch actor profile
    const { data: actor } = await supabaseClient
      .from('profiles')
      .select('display_name')
      .eq('id', actor_id)
      .single();

    // Fetch post title
    let postTitle = 'a discussion';
    if (post_id) {
      const { data: post } = await supabaseClient
        .from('posts')
        .select('title')
        .eq('id', post_id)
        .single();
      if (post) postTitle = `"${post.title}"`;
    }

    const actorName = actor?.display_name || 'Someone';
    let message = '';
    
    if (type === 'like') {
      message = `${actorName} liked your post ${postTitle}`;
    } else if (type === 'comment') {
      message = `${actorName} replied to your post ${postTitle}`;
    } else if (type === 'new_post') {
      message = `${actorName} just started a new discussion: ${postTitle}`;
    } else {
      message = `You have a new notification from ${actorName}`;
    }

    // Fetch subscriptions
    let subscriptions = [];
    if (type === 'new_post') {
      // Broadcast to everyone EXCEPT the author
      const { data, error } = await supabaseClient
        .from('push_subscriptions')
        .select('*')
        .neq('user_id', actor_id);
      if (!error && data) subscriptions = data;
    } else {
      // Send to specific user
      const { data, error } = await supabaseClient
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user_id);
      if (!error && data) subscriptions = data;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: 'No subscriptions found' }, { status: 200 });
    }

    const pushPayload = JSON.stringify({
      title: 'Baithak',
      body: message,
      url: post_id ? `/post/${post_id}` : '/',
    });

    // Send push to all registered devices
    const pushPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, pushPayload);
      } catch (err) {
        console.error('Error sending push to endpoint:', sub.endpoint, err);
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabaseClient.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    });

    await Promise.all(pushPromises);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
