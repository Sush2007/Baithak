import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';

    // Build the redirect URL first
    let redirectUrl;
    if (isLocalEnv) {
      redirectUrl = `${origin}${next}`;
    } else if (forwardedHost) {
      redirectUrl = `https://${forwardedHost}${next}`;
    } else {
      redirectUrl = `${origin}${next}`;
    }

    // Create the redirect response BEFORE the supabase client so that
    // setAll() can stamp auth cookies directly onto this response object.
    // Previously, cookies were written to Next's server cookie store and
    // then copied AFTER exchange — which missed the newly minted tokens.
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            // Read incoming cookies from the request (contains the PKCE verifier)
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Write the new session tokens directly onto the response headers
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Auth cookies are already on `response` — just return it
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
