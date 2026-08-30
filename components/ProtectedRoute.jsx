"use client";

import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePathname } from 'next/navigation';

/**
 * ProtectedRoute — the SOLE client-side redirect authority.
 *
 * This component is the single place that makes client-side routing
 * decisions based on auth state. All other components (AuthContext,
 * individual pages) must NOT redirect.
 *
 * Types:
 *   "protected"       → requires auth + completed profile setup
 *   "onboarding-only" → requires auth, shown only during onboarding
 *   "public-only"     → only for unauthenticated users
 *   "public-optional" → anyone can view (hybrid pages like /terms)
 */
const ProtectedRoute = ({ children, type = 'protected' }) => {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const redirecting = useRef(false);

  useEffect(() => {
    if (loading || redirecting.current) return;

    // ── Public-only routes (landing page, /login) ──────────────────────
    // Authenticated users should not see these pages.
    if (type === 'public-only' && user && profile) {
      redirecting.current = true;
      if (profile.setup_completed === false) {
        window.location.href = '/profile-setup';
      } else {
        window.location.href = '/dashboard';
      }
      return;
    }

    // ── Protected / Onboarding routes ──────────────────────────────────
    if (type === 'protected' || type === 'onboarding-only') {
      // No user at all → send to landing
      if (!user) {
        redirecting.current = true;
        window.location.href = '/';
        return;
      }

      // User exists but profile is still loading (null, not yet fetched)
      // Don't redirect yet — wait for profile to resolve
      if (!profile) return;

      // Setup not completed → must go to /profile-setup
      if (profile.setup_completed === false && !pathname.startsWith('/profile-setup')) {
        redirecting.current = true;
        window.location.href = '/profile-setup';
        return;
      }

      // Setup IS completed → should not be on /profile-setup
      if (profile.setup_completed === true && pathname.startsWith('/profile-setup')) {
        redirecting.current = true;
        window.location.href = '/dashboard';
        return;
      }
    }
  }, [user, profile, loading, type, pathname]);

  // Reset the redirect guard when the route changes (e.g., back button)
  useEffect(() => {
    redirecting.current = false;
  }, [pathname]);

  // ── Render gating ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0C0E14] z-[9999] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Don't render protected content for unauthenticated users
  if (!user && type !== 'public-only' && type !== 'public-optional') {
    return null;
  }

  // Don't flash protected content while being redirected to profile-setup
  if (user && profile?.setup_completed === false && !pathname.startsWith('/profile-setup') && type === 'protected') {
    return null;
  }

  // Don't render public-only content for authenticated users (they're being redirected)
  if (user && profile && type === 'public-only') {
    return (
      <div className="fixed inset-0 bg-[#0C0E14] z-[9999] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
