"use client";

import React from 'react';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, type = 'protected' }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return null; // Silent loading for seamless experience, middleware handled the flash
  }

  // Middleware guarantees unauthenticated users cannot access protected routes.
  // We just return children if they made it here securely.
  
  // If they are on a protected route and don't have a profile yet (perhaps it's still fetching on client), 
  // we can show a silent loader until the client catches up with the server state.
  if (user && !profile && type !== 'public-only') {
     return null;
  }

  return children;
};

export default ProtectedRoute;
