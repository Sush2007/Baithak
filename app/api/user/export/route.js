import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore in route handler
            }
          },
        },
      }
    );
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user data concurrently
    const [
      profileData,
      postsData,
      commentsData,
      connectionsData
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('posts').select('*').eq('author_id', user.id),
      supabase.from('comments').select('*').eq('author_id', user.id),
      supabase.from('connections').select('*').or(`follower_id.eq.${user.id},following_id.eq.${user.id}`)
    ]);

    // Compile GDPR export package
    const exportData = {
      generated_at: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
      data: {
        profile: profileData.data || {},
        posts: postsData.data || [],
        comments: commentsData.data || [],
        connections: connectionsData.data || []
      }
    };

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="baithak_data_export_${user.id}.json"`,
      },
    });

  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json({ error: 'Failed to generate data export' }, { status: 500 });
  }
}
