"use client";

import React, { useState } from 'react';
import { X, Image as ImageIcon, Link2, Hash } from 'lucide-react';

export default function OpenDiscussionModal({ isOpen, onClose }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[#1A1B22] border border-white/10 rounded-2xl shadow-2xl animate-fade-in overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-white">Open a Discussion</h2>
          <button 
            onClick={onClose}
            className="text-white/50 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">
          <input 
            type="text" 
            placeholder="What's your discussion about?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-xl font-bold text-white placeholder:text-white/30 outline-none border-b border-transparent focus:border-white/10 pb-2 transition-colors"
          />
          
          <textarea 
            placeholder="Share the details, ask a question, or start a debate..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-transparent text-sm text-white/80 placeholder:text-white/30 outline-none resize-none min-h-[150px]"
          />

          {/* Tags (Mocked) */}
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <span className="flex items-center gap-1 text-[11px] font-medium text-white/60 bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
              <Hash size={12} /> Add Tags
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#0C0E14]/50 p-4 sm:p-6 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors" title="Attach Image">
              <ImageIcon size={20} />
            </button>
            <button className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors" title="Attach Link">
              <Link2 size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="text-sm font-medium text-white/60 hover:text-white transition-colors px-4 py-2"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                alert('Discussion posted! (Mock)');
                onClose();
              }}
              disabled={!title.trim() || !content.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/30 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              Post Discussion
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
