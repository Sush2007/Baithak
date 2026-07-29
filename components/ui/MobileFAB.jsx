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
        className="md:hidden fixed bottom-24 right-6 z-40 bg-[#0052FF] hover:bg-[#0040C5] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>
      
      <OpenDiscussionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
