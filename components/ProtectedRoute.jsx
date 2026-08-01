"use client";

import React from 'react';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, type = 'protected' }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // Show a sleek loader to prevent UI flashing while AuthContext hydrates
    return (
      <div className="fixed inset-0 bg-[#0C0E14] z-[9999] flex items-center justify-center">
         <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Middleware guarantees that if user is on this route, they belong here.
  // We just ensure we don't render protected content to a completely unauthenticated client 
  // (though middleware covers this too, this prevents momentary client hydration mismatches)
  if (!user && type !== 'public-only' && type !== 'public-optional') {
     return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
