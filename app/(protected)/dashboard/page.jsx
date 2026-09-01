import DashboardPageClient from "./DashboardPageClient";

export const metadata = {
  title: 'Dashboard',
  description: 'Your VSSUT campus circle feed. Interact with peers, clear subject backlogs, and share course sheets.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  // We removed heavy blocking SSR (like fetching all tags across the DB)
  // to ensure the PWA loads instantly (TTFB < 100ms instead of 10s).
  // The client component will instantly mount and handle the data fetching gracefully.
  return <DashboardPageClient initialPosts={[]} initialTags={['All', 'trending']} />;
}
