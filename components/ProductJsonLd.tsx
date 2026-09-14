import { parsePrice } from '@/lib/alerts/parsePrice';
import type { FindResult } from '@/lib/types';

interface ProductJsonLdProps {
  item: FindResult;
  pageUrl: string;
}

/**
 * Emits schema.org Product markup. Deliberately omits the `offers` block
 * entirely when the price can't be parsed into a real number (e.g. the
 * "See price on site" fallback) rather than inventing a placeholder price
 * — Google's own structured data guidelines treat inaccurate price data as
 * a policy violation risk, and an incomplete-but-honest Product entry is
 * safer than a complete-but-wrong one.
 *
 * Reuses parsePrice from the alerts module (Phase 7) rather than writing a
 * second price parser — same "$68" / "$1,234.56" display strings, same
 * parsing problem.
 */
export default function ProductJsonLd({ item, pageUrl }: ProductJsonLdProps) {
  const numericPrice = parsePrice(item.price);

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.title,
    image: [item.image],
    url: pageUrl,
    brand: {
      '@type': 'Organization',
      name: item.source,
    },
  };

  if (numericPrice !== null) {
    data.offers = {
      '@type': 'Offer',
      price: numericPrice,
      priceCurrency: 'USD',
      url: item.url,
      availability: 'https://schema.org/InStock',
    };
  }

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}