"use client";

import React from 'react';
import Link from 'next/link';
import { Home, Compass, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-body flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[300px] bg-primary-navy/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[250px] bg-accent-yellow/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="z-10 flex flex-col items-center text-center space-y-6 max-w-md w-full animate-fade-in">
        
        {/* Floating 404 Icon Container */}
        <div className="relative w-32 h-32 flex items-center justify-center mb-4">
          <div className="absolute inset-0 bg-accent-yellow/10 rounded-full animate-ping opacity-75 duration-[3000ms]"></div>
          <div className="relative w-24 h-24 bg-surface-dark border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,186,9,0.15)]">
          
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-7xl font-heading font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 drop-shadow-sm">
            404
          </h1>
          <h2 className="text-xl font-bold text-on-surface tracking-wide">
            Lost in the Campus
          </h2>
          <p className="text-sm text-on-surface-variant/80 leading-relaxed px-4">
            The discussion room or page you are looking for has either been moved, deleted, or never existed in the first place.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-4 w-full">
          <Link 
            href="/"
            className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-on-surface px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
          >
            <Home size={16} />
            <span>Go Home</span>
          </Link>
          <Link 
            href="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 bg-accent-yellow text-bg-dark border border-accent-yellow/20 px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:shadow-[0_0_30px_rgba(255,186,9,0.4)] transition-all hover:scale-[1.02] active:scale-95"
          >
            <Compass size={16} />
            <span>Dashboard</span>
          </Link>
        </div>
        
        <div className="mt-8 flex items-center gap-2 text-[10px] text-on-surface-variant/40 font-mono">
          <AlertCircle size={12} />
          <span>Error Code: PAGE_NOT_FOUND</span>
        </div>
      </div>
    </div>
  );
}
