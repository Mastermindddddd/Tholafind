import { notFound } from 'next/navigation';
import { Types } from 'mongoose';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ResultsView from '@/components/ResultsView';
import { connectToDatabase } from '@/lib/db';
import { Search, SearchResult, Collection, CollectionItem, CommunityRequest } from '@/lib/models';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { Confidence, FindResult } from '@/lib/types';

// Explicit rather than relying on getOrCreateUser's implicit dynamic
// trigger via Clerk's currentUser() — this page must never be statically
// cached regardless of which code path ends up calling it.
export const dynamic = 'force-dynamic';

interface PageProps {
  params: { searchId: string };
}

const CONFIDENCE_RANK: Record<Confidence, number> = { exact: 0, close: 1, guess: 2 };

export default async function ResultsPage({ params }: PageProps) {
  const { searchId } = params;

  if (!Types.ObjectId.isValid(searchId)) {
    notFound();
  }

  await connectToDatabase();
  const search = await Search.findById(searchId).lean();

  if (!search) {
    notFound();
  }

  const resultDocs = await SearchResult.find({ searchId: search._id }).lean();

  const existingCommunityRequest = await CommunityRequest.findOne({ searchId: search._id })
    .select('_id')
    .lean();

  // Anonymous visitors never have saved items — skip the lookup entirely
  // rather than querying with an empty collection list.
  const user = await getOrCreateUser();
  let savedResultIds = new Set<string>();
  if (user && resultDocs.length > 0) {
    const userCollectionIds = (await Collection.find({ userId: user._id }).select('_id')).map(
      (c) => c._id
    );
    const savedItems = await CollectionItem.find({
      collectionId: { $in: userCollectionIds },
      searchResultId: { $in: resultDocs.map((d) => d._id) },
    }).select('searchResultId');
    savedResultIds = new Set(savedItems.map((item) => String(item.searchResultId)));
  }

  const results: FindResult[] = resultDocs
    .map((doc) => ({
      id: String(doc._id),
      title: doc.title,
      source: doc.source,
      sourceKind: doc.sourceKind,
      // A small number of retail matches are non-commerce pages Google
      // Lens matched visually rather than genuine product listings — those
      // will never have a price to extract, no matter how the parsing
      // improves. "See price on site" reads as a next step, not a dead end.
      price: doc.price || 'See price on site',
      confidence: doc.confidence,
      image: doc.image,
      url: doc.url,
      // Real provider responses don't consistently include image dimensions
      // (SerpApi sometimes does, eBay/Etsy don't in the fields we request),
      // so every real result renders at a uniform 1:1 aspect for now — the
      // masonry variety in earlier mock data was hand-picked, not derived
      // from anything real. Worth revisiting if a source's true dimensions
      // become available.
      aspect: 1,
      saved: savedResultIds.has(String(doc._id)),
    }))
    .sort(
      (a, b) =>
        CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence]
    );

  return (
    <div className="min-h-screen bg-paper paper-texture">
      <Navbar />
      <ResultsView
        searchId={String(search._id)}
        reference={search.reference}
        photoUrls={search.images}
        status={search.status}
        imageCount={search.images.length}
        results={results}
        communityRequestId={existingCommunityRequest ? String(existingCommunityRequest._id) : null}
      />
      <Footer />
    </div>
  );
}