"use client";

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import OpenDiscussionModal from '../modals/OpenDiscussionModal';

export default function MobileFAB() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-24 right-6 z-40 w-[60px] h-[60px] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,82,255,0.4)] transition-transform hover:scale-105 active:scale-95 p-[3px] overflow-hidden group"
      >
        <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#0033A0_0%,#00E5FF_33%,#FFC300_66%,#0033A0_100%)] opacity-90 group-hover:opacity-100 transition-opacity duration-300"></span>
        <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[#0C0E14] text-white">
          <Plus size={28} strokeWidth={2.5} />
        </div>
      </button>
      
      <OpenDiscussionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
