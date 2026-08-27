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
  description:
    'The official student-centered discussion platform for Veer Surendra Sai University of Technology (VSSUT), Burla. Ask questions, share study resources, get campus updates, and connect with seniors.',
  keywords: [
    // Brand
    'Baithak', 'VSSUT Baithak', 'baithakpe', 'baithakpe.com',
    // Institution
    'VSSUT', 'Veer Surendra Sai University of Technology', 'UCE Burla', 'Burla', 'Sambalpur', 'Odisha',
    // Student intent
    'VSSUT discussion', 'VSSUT forum', 'VSSUT student community', 'VSSUT peer mentoring',
    'VSSUT placements', 'VSSUT cutoff', 'VSSUT fee structure', 'VSSUT campus', 'VSSUT clubs',
    'VSSUT admission', 'VSSUT OJEE counselling', 'VSSUT JEE counselling', 'VSSUT syllabus',
    'VSSUT exam', 'VSSUT results', 'VSSUT hostel', 'VSSUT canteen', 'VSSUT semester',
    // Club & events
    'Illumina VSSUT', 'Samavesh VSSUT', 'Enigma VSSUT', 'VeerRacers VSSUT',
    'VSSUT hackathon', 'VSSUT technical fest', 'VSSUT cultural fest',
    // Broader
    'engineering colleges Odisha', 'OUTR', 'IGIT Sarang', 'IIT Bhubaneswar', 'NIT Rourkela',
    'IIM Sambalpur', 'VIMSAR', 'student discussion platform', 'college doubt forum',
    'engineering student community', 'academic peer learning', 'campus discussion hub',
    // People
    'Agastya Hor', 'Pulaha Hor', 'Pulastya Hor',
  ],
  authors: [{ name: 'Soumya Patnaik' }, { name: 'Sushmit K. Satapathy' }],
  alternates: {
    canonical: 'https://baithakpe.com',
  },
  verification: {
    google: 'gNNmciSuuHg4S2Wdhn2Pp8fjN51N5Ny9cxaS2qnQOBU',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.png',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Baithak - VSSUT Student Discussion & Campus Circle',
    description:
      'The official student-centered discussion platform for Veer Surendra Sai University of Technology (VSSUT), Burla. Ask, discuss, and grow together.',
    url: 'https://baithakpe.com',
    siteName: 'VSSUT Baithak',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Baithak — VSSUT Student Discussion Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Baithak - VSSUT Student Discussion Platform',
    description:
      'The official student-centered discussion platform for VSSUT, Burla. Ask questions, share resources, connect with seniors.',
    images: ['/og-image.png'],
  },
};

import { Toaster } from 'react-hot-toast';
import { CSPostHogProvider } from './providers';
import InstallPrompt from '../components/InstallPrompt';

// ─── JSON-LD Structured Data ──────────────────────────────────────────────────
// Covers: WebSite (with SearchAction), Organization, FAQPage, SiteLinksSearchBox
// FAQPage schema directly feeds Google AI Overviews and Featured Snippets.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    // 1. WebSite + Sitelinks Search Box
    {
      '@type': 'WebSite',
      '@id': 'https://baithakpe.com/#website',
      name: 'Baithak — VSSUT Discussion Forum',
      url: 'https://baithakpe.com',
      description:
        'The official student-centered discussion platform for Veer Surendra Sai University of Technology (VSSUT), Burla.',
      inLanguage: 'en-IN',
      potentialAction: [
        {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://baithakpe.com/search?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      ],
    },

    // 2. Organization
    {
      '@type': 'Organization',
      '@id': 'https://baithakpe.com/#organization',
      name: 'Baithak',
      alternateName: ['VSSUT Baithak', 'Baithak VSSUT', 'baithakpe'],
      url: 'https://baithakpe.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://baithakpe.com/logo.png',
        width: 512,
        height: 512,
      },
      description:
        'The premier student community and discussion forum for Veer Surendra Sai University of Technology (VSSUT), Burla, Odisha.',
      foundingDate: '2024',
      founders: [
        { '@type': 'Person', name: 'Soumya Patnaik', jobTitle: 'Founder & CTO' },
        { '@type': 'Person', name: 'Sushmit K. Satapathy', jobTitle: 'Co-Founder & CEO' },
      ],
      parentOrganization: {
        '@type': 'CollegeOrUniversity',
        name: 'Veer Surendra Sai University of Technology',
        alternateName: ['VSSUT', 'UCE Burla'],
        url: 'https://www.vssut.ac.in',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Burla',
          addressLocality: 'Burla',
          addressRegion: 'Odisha',
          postalCode: '768018',
          addressCountry: 'IN',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: '21.4984',
          longitude: '83.8743',
        },
      },
    },

    // 3. FAQPage — powers Google AI Overviews and Featured Snippets
    {
      '@type': 'FAQPage',
      '@id': 'https://baithakpe.com/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is Baithak only for my college?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Currently, Baithak is only for VSSUT students. Later it will be expanded to other colleges too.',
          },
        },
        {
          '@type': 'Question',
          name: 'What are Honor Points and how do I earn them on Baithak?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Honor Points reward meaningful participation on Baithak. You earn them by completing verification, starting discussions, writing helpful answers, earning upvotes or Best Answer selections, keeping daily streaks, and reporting harmful content.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I remain anonymous on Baithak?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! While you must verify your identity to join the platform, you can choose a custom Username and Avatar. Your real name and email are never shown publicly.',
          },
        },
        {
          '@type': 'Question',
          name: 'Who can answer questions on Baithak?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Only students from your college — seniors, peers, and alumni — can answer. This ensures that every answer is highly contextual to your specific professors and campus culture at VSSUT.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Baithak free to use?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, Baithak is 100% free for all VSSUT students. Our mission is to democratize campus knowledge and make it accessible without any paywalls.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I install Baithak as an app on my phone?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely! Baithak is built as a Progressive Web App (PWA). Open the website in Chrome or Safari on your phone, tap Share or browser options, and select Add to Home Screen to install it natively.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is VSSUT Baithak?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'VSSUT Baithak (baithakpe.com) is the official student discussion platform for Veer Surendra Sai University of Technology, Burla, Odisha. Students use it to ask academic questions, discuss VSSUT placements, share study resources, talk about campus clubs like Illumina, Enigma, Samavesh, and stay updated on campus life.',
          },
        },
        {
          '@type': 'Question',
          name: 'How is Baithak different from other student forums?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Unlike generic platforms like Quora or Reddit, Baithak is exclusively for VSSUT students. Every answer comes from someone who has attended the same classes, eaten at the same canteen, and navigated the same exam patterns — making the advice hyper-relevant.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={plusJakartaSans.className}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <CSPostHogProvider>
          <AuthProvider>
            {children}
            <InstallPrompt />
          </AuthProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1A1B22',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
              },
            }}
          />
          <Analytics />
          <SpeedInsights />
        </CSPostHogProvider>
      </body>
    </html>
  );
}
