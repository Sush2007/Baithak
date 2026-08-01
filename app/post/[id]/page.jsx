import PostPageClient from "./PostPageClient";

export const metadata = {
  title: 'Post | Baithak',
  description: 'View discussion on Baithak',
};

export default function PostPage({ params }) {
  return <PostPageClient postId={params.id} />;
}
