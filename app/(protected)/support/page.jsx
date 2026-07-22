"use client";

import React, { useState } from 'react';
import { AlertCircle, ShieldAlert, FileQuestion, ChevronDown, ChevronUp, LifeBuoy } from 'lucide-react';

const SUPPORT_CARDS = [
  {
    title: 'Report Problem',
    description: 'Encountered a bug or system error?',
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-400/10'
  },
  {
    title: 'Verification Issue',
    description: 'Troubles with academic credentials.',
    icon: ShieldAlert,
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
    question: 'How do I verify my institutional email?',
    answer: 'Go to your Profile settings, click on "Verify Account", and enter your .edu email address. A verification link will be sent to your inbox.'
  },
  {
    question: 'How do I earn Honor Points?',
    answer: 'You can earn Honor Points by participating actively in discussions, providing helpful answers that get upvoted, and maintaining a positive reputation in the community.'
  },
  {
    question: 'How can I report inappropriate content?',
    answer: 'Click on the three dots (...) on any post or comment, and select "Report Post". Our moderation team reviews all reports within 24 hours.'
  }
];

export default function SupportPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  return (
    <div className="max-w-4xl w-full mx-auto pb-20 md:pb-8 pt-4">
      {/* Header */}
      <div className="mb-10 px-2 flex items-center gap-4">
        <div className="p-3 bg-[#0033A0]/20 rounded-2xl">
          <LifeBuoy size={28} className="text-[#8FAAFF]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Support</h1>
          <p className="text-sm text-white/50 mt-1">How can we help you today?</p>
        </div>
      </div>
      
      {/* Support Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
        {SUPPORT_CARDS.map((card, idx) => (
          <div key={idx} className="bg-[#1A1B22] border border-white/5 hover:border-white/20 transition-all rounded-2xl p-6 cursor-pointer group hover:-translate-y-1 shadow-lg">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${card.bg} group-hover:scale-110 transition-transform`}>
              <card.icon size={24} className={card.color} />
            </div>
            <h3 className="text-lg font-bold text-[#E2E1EB] mb-2">{card.title}</h3>
            <p className="text-sm text-[#C4C5D5]/80 leading-relaxed">{card.description}</p>
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
