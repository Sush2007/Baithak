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
    default: 'Baithak - Official VSSUT Student Discussion Platform',
    template: '%s | Baithak - VSSUT',
  },
  description: 'The official student-centered discussion platform for Veer Surendra Sai University of Technology (VSSUT), Burla. Ask questions, share study resources, and get campus updates.',
  keywords: ['VSSUT', 'VSSUT Baithak', 'VSSUT Discussion', 'Veer Surendra Sai University of Technology', 'Burla', 'Odisha Colleges', 'UCE Burla', 'Student Discussion', 'Campus Community', 'Peer Learning', 'Academic Queries'],
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
    title: 'Baithak - VSSUT Student Discussion & Campus Circle',
    description: 'The official student-centered discussion platform for Veer Surendra Sai University of Technology (VSSUT), Burla.',
    url: 'https://baithakpe.com',
    siteName: 'VSSUT Baithak',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'Baithak Logo - VSSUT',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Baithak - VSSUT Student Discussion Platform',
    description: 'The official student-centered discussion platform for Veer Surendra Sai University of Technology (VSSUT), Burla.',
    images: ['/logo.png'],
  },
};

import { Toaster } from 'react-hot-toast';
import { CSPostHogProvider } from './providers';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={plusJakartaSans.className}>
      <body suppressHydrationWarning>
        <CSPostHogProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster position="bottom-right" toastOptions={{ style: { background: '#1A1B22', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
          <Analytics />
          <SpeedInsights />
        </CSPostHogProvider>
      </body>
    </html>
  );
}
