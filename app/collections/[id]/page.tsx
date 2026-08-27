import { notFound, redirect } from 'next/navigation';
import { Types } from 'mongoose';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ResultCard from '@/components/ResultCard';
import { getOrCreateUser, needsOnboarding } from '@/lib/getOrCreateUser';
import { Collection, CollectionItem, SearchResult } from '@/lib/models';
import { FindResult } from '@/lib/types';

// Explicit rather than relying on getOrCreateUser's implicit dynamic
// trigger — same reasoning as the results page.
export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function CollectionDetailPage({ params }: PageProps) {
  const { id } = params;

  const user = await getOrCreateUser();
  if (!user) redirect('/sign-in');
  if (needsOnboarding(user)) redirect('/onboarding');

  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  const collection = await Collection.findOne({ _id: id, userId: user._id }).lean();
  if (!collection) {
    notFound();
  }

  const items = await CollectionItem.find({ collectionId: collection._id })
    .sort({ createdAt: -1 })
    .lean();

  const resultDocs = await SearchResult.find({
    _id: { $in: items.map((i) => i.searchResultId) },
  }).lean();

  // Preserve the "most recently saved first" order from CollectionItem,
  // rather than whatever order the $in query happens to return them in.
  const resultsById = new Map(resultDocs.map((d) => [String(d._id), d]));
  const results: FindResult[] = items
    .map((item) => resultsById.get(String(item.searchResultId)))
    .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc))
    .map((doc) => ({
      id: String(doc._id),
      title: doc.title,
      source: doc.source,
      sourceKind: doc.sourceKind,
      price: doc.price || 'Price unavailable',
      confidence: doc.confidence,
      image: doc.image,
      url: doc.url,
      aspect: 1,
      saved: true, // by definition, everything here is saved to this collection
    }));

  return (
    <div className="min-h-screen bg-paper paper-texture">
      <Navbar />

      <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
        <Link
          href="/collections"
          className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-inkSoft hover:text-ink"
        >
          <ArrowLeft size={13} /> All collections
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {collection.name}
        </h1>
        <p className="mt-2 text-[0.9rem] text-inkSoft">
          {results.length} {results.length === 1 ? 'item' : 'items'} saved
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        {results.length === 0 ? (
          <p className="text-[0.88rem] text-inkSoft">
            Nothing saved here yet &mdash; find something on a results page and tap the heart to
            add it.
          </p>
        ) : (
          <div className="masonry">
            {results.map((item) => (
              <ResultCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}