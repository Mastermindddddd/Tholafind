import type { MetadataRoute } from 'next';
import { connectToDatabase } from '@/lib/db';
import { SearchResult, CommunityRequest } from '@/lib/models';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tholafind.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectToDatabase();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/pricing`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/browse`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/browse/retail`, changeFrequency: 'hourly', priority: 0.7 },
    { url: `${SITE_URL}/browse/resale`, changeFrequency: 'hourly', priority: 0.7 },
    { url: `${SITE_URL}/browse/vintage`, changeFrequency: 'hourly', priority: 0.7 },
    { url: `${SITE_URL}/community`, changeFrequency: 'hourly', priority: 0.6 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/refund-policy`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Item detail pages are the bulk of the real SEO value here. Capped at a
  // reasonable number (most recent, highest-quality first) rather than
  // every result ever found — a sitemap with hundreds of thousands of URLs
  // needs sitemap indexing/pagination, which is a real future step once
  // volume actually gets there, not something worth faking now.
  const items = await SearchResult.find({ confidence: { $in: ['exact', 'close'] } })
    .sort({ createdAt: -1 })
    .limit(2000)
    .select('_id updatedAt')
    .lean();

  const itemPages: MetadataRoute.Sitemap = items.map((item) => ({
    url: `${SITE_URL}/browse/item/${item._id}`,
    lastModified: item.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  // Open community requests are also real, fresh, keyword-relevant content
  // — worth including, capped similarly.
  const openRequests = await CommunityRequest.find({ status: 'open' })
    .select('_id updatedAt')
    .limit(500)
    .lean();

  const requestPages: MetadataRoute.Sitemap = openRequests.map((r) => ({
    url: `${SITE_URL}/community/${r._id}`,
    lastModified: r.updatedAt,
    changeFrequency: 'daily',
    priority: 0.4,
  }));

  return [...staticPages, ...itemPages, ...requestPages];
}