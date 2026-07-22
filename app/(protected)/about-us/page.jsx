import React from 'react';
import Link from 'next/link';

export default function AboutUsPage() {
  return (
    <div className="max-w-2xl w-full mx-auto pb-20 md:pb-0">
      <div className="mb-6 px-2">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">About Baithak</h1>
        <p className="text-xs text-white/50">The VSSUT Campus Circle</p>
      </div>
      
      <div className="bg-[#1A1B22] border border-white/5 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Our Mission</h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Baithak was created to bridge the gap between students, alumni, and faculty at VSSUT. 
          It serves as a central hub for academic discussions, resource sharing, and community building.
        </p>
        <div className="mb-6">
          <a 
            href="https://www.baithakpe.com/about" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-[#8FAAFF] hover:text-white transition-colors"
          >
            Know More
          </a>
        </div>
        <p className="text-xs text-white/40">Version 1.0.0 (Beta)</p>
      </div>
    </div>
  );
}
