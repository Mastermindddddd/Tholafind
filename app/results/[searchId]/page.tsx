import { notFound } from 'next/navigation';
import { Types } from 'mongoose';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ResultsView from '@/components/ResultsView';
import { connectToDatabase } from '@/lib/db';
import { Search, SearchResult } from '@/lib/models';
import { Confidence, FindResult } from '@/lib/types';

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

  const results: FindResult[] = resultDocs
    .map((doc) => ({
      id: String(doc._id),
      title: doc.title,
      source: doc.source,
      sourceKind: doc.sourceKind,
      price: doc.price || 'Price unavailable',
      confidence: doc.confidence,
      image: doc.image,
      // Real provider responses don't consistently include image dimensions
      // (SerpApi sometimes does, eBay/Etsy don't in the fields we request),
      // so every real result renders at a uniform 1:1 aspect for now — the
      // masonry variety in earlier mock data was hand-picked, not derived
      // from anything real. Worth revisiting if a source's true dimensions
      // become available.
      aspect: 1,
    }))
    .sort(
      (a, b) =>
        CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence]
    );

  return (
    <div className="min-h-screen bg-paper paper-texture">
      <Navbar />
      <ResultsView
        reference={search.reference}
        photoUrl={search.images[0]}
        status={search.status}
        results={results}
      />
      <Footer />
    </div>
  );
}