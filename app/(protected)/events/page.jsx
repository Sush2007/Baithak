import React from 'react';

export default function EventsPage() {
  return (
    <div className="max-w-3xl w-full mx-auto pb-20 md:pb-0">
      <div className="mb-8 px-2">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Campus Events</h1>
        <p className="text-sm text-white/50">Discover hackathons, seminars, and club meetings.</p>
      </div>
      
      <div className="bg-[#1A1B22] border border-white/5 rounded-2xl p-12 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Coming Soon</h2>
        <p className="text-white/50">The events calendar is currently being updated for the new semester.</p>
      </div>
    </div>
  );
}
