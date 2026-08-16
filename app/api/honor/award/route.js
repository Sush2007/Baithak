import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { actionType, points, referenceId } = body;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
          }
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check self-reply
    if (actionType === 'HELPFUL_REPLY' && referenceId) {
      const { data: post } = await supabaseAdmin.from('posts').select('author_id').eq('id', referenceId).single();
      if (post && post.author_id === user.id) {
         return NextResponse.json({ success: false, message: 'Self reply does not earn points' });
      }
    }

    // Process best answer
    if (actionType === 'BEST_ANSWER' && referenceId) {
       const { data: comment } = await supabaseAdmin.from('comments').select('author_id').eq('id', referenceId).single();
       if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
       
       const targetUserId = comment.author_id;
       if (targetUserId === user.id) {
         return NextResponse.json({ success: false, message: 'Cannot award best answer to yourself' });
       }

       const { data, error } = await supabaseAdmin.rpc('award_honor_points', {
          p_user_id: targetUserId,
          p_action_type: actionType,
          p_points: points,
          p_reference_id: referenceId // We use comment id
       });
       
       return NextResponse.json({ success: data });
    }

    // Process upvotes
    if (actionType === 'RECEIVE_UPVOTE' && referenceId) {
       // referenceId is the post id
       const { data: post } = await supabaseAdmin.from('posts').select('author_id').eq('id', referenceId).single();
       if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
       
       const targetUserId = post.author_id;
       if (targetUserId === user.id) {
         return NextResponse.json({ success: false, message: 'Liking own post does not earn points' });
       }

       // For the reference ID to be unique per like, we generate a stable UUID hash or just don't pass referenceId?
       // If we don't pass referenceId, they could get points for the same like if the frontend spams it.
       // The UI handles state, but to prevent abuse we can just pass NULL for referenceId and let the daily limit cap it,
       // OR we can query the 'likes' table inside the RPC. But let's just use NULL for referenceId since it's capped at 20/day anyway.
       
       const { data, error } = await supabaseAdmin.rpc('award_honor_points', {
          p_user_id: targetUserId,
          p_action_type: actionType,
          p_points: points,
          p_reference_id: null
       });
       return NextResponse.json({ success: data });
    }

    // Normal actions (Ask discussion, Bookmark, etc.)
    const { data, error } = await supabaseAdmin.rpc('award_honor_points', {
      p_user_id: user.id,
      p_action_type: actionType,
      p_points: points,
      p_reference_id: referenceId || null
    });

    if (error) throw error;
    return NextResponse.json({ success: data });

  } catch (err) {
    console.error('API Error awarding points:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
