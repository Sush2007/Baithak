import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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

  const { pathname } = request.nextUrl;
  
  // Public-only routes (authenticated users get redirected away from these)
  const isPublicOnlyRoute = pathname === '/' || pathname.startsWith('/login');
  // Hybrid routes (accessible by everyone)
  const isHybridRoute = pathname.startsWith('/about');
  // Onboarding route
  const isOnboardingRoute = pathname.startsWith('/profile-setup');
  // Auth callback route
  const isAuthCallback = pathname.startsWith('/auth/callback');
  // API or static assets
  const isStaticOrApi = pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.');

  if (isAuthCallback || isStaticOrApi) {
    return supabaseResponse;
  }

  const isProtectedRoute = !isPublicOnlyRoute && !isHybridRoute && !isOnboardingRoute;

  // Unauthenticated users trying to access protected or onboarding routes
  if (!user && (isProtectedRoute || isOnboardingRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
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
      const url = request.nextUrl.clone();
      url.pathname = '/profile-setup';
      return NextResponse.redirect(url);
    }

    // If profile is complete, do not allow access to public-only routes or the onboarding route
    if (isSetupCompleted && (isPublicOnlyRoute || isOnboardingRoute)) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
