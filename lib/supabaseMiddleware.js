import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are missing. Skipping session refresh.');
    return supabaseResponse;
  }

  const { pathname } = request.nextUrl;

  // Auth callback route — skip entirely so it can set cookies without interference
  const isAuthCallback = pathname.startsWith('/auth/callback');
  // API or static assets — no auth needed
  const isStaticOrApi =
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.');

  if (isAuthCallback || isStaticOrApi) {
    return supabaseResponse;
  }

  // ── Auth Redirect Cookie Relay ──────────────────────────────────────────
  // When the auth callback redirects to /profile-setup or /dashboard, it sets
  // a short-lived HttpOnly "__auth_redirect" cookie. If we see it here, it means
  // this request is the immediate redirect FROM our trusted callback route.
  // We trust it unconditionally, consume the cookie, and let the request through.
  // This eliminates the race condition where session cookies aren't yet available
  // to getSession() on the very first redirect hop.
  const authRedirectCookie = request.cookies.get('__auth_redirect');
  if (authRedirectCookie) {
    console.log('[Middleware] Auth redirect cookie detected — trusting callback redirect to:', pathname);
    // Consume the cookie by deleting it from the response so it's single-use
    const trustResponse = NextResponse.next({ request });
    trustResponse.cookies.set('__auth_redirect', '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
    });
    return trustResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Propagate refreshed tokens into both the request and the response
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh the session (and rotate tokens if needed)
  // Using getSession instead of getUser prevents a blocking network call to the Supabase Auth server,
  // drastically reducing Edge cold start times from seconds to milliseconds.
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  const user = session?.user || null;

  if (sessionError) {
    console.error('[Middleware] getSession error:', sessionError.message);
  }

  // Route classification
  const isPublicOnlyRoute = pathname === '/' || pathname.startsWith('/login');
  const isHybridRoute =
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/support');
  const isOnboardingRoute = pathname.startsWith('/profile-setup');
  const isProtectedRoute = !isPublicOnlyRoute && !isHybridRoute && !isOnboardingRoute;

  /**
   * createRedirectResponse — builds a redirect while carrying all refreshed
   * session cookies forward so the next request also sees a valid session.
   * Without this, the auth cookies could be stripped on the redirect hop.
   */
  const createRedirectResponse = (targetPathname) => {
    const url = request.nextUrl.clone();
    url.pathname = targetPathname;
    url.search = ''; // strip any stale query params
    const redirectResponse = NextResponse.redirect(url);
    // Forward every cookie that supabase may have refreshed
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

  // ── Unauthenticated ───────────────────────────────────────────────────────
  if (!user) {
    if (isProtectedRoute || isOnboardingRoute) {
      console.log(
        '[Middleware] No session — redirecting to /. Path:',
        pathname,
        'Cookies present:',
        request.cookies.getAll().map((c) => c.name)
      );
      return createRedirectResponse('/');
    }
    // Public / hybrid route — let them through
    return supabaseResponse;
  }

  // ── Authenticated ─────────────────────────────────────────────────────────
  // Profile completion enforcement is handled client-side via ProtectedRoute,
  // keeping middleware fast and non-blocking.

  return supabaseResponse;
}
