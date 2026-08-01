"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import PostCard from '../../../components/post/PostCard';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';

const PostPageClient = ({ postId }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *, 
          profiles(username, display_name, avatar_url),
          likes(count),
          comments(count)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (err) {
      console.error('Error fetching post:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute type="public-optional">
      <div className="min-h-screen bg-[#0C0E14] text-white font-body pb-20 md:pb-0 selection:bg-blue-500/30">
        
        {/* Simple Header */}
        <header className="sticky top-0 z-50 bg-[#0C0E14]/80 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/5 rounded-full transition-colors text-white">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-lg font-bold">Discussion</h1>
          </div>
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Baithak Logo" width={100} height={28} className="w-auto h-6 object-contain" />
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-3xl w-full mx-auto p-4 md:p-6 mt-4">
          {loading ? (
            <div className="flex justify-center p-8">
               <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : !post ? (
            <div className="text-center p-8 text-white/50">
              <p className="text-xl font-bold text-white mb-2">Post not found</p>
              <p>The discussion you are looking for may have been deleted or does not exist.</p>
            </div>
          ) : (
            <PostCard 
              post={post} 
              onReport={(p) => console.log('Report', p)}
              onQuickProfile={(id) => console.log('Profile', id)}
            />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default PostPageClient;
