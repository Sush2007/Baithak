import { createClient } from '@supabase/supabase-js';

export const revalidate = 3600; // Revalidate every hour

export default async function sitemap() {
  // Static pages
  const staticPages = [
    {
      url: 'https://baithakpe.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: 'https://baithakpe.com/privacy',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: 'https://baithakpe.com/terms',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Dynamically include all public post pages
  let postPages = [];
  try {
    // Initialize vanilla Supabase client directly without Next.js cookies hook 
    // to prevent DynamicServerError during static sitemap generation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data: posts, error } = await supabase
        .from('posts')
        .select('id, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5000); // Sitemap limit safety cap

      if (!error && posts) {
        postPages = posts.map((post) => ({
          url: `https://baithakpe.com/post/${post.id}`,
          lastModified: new Date(post.updated_at || new Date()),
          changeFrequency: 'weekly',
          priority: 0.7,
        }));
      }
    }
  } catch (err) {
    console.error('[sitemap] Failed to fetch posts:', err.message);
  }

  return [...staticPages, ...postPages];
}
