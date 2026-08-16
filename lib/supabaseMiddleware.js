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
  
  // Auth callback route
  const isAuthCallback = pathname.startsWith('/auth/callback');
  // API or static assets
  const isStaticOrApi = pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.');

  // Skip middleware entirely for static assets and auth callbacks
  // If we run getUser() on auth callback, it might try to clear expired cookies,
  // which will conflict with the callback route trying to set new cookies!
  if (isAuthCallback || isStaticOrApi) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This will refresh the session if expired and sync the cookie
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public-only routes (authenticated users get redirected away from these)
  const isPublicOnlyRoute = pathname === '/' || pathname.startsWith('/login');
  // Hybrid routes (accessible by everyone)
  const isHybridRoute = pathname.startsWith('/about') || pathname.startsWith('/privacy') || pathname.startsWith('/terms') || pathname.startsWith('/support');
  // Onboarding route
  const isOnboardingRoute = pathname.startsWith('/profile-setup');

  const isProtectedRoute = !isPublicOnlyRoute && !isHybridRoute && !isOnboardingRoute;

  // Helper to create redirect response with all cookies intact
  const createRedirectResponse = (pathname) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

  // Unauthenticated users trying to access protected or onboarding routes
  if (!user && (isProtectedRoute || isOnboardingRoute)) {
    return createRedirectResponse('/');
  }

  // Authenticated users
  if (user) {
    // Check if the user has completed their profile setup
    const { data: profile } = await supabase
      .from('profiles')
      .select('setup_completed')
      .eq('id', user.id)
      .single();

    const isSetupCompleted = profile?.setup_completed === true;

    // If profile is not complete, enforce they stay on /profile-setup
    if (!isSetupCompleted && !isOnboardingRoute) {
      return createRedirectResponse('/profile-setup');
    }

    // If profile is complete, do not allow access to public-only routes or the onboarding route
    if (isSetupCompleted && (isPublicOnlyRoute || isOnboardingRoute)) {
      return createRedirectResponse('/dashboard');
    }
  }

  return supabaseResponse;
}
