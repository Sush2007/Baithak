export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/privacy',
          '/terms',
          '/post/',   // public discussion posts must be crawlable
        ],
        disallow: [
          '/dashboard',
          '/profile',
          '/profile-setup',
          '/notifications',
          '/connections',
          '/bookmarks',
          '/settings',
          '/events',
          '/search',
          '/support',
          '/api/',
          '/_next/',
        ],
      },
    ],
    sitemap: 'https://baithakpe.com/sitemap.xml',
    host: 'https://baithakpe.com',
  };
}
