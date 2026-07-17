"use client";

import React, { useState } from 'react';
import { CheckCheck, MessageSquare, Award, AtSign, ShieldCheck, AlertCircle } from 'lucide-react';

const TABS = ['All', 'Replies', 'Mentions', 'Honor Points', 'Verification', 'System'];

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: 'reply',
    title: 'Professor Aris replied to your discussion in',
    highlight: 'Macroeconomics 101',
    content: '"Your analysis on the current inflation trend is quite remarkable. Have you considered the impact of..."',
    time: '2m ago',
    unread: true,
    icon: MessageSquare,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-400/10',
    actions: [
      { label: 'View Discussion', primary: true },
      { label: 'Mark Read', primary: false }
    ]
  },
  {
    id: 2,
    type: 'honor',
    title: 'You earned',
    highlight: '+50 Honor Points!',
    content: 'Your paper "Modern Debt Cycles" was cited by 3 senior members today. Keep contributing to climb the ranks!',
    time: '1h ago',
    unread: true,
    icon: Award,
    iconColor: 'text-accent-yellow',
    iconBg: 'bg-accent-yellow/10',
    actions: [
      { label: 'Check Rank', primary: true }
    ]
  },
  {
    id: 3,
    type: 'mention',
    title: 'Sarah Jenkins mentioned you in a comment',
    highlight: '',
    content: '"I think @Alex_Rivers might have the dataset we need for the regression analysis..."',
    time: '4h ago',
    unread: false,
    icon: AtSign,
    iconColor: 'text-red-400',
    iconBg: 'bg-red-400/10',
    actions: [
      { label: 'Reply', primary: false }
    ]
  },
  {
    id: 4,
    type: 'verification',
    title: 'Verification Successful',
    highlight: '',
    content: 'Your academic credentials have been verified. You now have access to exclusive faculty discussion rooms.',
    time: 'Yesterday',
    unread: false,
    icon: ShieldCheck,
    iconColor: 'text-white/60',
    iconBg: 'bg-white/5',
    actions: [
      { label: 'Dismiss', primary: false, textOnly: true }
    ]
  },
  {
    id: 5,
    type: 'system',
    title: 'New Login Detected',
    highlight: '',
    content: 'A login was detected from a new browser in Zurich, Switzerland. If this wasn\'t you, please change your password immediately.',
    time: '2 days ago',
    unread: false,
    icon: AlertCircle,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-500/10',
    actions: []
  }
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('All');

  return (
    <div className="max-w-3xl w-full mx-auto pb-20 md:pb-0">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-8 px-2">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Notifications</h1>
          <p className="text-sm text-white/50">Stay updated with replies, rewards, and account activity</p>
        </div>
        <button className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white transition-colors">
          <CheckCheck size={16} /> Mark all as read
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide gap-8 px-2 border-b border-white/5 mb-6">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-medium transition-colors whitespace-nowrap relative ${
              activeTab === tab ? 'text-white' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {MOCK_NOTIFICATIONS.map(notification => (
          <div key={notification.id} className="bg-[#1A1B22] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors relative flex gap-4">
            
            {/* Unread Indicator */}
            {notification.unread && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1.5 bg-accent-yellow rounded-r-full" />
            )}

            {/* Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notification.iconBg} ${notification.iconColor}`}>
              <notification.icon size={18} />
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-white/90">
                  {notification.title} <span className="text-blue-400">{notification.highlight}</span>
                </p>
                <span className="text-xs text-white/40 shrink-0 ml-4">{notification.time}</span>
              </div>
              
              <p className="text-sm text-white/50 leading-relaxed mb-4">
                {notification.content}
              </p>

              {/* Actions */}
              {notification.actions && notification.actions.length > 0 && (
                <div className="flex gap-3">
                  {notification.actions.map((action, idx) => {
                    if (action.textOnly) {
                      return (
                        <button key={idx} className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
                          {action.label}
                        </button>
                      );
                    }
                    return (
                      <button 
                        key={idx}
                        className={`text-xs font-medium px-4 py-2 rounded-xl transition-colors ${
                          action.primary 
                            ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                            : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white/80'
                        }`}
                        style={action.primary && notification.iconColor === 'text-accent-yellow' ? { backgroundColor: '#FFD700', color: '#1A1B22' } : {}}
                      >
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        ))}
      </div>
      
    </div>
  );
}
