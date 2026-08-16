export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/private/', '/settings/', '/bookmarks/'],
    },
    sitemap: 'https://baithakpe.com/sitemap.xml',
  }
}
