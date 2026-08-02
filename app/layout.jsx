import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://baithakpe.com'),
  title: {
    default: 'Baithak - Student Discussion Platform',
    template: '%s | Baithak',
  },
  description: 'A student-centered discussion platform built to create meaningful conversations within educational communities. Connect, ask questions, share ideas, and grow together.',
  keywords: ['Baithak', 'Student Discussion', 'VSSUT', 'Campus Community', 'Peer Learning', 'Academic Queries', 'Colleges', 'Study Material'],
  authors: [{ name: 'Soumya Patnaik' }, { name: 'Sushmit K. Satapathy' }],
  verification: {
    google: 'gNNmciSuuHg4S2Wdhn2Pp8fjN51N5Ny9cxaS2qnQOBU',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.png',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Baithak - Student Discussion & Campus Circle',
    description: 'A student-centered discussion platform built to create meaningful conversations within educational communities.',
    url: 'https://baithakpe.com',
    siteName: 'Baithak',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'Baithak Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Baithak - Student Discussion Platform',
    description: 'A student-centered discussion platform built to create meaningful conversations within educational communities.',
    images: ['/logo.png'],
  },
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={plusJakartaSans.className}>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#1A1B22', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
