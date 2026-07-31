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
  
  // Public routes (e.g. /, /login)
  const isPublicRoute = pathname === '/' || pathname.startsWith('/login');
  // Onboarding route
  const isOnboardingRoute = pathname.startsWith('/profile-setup');
  // Protected routes
  const isProtectedRoute = !isPublicRoute && !isOnboardingRoute && !pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.includes('.');

  if (!user && (isProtectedRoute || isOnboardingRoute)) {
    // Unauthenticated trying to access protected/onboarding -> redirect to home
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // NOTE: Profile completion redirect is now handled client-side in ProtectedRoute.jsx
  // to avoid blocking page loads with a database query in the Edge Middleware.

  if (user && isPublicRoute) {
    // Authenticated on public route -> redirect to dashboard
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
