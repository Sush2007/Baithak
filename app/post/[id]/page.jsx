import { createClient } from '../../../lib/supabaseServer';
import PostPageClient from "./PostPageClient";

// generateMetadata runs server-side for each post — gives every discussion its own
// unique title, description, OG card, and JSON-LD schema for Google indexing.
export async function generateMetadata({ params }) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: post, error } = await supabase
      .from('posts')
      .select('title, content, tags, created_at, profiles!posts_author_id_fkey(display_name, username)')
      .eq('id', id)
      .single();

    if (error || !post) {
      return {
        title: 'Discussion | Baithak',
        description: 'View this discussion on Baithak — the official VSSUT student platform.',
        robots: { index: false },
      };
    }

    // Build a clean description: strip markdown/newlines, cap at 160 chars
    const rawContent = post.content || '';
    const cleanDescription = rawContent
      .replace(/[#*`_~[\]()>!]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 155);

    const description = cleanDescription
      ? `${cleanDescription}… — VSSUT Baithak`
      : `Join the discussion on Baithak — the official VSSUT student platform.`;

    const tags = Array.isArray(post.tags) ? post.tags : [];
    const authorName = post.profiles?.display_name || post.profiles?.username || 'A VSSUT student';

    return {
      title: post.title,
      description,
      alternates: {
        canonical: `https://baithakpe.com/post/${id}`,
      },
      keywords: [
        'VSSUT discussion',
        'VSSUT Baithak',
        'VSSUT student forum',
        ...tags,
        ...(tags.map(t => `VSSUT ${t}`)),
      ],
      openGraph: {
        title: `${post.title} | VSSUT Baithak`,
        description,
        url: `https://baithakpe.com/post/${id}`,
        type: 'article',
        publishedTime: post.created_at,
        authors: [authorName],
        tags,
        images: [
          {
            url: '/og-image.png',
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${post.title} | VSSUT Baithak`,
        description,
        images: ['/og-image.png'],
      },
    };
  } catch {
    return {
      title: 'Discussion | Baithak',
      description: 'View this discussion on Baithak — the official VSSUT student platform.',
    };
  }
}

export default async function PostPage({ params }) {
  const { id } = await params;

  // Fetch post data server-side for JSON-LD structured data
  let post = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('posts')
      .select('title, content, tags, created_at, profiles!posts_author_id_fkey(display_name, username)')
      .eq('id', id)
      .single();
    post = data;
  } catch {
    // Client will handle missing post gracefully
  }

  const tags = Array.isArray(post?.tags) ? post.tags : [];

  const jsonLd = post
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'DiscussionForumPosting',
            '@id': `https://baithakpe.com/post/${id}`,
            url: `https://baithakpe.com/post/${id}`,
            headline: post.title,
            text: (post.content || '').replace(/[#*`_~[\]()>!]/g, '').replace(/\s+/g, ' ').trim().slice(0, 500),
            datePublished: post.created_at,
            author: {
              '@type': 'Person',
              name: post.profiles?.display_name || post.profiles?.username || 'VSSUT Student',
            },
            isPartOf: { '@id': 'https://baithakpe.com/#website' },
            about: {
              '@type': 'CollegeOrUniversity',
              name: 'Veer Surendra Sai University of Technology',
              alternateName: 'VSSUT',
            },
            keywords: ['VSSUT', 'VSSUT Baithak', 'student discussion', ...tags].join(', '),
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://baithakpe.com' },
                { '@type': 'ListItem', position: 2, name: 'Discussion', item: `https://baithakpe.com/post/${id}` },
              ],
            },
          },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PostPageClient postId={id} />
    </>
  );
}
