"use client";

import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import PostCard from '../../../components/post/PostCard';
import Link from 'next/link';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Discussions'); // 'Discussions' | 'Username'
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // Search logic
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const queryStr = debouncedQuery.toLowerCase();
        
        if (activeTab === 'Discussions') {
          // Search in posts
          const { data, error } = await supabase
            .from('posts')
            .select(`
              *, 
              profiles!posts_author_id_fkey(username, display_name, avatar_url),
              likes(count),
              comments(count)
            `)
            .or(`title.ilike.%${queryStr}%,content.ilike.%${queryStr}%`)
            .order('created_at', { ascending: false })
            .limit(20);
          
          if (error) throw error;
          setResults(data || []);
        } else {
          // Search in profiles (Username)
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .or(`username.ilike.%${queryStr}%,display_name.ilike.%${queryStr}%`)
            .limit(20);
            
          if (error) throw error;
          setResults(data || []);
        }
      } catch (err) {
        console.error('Search error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, activeTab]);

  return (
    <div className="max-w-3xl w-full mx-auto pb-20 md:pb-8 pt-4 px-2">
      <div className="mb-6 relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E909E]" />
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={activeTab === 'Discussions' ? "Search discussions..." : "Search by username..."}
          autoFocus
          className="w-full bg-[#1A1B22] border border-white/10 text-white rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-[#0052FF]/50 focus:ring-1 focus:ring-[#0052FF]/50 transition-all text-lg placeholder:text-[#8E909E]"
        />
      </div>

      <div className="flex border-b border-white/5 mb-6">
        {['Discussions', 'Username'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setResults([]); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab ? 'text-white' : 'text-[#8E909E] hover:text-white/80'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#8FAAFF]" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 text-[#8FAAFF] animate-spin" />
          </div>
        ) : results.length > 0 ? (
          activeTab === 'Discussions' ? (
            results.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                onDelete={(deletedId) => setResults(prev => prev.filter(p => p.id !== deletedId))}
              />
            ))
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((user) => (
                <Link key={user.id} href={`/profile/${user.id}`} className="bg-[#1A1B22] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/20 transition-all group">
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-[#0C0E14] border border-white/10 relative">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-[#8A2387] to-[#F27121] flex items-center justify-center text-lg">👤</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold truncate group-hover:text-[#8FAAFF] transition-colors">{user.display_name}</h4>
                    <p className="text-[#8E909E] text-sm truncate">@{user.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : debouncedQuery ? (
          <div className="text-center py-12 text-[#8E909E]">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p>No results found for "{debouncedQuery}"</p>
          </div>
        ) : (
          <div className="text-center py-12 text-[#8E909E]">
            <p>Type above to start searching</p>
          </div>
        )}
      </div>
    </div>
  );
}
