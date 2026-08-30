"use client";

import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

const ProtectedRoute = ({ children, type = 'protected' }) => {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.setup_completed === false && !pathname.startsWith('/profile-setup')) {
        router.push('/profile-setup');
      } else if (profile.setup_completed === true && pathname.startsWith('/profile-setup')) {
        router.push('/dashboard');
      }
    }
  }, [user, profile, loading, router, pathname]);

  if (loading) {
    // Show a sleek loader to prevent UI flashing while AuthContext hydrates
    return (
      <div className="fixed inset-0 bg-[#0C0E14] z-[9999] flex items-center justify-center">
         <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // We ensure we don't render protected content to a completely unauthenticated client 
  if (!user && type !== 'public-only' && type !== 'public-optional') {
     return null;
  }

  // Don't render the content if they are being redirected
  if (user && profile?.setup_completed === false && !pathname.startsWith('/profile-setup')) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
