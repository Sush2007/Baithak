import LandingPageClient from "./LandingPageClient";

export const revalidate = 3600; // Cache on Vercel Edge for 1 hour

export const metadata = {
  title: 'Baithak - Ek Aisi Baithak bhi Zaroori hai Mittar ! ',
  description: 'Ask questions, share study resources, and get class updates from seniors who actually know your course syllabus, canteen hacks, and exam patterns. Join your VSSUT campus circle on Baithak.',
  keywords: ['Baithak', 'VSSUT', 'VSSUT official page', 'sambalpur', 'vssut', 'kirba', 'baithak', 'vssut discussion', 'uce burla', 'burla', 'vssut blog', 'vssut clubs', 'illumina', 'samavesh', 'vasaunt', 'vssut placements', 'discussion hub', 'discussion forum', 'jee counselling', 'ojee counselling', 'vssut baithak', 'outr', 'engineering colleges in odisha', 'igit sarang', 'oldest engineering college', 'agastya hor', 'pulaha hor', 'pulastya hor', 'veerracers club vssut', 'odisha colleges', 'veerpreps', 'iitkirba', 'college discussion', 'university students platform', 'college doubt discussion', 'students mentorship', 'engineering student community', 'college community', 'academic doubts', 'career guidance', 'campus discussions', 'iitbbsr', 'nitr', 'vssut fee structure', 'vssut campus tour', 'iimsambalpur', 'iimsbp', 'vimsar', 'vssut cutoff', 'enigma'],
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["WebSite", "EducationalOrganization"],
    "name": "Baithak - VSSUT Student Discussion Platform",
    "url": "https://baithakpe.com",
    "description": "The official student-centered discussion platform for Veer Surendra Sai University of Technology (VSSUT), Burla. Join the campus circle.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Burla",
      "addressRegion": "Odisha",
      "postalCode": "768018",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "21.4984",
      "longitude": "83.8743"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://baithakpe.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
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
