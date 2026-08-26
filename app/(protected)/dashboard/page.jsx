import { createClient } from '../../../lib/supabaseServer';
import DashboardPageClient from "./DashboardPageClient";

export const metadata = {
  title: 'Dashboard',
  description: 'Your VSSUT campus circle feed. Interact with peers, clear subject backlogs, and share course sheets.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardPage() {
  // SSR: fetch first 10 posts + tags on the server in parallel
  // This eliminates the client waterfall: React boots → auth resolves → data fetches → renders
  // The client gets pre-populated HTML on first paint → huge FCP + LCP win
  let initialPosts = [];
  let initialTags = ['All'];

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [postsResult, tagsResult] = await Promise.all([
      supabase.rpc('get_feed_posts', {
        p_user_id: user?.id || null,
        p_tab: 'For You',
        p_tag_filter: 'All',
        p_limit: 10,
        p_offset: 0,
      }),
      supabase.from('posts').select('tags'),
    ]);

    if (!postsResult.error && postsResult.data) {
      initialPosts = postsResult.data.map(p => ({
        ...p,
        profiles: {
          username: p.author_username,
          display_name: p.author_display_name,
          avatar_url: p.author_avatar_url,
        },
        likes: [{ count: Number(p.likes_count) }],
        comments: [{ count: Number(p.comments_count) }],
      }));
    }

    if (!tagsResult.error && tagsResult.data) {
      const tagsSet = new Set();
      tagsResult.data.forEach(p => {
        if (p.tags && Array.isArray(p.tags)) p.tags.forEach(t => tagsSet.add(t));
      });
      initialTags = ['All', ...Array.from(tagsSet)];
    }
  } catch {
    // Fail silently — client will fetch on mount as fallback
  }

  return <DashboardPageClient initialPosts={initialPosts} initialTags={initialTags} />;
}
