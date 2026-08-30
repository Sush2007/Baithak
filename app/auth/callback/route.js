import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';

    let sessionCookies = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            sessionCookies = cookiesToSet;
          },
        },
      }
    );

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const userId = sessionData.session?.user?.id;
      let destination = next;

      if (userId) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('setup_completed')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) {
          console.error('[auth/callback] Error fetching profile:', profileError.message);
        }

        if (profileError || !profile?.setup_completed) {
          destination = '/profile-setup';
        }
      }

      // Build the final redirect URL
      let redirectUrl;
      if (isLocalEnv) {
        redirectUrl = `${origin}${destination}`;
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${destination}`;
      } else {
        redirectUrl = `${origin}${destination}`;
      }

      const response = NextResponse.redirect(redirectUrl);

      // Apply all cookies to the response securely
      sessionCookies.forEach(({ name, value, options }) => {
        // Clean empty domain which can break Next.js cookies
        const safeOptions = { ...options };
        if (safeOptions.domain === '') {
          delete safeOptions.domain;
        }
        response.cookies.set({
          name,
          value,
          ...safeOptions
        });
      });

      return response;
    }

    console.error('[auth/callback] Error exchanging code for session:', error);
    return NextResponse.redirect(
      `${origin}/?error=auth&message=${encodeURIComponent(error.message)}`
    );
  }

  // No code present — something went wrong upstream
  return NextResponse.redirect(`${origin}/?error=auth&message=missing_code`);
}
