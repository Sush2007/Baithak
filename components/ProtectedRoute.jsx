"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, type = 'protected' }) => {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // 1. Unauthenticated users handling
    if (!user) {
      if (type !== 'public-only') {
        router.replace('/');
      }
      return;
    }

    // 2. Authenticated but profile onboarding is NOT completed yet
    if (profile && !profile.setup_completed) {
      if (type !== 'onboarding-only') {
        router.replace('/profile-setup');
      }
      return;
    }

    // 3. Authenticated and profile onboarding is fully completed
    if (profile && profile.setup_completed) {
      if (type !== 'protected') {
        router.replace('/dashboard');
      }
      return;
    }
  }, [user, profile, loading, type, router]);

  useEffect(() => {
    let retryTimer;
    if (user && !profile && !loading) {
      // Attempt to fetch profile again after 3 seconds if stuck
      retryTimer = setTimeout(() => {
        if (typeof refreshProfile === 'function') {
          refreshProfile();
        }
      }, 3000);
    }
    return () => clearTimeout(retryTimer);
  }, [user, profile, loading, refreshProfile]);

  if (loading) {
    return null; // Silent loading for seamless experience
  }

  // Handle intermediate profile sync state loading
  if (user && !profile) {
    return null; // Silent loading for seamless experience
  }

  // 1. Unauthenticated
  if (!user && type === 'public-only') {
    return children;
  }

  // 1.5 Unauthenticated but requesting protected route - silent redirect
  if (!user && type !== 'public-only') {
    return null;
  }

  // 2. Authenticated, onboarding incomplete
  if (user && profile && !profile.setup_completed && type === 'onboarding-only') {
    return children;
  }

  // 3. Authenticated, onboarding complete
  if (user && profile && profile.setup_completed && type === 'protected') {
    return children;
  }

  // While redirecting, show null to prevent layout flashing
  return null;
};

export default ProtectedRoute;
