import { notFound } from 'next/navigation';
import { Types } from 'mongoose';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ResultsView from '@/components/ResultsView';
import { connectToDatabase } from '@/lib/db';
import { Search } from '@/lib/models';
import { mockResults } from '@/lib/mockData';

interface PageProps {
  params: { searchId: string };
}

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

  // Phase 2 only wires up real photo storage + a real Search document.
  // The actual matched items are still mockResults until Phase 3 (multi-source
  // search) replaces this with real SearchResult documents for this searchId.
  return (
    <div className="min-h-screen bg-paper paper-texture">
      <Navbar />
      <ResultsView
        reference={search.reference}
        photoUrl={search.images[0]}
        status={search.status}
        results={mockResults}
      />
      <Footer />
    </div>
  );
}