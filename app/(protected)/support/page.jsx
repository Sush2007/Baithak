"use client";

import React, { useState } from 'react';
import { AlertCircle, ShieldAlert, FileQuestion , CircleQuestionMark, ChevronDown, ChevronUp, LifeBuoy, MessageSquare, X } from 'lucide-react';

const SUPPORT_CARDS = [
  {
    title: 'Report Problem',
    description: 'Encountered a bug or system error?',
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-400/10'
  },
  {
    title: 'Add your feedback',
    description: 'Help us improve with your suggestions.',
    icon: MessageSquare,
    color: 'text-[#FFC300]',
    bg: 'bg-[#FFC300]/10'
  },
  {
    title: 'General Inquiry',
    description: 'Questions about usage and rules.',
    icon: FileQuestion,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10'
  }
];

const FAQS = [
 
  {
    question: 'What are Honor Points and how do I earn them?',
    answer: 'Honor Points reward valuable participation. You earn them by completing profile verification, starting discussions, writing helpful answers, earning upvotes or Best Answer selections, maintaining contribution streaks, and reporting harmful content.'
  },
  {
    question: 'Can I redeem my Honor Points?',
    answer: 'Redemption is coming soon! Keep contributing and stacking your points to unlock exclusive perks, badges, and upcoming community rewards.'
  },
  {
    question: 'How can I report inappropriate content?',
    answer: 'Click on the three dots (...) on any post or comment, and select "Report Post". Our moderation team reviews all reports within 24 hours.'
  }
];

export default function SupportPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [openCardIndex, setOpenCardIndex] = useState(null);

  return (
    <div className="max-w-4xl w-full mx-auto pb-20 md:pb-8 pt-4">
      {/* Header */}
      <div className="mb-10 px-2 flex items-center gap-4">
        <div className="p-3 bg-[#0033A0]/20 rounded-2xl">
          <CircleQuestionMark size={28} className="text-[#8FAAFF]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Support</h1>
          <p className="text-sm text-white/50 mt-1">How can we help you today?</p>
        </div>
      </div>
      {/* Modal Overlay */}
      {openCardIndex !== null && (
        <SupportModal 
          card={SUPPORT_CARDS[openCardIndex]} 
          onClose={() => setOpenCardIndex(null)} 
        />
      )}
      
      {/* Support Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
        {SUPPORT_CARDS.map((card, idx) => (
          <div 
            key={idx} 
            onClick={() => setOpenCardIndex(idx)}
            className="bg-[#1A1B22] border border-white/5 hover:border-white/20 transition-all rounded-2xl p-6 cursor-pointer group hover:-translate-y-1 shadow-lg flex flex-col h-full"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${card.bg} group-hover:scale-110 transition-transform`}>
              <card.icon size={24} className={card.color} />
            </div>
            <h3 className="text-lg font-bold text-[#E2E1EB] mb-2">
              {card.title}
            </h3>
            <p className="text-sm text-[#C4C5D5]/80 leading-relaxed mb-2">{card.description}</p>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="bg-[#1A1B22] border border-[#444653] rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <FileQuestion size={16} className="text-white/70" />
          </div>
          <h2 className="text-xl font-bold text-[#E2E1EB]">Frequently Asked Questions</h2>
        </div>
        
        <div className="space-y-4">
          {FAQS.map((faq, index) => (
            <div 
              key={index} 
              className={`border border-[#444653] rounded-2xl overflow-hidden transition-all duration-300 ${openFaqIndex === index ? 'bg-white/5' : 'bg-transparent hover:bg-white/5'}`}
            >
              <button 
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
              >
                <span className="text-[15px] font-semibold text-[#E2E1EB] pr-8">{faq.question}</span>
                <div className="shrink-0">
                  {openFaqIndex === index ? (
                    <ChevronUp size={20} className="text-[#FFC300]" />
                  ) : (
                    <ChevronDown size={20} className="text-white/40" />
                  )}
                </div>
              </button>
              
              <div 
                className={`px-5 overflow-hidden transition-all duration-300 ${openFaqIndex === index ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <p className="text-sm text-[#C4C5D5] leading-relaxed border-t border-white/5 pt-4">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}

function SupportModal({ card, onClose }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!message.trim() || message.trim().length < 10) {
      alert('Please enter at least 10 characters.');
      return;
    }
    
    // Optimistic UI: Instantly close the modal and notify the user
    alert('Thank you! Your request has been sent to our support team.');
    onClose();

    // Fire-and-forget background request
    fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: card.title,
        message: message.trim()
      })
    }).catch(err => console.error('Background support submission failed:', err));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-[#1A1B22] border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-1"
        >
          <X size={24} />
        </button>
        
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg}`}>
            {React.createElement(card.icon, { size: 24, className: card.color })}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{card.title}</h3>
            <p className="text-sm text-white/50">{card.description}</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/80">
              {card.title === 'Add your feedback' ? 'Your Feedback' : 'Description'}
            </label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-[#0C0E14] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[120px] resize-none transition-all"
              placeholder={`Write your ${card.title.toLowerCase()} here...`}
            />
          </div>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || message.trim().length < 10}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-colors w-full mt-2"
          >
            {isSubmitting ? 'Sending...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
