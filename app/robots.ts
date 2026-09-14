import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tholafind.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/account',
          '/collections',
          '/onboarding',
          '/sign-in',
          '/sign-up',
          // Individual hunt results aren't meant as public discovery
          // content — /browse's curated pages are the intended
          // public-facing equivalent, so indexing every private hunt
          // would just be noisy, low-quality duplicate-ish content.
          '/results/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}