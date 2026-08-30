
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, display_name, avatar_url } = body;

    const cookieStore = await cookies();
    
    // 1. Create standard client to verify who is making the request
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {} 
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll() { return []; }, setAll() {} } }
    );

    const { error: upsertError } = await adminClient
      .from('profiles')
      .upsert({
        id: user.id,
        username,
        display_name,
        avatar_url,
        setup_completed: true
      });

    if (upsertError) {
      console.error('Failed to upsert profile:', upsertError);
      return NextResponse.json({ error: upsertError.message || 'Failed to update profile' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Internal Profile Onboard API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

