import LandingPageClient from "./LandingPageClient";

export const revalidate = 3600; // Cache on Vercel Edge for 1 hour

export const metadata = {
  title: 'Baithak — Ek Aisi Baithak bhi Zaroori Hai Mittar!',
  description:
    'Ask questions, share study resources, and get class updates from seniors who actually know your VSSUT course syllabus, canteen hacks, and exam patterns. Join the official VSSUT campus circle on Baithak.',
  alternates: {
    canonical: 'https://baithakpe.com',
  },
  keywords: [
    'Baithak', 'VSSUT', 'VSSUT official page', 'Sambalpur', 'vssut', 'kirba',
    'baithak', 'vssut discussion', 'uce burla', 'burla', 'vssut blog', 'vssut clubs',
    'illumina', 'samavesh', 'vssut placements', 'discussion hub', 'discussion forum',
    'jee counselling', 'ojee counselling', 'vssut baithak', 'outr',
    'engineering colleges in odisha', 'igit sarang', 'oldest engineering college',
    'agastya hor', 'pulaha hor', 'pulastya hor', 'veerracers club vssut', 'odisha colleges',
    'veerpreps', 'iitkirba', 'college discussion', 'university students platform',
    'college doubt discussion', 'students mentorship', 'engineering student community',
    'college community', 'academic doubts', 'career guidance', 'campus discussions',
    'iitbbsr', 'nitr', 'vssut fee structure', 'vssut campus tour', 'iimsambalpur',
    'iimsbp', 'vimsar', 'vssut cutoff', 'enigma', 'vssut hostel', 'vssut admission',
    'vssut exam', 'vssut syllabus', 'vssut results', 'vssut semester',
    'vssut technical fest', 'vssut cultural fest', 'vssut hackathon',
  ],
};

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      // Primary WebPage entity for the landing page
      {
        '@type': 'WebPage',
        '@id': 'https://baithakpe.com/#webpage',
        url: 'https://baithakpe.com',
        name: 'Baithak — Official VSSUT Student Discussion Platform',
        description:
          'The official student-centered discussion platform for Veer Surendra Sai University of Technology (VSSUT), Burla. Join the campus circle.',
        isPartOf: { '@id': 'https://baithakpe.com/#website' },
        about: { '@id': 'https://baithakpe.com/#organization' },
        inLanguage: 'en-IN',
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://baithakpe.com',
            },
          ],
        },
      },

      // DiscussionForumPosting entity — signals to Google that this is a discussion forum
      {
        '@type': 'DiscussionForumPosting',
        '@id': 'https://baithakpe.com/#forum',
        name: 'VSSUT Student Discussion Forum',
        url: 'https://baithakpe.com',
        description:
          'VSSUT students discuss academics, placements, exams, clubs, campus life, career guidance, and more on Baithak.',
        about: [
          { '@type': 'Thing', name: 'VSSUT Placements' },
          { '@type': 'Thing', name: 'VSSUT Exam Preparation' },
          { '@type': 'Thing', name: 'VSSUT Campus Life' },
          { '@type': 'Thing', name: 'Engineering Colleges Odisha' },
          { '@type': 'Thing', name: 'Student Mentorship' },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageClient />
    </>
  );
}
