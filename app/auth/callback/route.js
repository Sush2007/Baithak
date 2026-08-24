import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
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
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              console.warn('[auth/callback] Cookie set error:', error);
            }
          },
        },
      }
    );
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      let response;
      if (isLocalEnv) {
        response = NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        response = NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        response = NextResponse.redirect(`${origin}${next}`);
      }
      
      // EXPLICITLY copy all cookies from the store to the response to guarantee they are set in Next 15
      cookieStore.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, cookie);
      });
      
      return response;
    } else {
      console.error('[auth/callback] Error exchanging code for session:', error);
      return NextResponse.redirect(`${origin}/?error=auth&message=${encodeURIComponent(error.message)}`);
    }
  }

  // Return to homepage if no code
  return NextResponse.redirect(`${origin}/?error=auth&message=missing_code`);
}
