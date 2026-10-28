import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Fixed dates: update a page's date when its content changes, so lastmod stays a reliable signal.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: '2026-10-28',
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/realisations`,
      lastModified: '2026-10-28',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/mentions-legales`,
      lastModified: '2026-10-28',
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
