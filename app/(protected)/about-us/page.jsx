import React from 'react';

export default function AboutUsPage() {
  return (
    <div className="max-w-3xl w-full mx-auto pb-20 md:pb-0">
      <div className="mb-8 px-2">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">About Baithak</h1>
        <p className="text-sm text-white/50">The VSSUT Campus Circle</p>
      </div>
      
      <div className="bg-[#1A1B22] border border-white/5 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-4">Our Mission</h2>
        <p className="text-white/70 leading-relaxed mb-6">
          Baithak was created to bridge the gap between students, alumni, and faculty at VSSUT. 
          It serves as a central hub for academic discussions, resource sharing, and community building.
        </p>
        <p className="text-sm text-white/40">Version 1.0.0 (Beta)</p>
      </div>
    </div>
  );
}
