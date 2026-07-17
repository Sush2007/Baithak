import DashboardPageClient from "./DashboardPageClient";

export const metadata = {
  title: 'Campus Dashboard Feed',
  description: 'Your VSSUT campus circle feed. Interact with peers, clear subject backlogs, and share course sheets.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return <DashboardPageClient />;
}
