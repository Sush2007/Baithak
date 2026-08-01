import AboutUsPageClient from "./AboutUsPageClient";

export const metadata = {
  title: 'About Us',
  description: 'Meet the team behind Baithak, a student-focused discussion platform designed to promote collaboration, academic exchange, and peer mentoring.',
  keywords: ['Baithak Team', 'Soumya Patnaik', 'Sushmit Satapathy', 'Akshit Bindhani', 'G Siddharth', 'VSSUT regular members'],
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Baithak",
    "url": "https://baithak-web-app.vercel.app/about",
    "description": "Student-centered discussion platform built to create meaningful conversations within educational communities.",
    "founder": [
      {
        "@type": "Person",
        "name": "Soumya Patnaik",
        "jobTitle": "Founder & CTO"
      },
      {
        "@type": "Person",
        "name": "Sushmit K. Satapathy",
        "jobTitle": "Co-Founder & CEO"
      },
      {
        "@type": "Person",
        "name": "Akshit Bindhani",
        "jobTitle": "Creative Head & COO"
      },
      {
        "@type": "Person",
        "name": "G. Siddharth",
        "jobTitle": "Product Manager"
      }
    ]
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
