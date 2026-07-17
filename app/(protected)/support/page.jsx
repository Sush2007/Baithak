import React from 'react';

export default function SupportPage() {
  return (
    <div className="max-w-3xl w-full mx-auto pb-20 md:pb-0">
      <div className="mb-8 px-2">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Support & Feedback</h1>
        <p className="text-sm text-white/50">Need help or want to report an issue?</p>
      </div>
      
      <div className="bg-[#1A1B22] border border-white/5 rounded-2xl p-12 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Submit a Report</h2>
        <p className="text-white/50 mb-6">Found a bug or inappropriate content? Let us know.</p>
        <button className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2.5 rounded-xl transition-colors">
          Open Support Ticket
        </button>
      </div>
    </div>
  );
}
