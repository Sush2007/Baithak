import AboutUsPageClient from "./AboutUsPageClient";

export const metadata = {
  title: 'About Us — The Team Behind Baithak',
  description:
    'Meet the student founders behind Baithak — the official VSSUT discussion platform. Built by VSSUT students for VSSUT students to democratize campus knowledge.',
  alternates: {
    canonical: 'https://baithakpe.com/about',
  },
  keywords: [
    'Baithak Team', 'Soumya Patnaik', 'Sushmit Satapathy', 'Akshit Bindhani', 'G Siddharth',
    'VSSUT students', 'VSSUT founders', 'VSSUT startup', 'student built platform',
    'VSSUT community', 'about Baithak', 'who built Baithak',
  ],
};

export default function AboutPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://baithakpe.com/about#webpage',
        url: 'https://baithakpe.com/about',
        name: 'About Baithak — The Team',
        description:
          'Meet the student founders behind Baithak, the official VSSUT discussion platform.',
        isPartOf: { '@id': 'https://baithakpe.com/#website' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://baithakpe.com' },
            { '@type': 'ListItem', position: 2, name: 'About', item: 'https://baithakpe.com/about' },
          ],
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://baithakpe.com/#organization',
        name: 'Baithak',
        url: 'https://baithakpe.com',
        logo: 'https://baithakpe.com/logo.png',
        description:
          'Student-centered discussion platform built to create meaningful conversations within the VSSUT educational community.',
        founder: [
          {
            '@type': 'Person',
            name: 'Soumya Patnaik',
            jobTitle: 'Founder & CTO',
            worksFor: { '@id': 'https://baithakpe.com/#organization' },
            alumniOf: {
              '@type': 'CollegeOrUniversity',
              name: 'Veer Surendra Sai University of Technology',
              alternateName: 'VSSUT',
            },
          },
          {
            '@type': 'Person',
            name: 'Sushmit K. Satapathy',
            jobTitle: 'Co-Founder & CEO',
            worksFor: { '@id': 'https://baithakpe.com/#organization' },
            alumniOf: {
              '@type': 'CollegeOrUniversity',
              name: 'Veer Surendra Sai University of Technology',
              alternateName: 'VSSUT',
            },
          },
          {
            '@type': 'Person',
            name: 'Akshit Bindhani',
            jobTitle: 'Creative Head & COO',
            worksFor: { '@id': 'https://baithakpe.com/#organization' },
          },
          {
            '@type': 'Person',
            name: 'G. Siddharth',
            jobTitle: 'Product Manager',
            worksFor: { '@id': 'https://baithakpe.com/#organization' },
          },
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
      <AboutUsPageClient />
    </>
  );
}
