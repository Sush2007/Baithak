
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, display_name, avatar_url } = body;

    // Input validation
    if (!username || !display_name) {
      return NextResponse.json({ error: 'Username and display name are required.' }, { status: 400 });
    }

    const validateUsername = (val) => {
      if (/[A-Z]/.test(val)) return 'Username must be lowercase only.';
      if (/\s/.test(val)) return 'Username cannot contain spaces.';
      if (!/^[a-z0-9_]+$/.test(val)) return 'Only lowercase letters, numbers, and underscores are allowed.';
      if (val.length < 3) return 'Username must be at least 3 characters.';
      if (val.length > 15) return 'Username cannot exceed 15 characters.';
      return null;
    };

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
      console.error('[Onboard API] Auth failed:', authError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Onboard API] Creating/updating profile for user:', user.id, 'username:', username);

    const adminClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll() { return []; }, setAll() {} } }
    );

    // First, check if a profile already exists for this user
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, username')
      .eq('id', user.id)
      .maybeSingle();

    let dbError;

    if (existingProfile) {
      if (existingProfile.username?.startsWith('deleted_')) {
        console.log('[Onboard API] Found anonymized deleted_ profile. Wiping to bypass 15-day trigger...');
        
        const errorMsg = validateUsername(username);
        if (errorMsg) return NextResponse.json({ error: errorMsg }, { status: 400 });

        // 1. Delete the stuck anonymized profile so we can insert a fresh one
        await adminClient.from('profiles').delete().eq('id', user.id);
        
        // 2. Insert fresh profile
        const { error: insertError } = await adminClient
          .from('profiles')
          .insert({
            id: user.id,
            username,
            display_name,
            avatar_url,
            setup_completed: true
          });
        dbError = insertError;
      } else {
        // Profile exists normally — update it
        const updatePayload = {
          display_name,
          avatar_url,
          setup_completed: true
        };
        
        if (existingProfile.username !== username) {
          const errorMsg = validateUsername(username);
          if (errorMsg) return NextResponse.json({ error: errorMsg }, { status: 400 });
          updatePayload.username = username;
        }

        const { error: updateError } = await adminClient
          .from('profiles')
          .update(updatePayload)
          .eq('id', user.id);
        dbError = updateError;
      }
    } else {
      // No profile — insert a new one
      const errorMsg = validateUsername(username);
      if (errorMsg) return NextResponse.json({ error: errorMsg }, { status: 400 });

      const { error: insertError } = await adminClient
        .from('profiles')
        .insert({
          id: user.id,
          username,
          display_name,
          avatar_url,
          setup_completed: true
        });
      dbError = insertError;
    }

    if (dbError) {
      console.error('[Onboard API] Profile save failed:', dbError.message, dbError.code, dbError.details);
      
      // INDUSTRY STANDARD FALLBACK: 
      // If the user hit the 15-day username limit during onboarding (because they were placed 
      // back here due to a network glitch and tried to change their username), we should just 
      // ignore the username change and let them through, so they aren't permanently locked out.
      if (existingProfile && dbError.message?.includes('15 days')) {
        console.log('[Onboard API] 15-day limit hit. Retrying update without username...');
        
        const fallbackPayload = {
          display_name,
          avatar_url,
          setup_completed: true
        };
        
        const { error: retryError } = await adminClient
          .from('profiles')
          .update(fallbackPayload)
          .eq('id', user.id);
          
        if (retryError) {
          console.error('[Onboard API] Fallback profile save failed:', retryError.message);
          return NextResponse.json({ error: retryError.message || 'Failed to update profile' }, { status: 400 });
        }
        
        console.log('[Onboard API] Fallback profile saved successfully.');
        return NextResponse.json({ success: true, warning: 'Username change skipped due to 15-day limit.' });
      }

      return NextResponse.json({ error: dbError.message || 'Failed to update profile' }, { status: 400 });
    }

    console.log('[Onboard API] Profile saved successfully for user:', user.id);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Internal Profile Onboard API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

