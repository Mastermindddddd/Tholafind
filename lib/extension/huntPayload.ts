import 'server-only';
import { Types } from 'mongoose';
import { Search, SearchResult } from '@/lib/models';
import { cleanPriceDisplay } from '@/lib/search/priceSanity';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tholafind.com';
const CONFIDENCE_RANK: Record<string, number> = { exact: 0, close: 1, guess: 2 };
const MAX_RESULTS = 8;

export interface HuntPayload {
  searchId: string;
  reference: string;
  status: string;
  resultsUrl: string;
  total: number;
  hint: string | null;
  diagnosis: { explanation: string; missing: string[] } | null;
  results: {
    id: string;
    title: string;
    image: string;
    price: string;
    source: string;
    sourceKind: string;
    confidence: string;
    matchScore: number | null;
    reason: string | null;
    url: string;
  }[];
}

/** The slim, public-safe view of a finished hunt that the extension panel renders. */
export async function buildHuntPayload(searchId: string): Promise<HuntPayload> {
  const id = new Types.ObjectId(searchId);
  const [search, docs] = await Promise.all([
    Search.findById(id).lean(),
    SearchResult.find({ searchId: id }).lean(),
  ]);

  const ranked = [...docs].sort(
    (a, b) =>
      (CONFIDENCE_RANK[a.confidence] ?? 3) - (CONFIDENCE_RANK[b.confidence] ?? 3) ||
      (b.matchScore ?? 0) - (a.matchScore ?? 0)
  );

  return {
    searchId,
    reference: search?.reference ?? '',
    status: search?.status ?? 'failed',
    resultsUrl: `${SITE_URL}/results/${searchId}`,
    total: docs.length,
    hint: search?.hint ?? null,
    diagnosis: search?.diagnosis
      ? {
          explanation: search.diagnosis.explanation,
          missing: (search.diagnosis.missing ?? []) as string[],
        }
      : null,
    results: ranked.slice(0, MAX_RESULTS).map((d) => ({
      id: String(d._id),
      title: d.title,
      image: d.image,
      price: cleanPriceDisplay(d.price) || 'See price on site',
      source: d.source,
      sourceKind: d.sourceKind,
      confidence: d.confidence,
      matchScore: typeof d.matchScore === 'number' ? d.matchScore : null,
      reason: d.matchReasons?.[0] ?? null,
      url: d.url,
    })),
  };
}