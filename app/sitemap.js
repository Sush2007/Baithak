export default function sitemap() {
  return [
    {
      url: 'https://baithakpe.com',
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
    {
      url: 'https://baithakpe.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://baithakpe.com/privacy',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: 'https://baithakpe.com/terms',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ]
}
