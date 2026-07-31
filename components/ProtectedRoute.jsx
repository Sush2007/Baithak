"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, type = 'protected' }) => {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If we're on a protected route, have a user and profile, and setup isn't completed, redirect to setup
    if (!loading && user && profile && !profile.setup_completed && type !== 'public-only' && type !== 'onboarding') {
      router.push('/profile-setup');
    }
  }, [user, profile, loading, router, type]);

  if (loading) {
    return null; // Silent loading for seamless experience, middleware handled the flash
  }

  // Middleware guarantees unauthenticated users cannot access protected routes.
  // We just return children if they made it here securely.
  
  // If they are on a protected route and don't have a profile yet (perhaps it's still fetching on client), 
  // we can show a silent loader until the client catches up with the server state.
  if (user && (!profile || !profile.setup_completed) && type !== 'public-only' && type !== 'onboarding') {
     return null;
  }

  return children;
};

export default ProtectedRoute;
