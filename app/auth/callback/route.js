import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  let authError = null;
  let response = NextResponse.redirect(`${origin}${next}`); // Default response

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
                // Set on the request/cookieStore
                cookieStore.set(name, value, options);
                // ALSO set explicitly on the outgoing redirect response to guarantee it works!
                response.cookies.set({ name, value, ...options });
              });
            } catch (err) {
              console.warn('[auth/callback] Cookie set error:', err);
            }
          },
        },
      }
    );
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      // Update the redirect URL if needed based on forwarded host
      if (!isLocalEnv && forwardedHost) {
        response = NextResponse.redirect(`https://${forwardedHost}${next}`);
        // Copy cookies over to the new response object
        cookieStore.getAll().forEach((cookie) => {
          response.cookies.set({ name: cookie.name, value: cookie.value });
        });
      }
      
      return response;
    }
  }

  // Return to homepage on error
  return NextResponse.redirect(`${origin}/?error=auth&message=${encodeURIComponent(authError?.message || 'missing_code')}`);
}
