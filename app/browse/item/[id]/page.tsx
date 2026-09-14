import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Types } from 'mongoose';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ResultCard from '@/components/ResultCard';
import ProductJsonLd from '@/components/ProductJsonLd';
import { connectToDatabase } from '@/lib/db';
import { SearchResult } from '@/lib/models';
import { getCuratedResults } from '@/lib/browse/getCuratedResults';
import { toFindResult } from '@/lib/browse/toFindResult';
import { getSavedResultIds } from '@/lib/getSavedResultIds';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import StampBadge from '@/components/StampBadge';
import { ArrowUpRight, ArrowLeft, Camera } from 'lucide-react';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tholafind.com';

interface PageProps {
  params: { id: string };
}

const sourceLabel: Record<string, string> = {
  retail: 'Retail',
  resale: 'Resale',
  vintage: 'Vintage',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!Types.ObjectId.isValid(params.id)) return {};

  await connectToDatabase();
  const doc = await SearchResult.findById(params.id).lean();
  if (!doc) return {};

  const title = `${doc.title} — found on Tholafind`;
  const description = `${doc.title}, matched from a real photo search on Tholafind (${
    sourceLabel[doc.sourceKind]
  } · ${doc.source}). See the original listing and browse similar finds.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [doc.image],
      type: 'website',
    },
  };
}

export default async function ItemDetailPage({ params }: PageProps) {
  const { id } = params;

  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectToDatabase();
  const doc = await SearchResult.findById(id).lean();

  // 'guess'-tier results don't get a public page — same quality bar as the
  // rest of /browse. They still exist and work fine on their own search's
  // results page, just aren't promoted as standalone public content.
  if (!doc || doc.confidence === 'guess') {
    notFound();
  }

  const user = await getOrCreateUser();
  const savedResultIds = await getSavedResultIds(user?._id, [doc._id]);
  const item = toFindResult(doc, savedResultIds);

  const related = await getCuratedResults({
    sourceKind: doc.sourceKind,
    limit: 8,
    excludeId: id,
  });
  const relatedSavedIds = await getSavedResultIds(
    user?._id,
    related.map((r) => r._id)
  );
  const relatedItems = related.map((r) => toFindResult(r, relatedSavedIds));

  const pageUrl = `${SITE_URL}/browse/item/${id}`;

  return (
    <div className="min-h-screen bg-paper paper-texture">
      <ProductJsonLd item={item} pageUrl={pageUrl} />
      <Navbar />

      <section className="mx-auto max-w-4xl px-5 pt-10 sm:px-8">
        <Link
          href={`/browse/${doc.sourceKind}`}
          className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-inkSoft hover:text-ink"
        >
          <ArrowLeft size={13} /> {sourceLabel[doc.sourceKind]} finds
        </Link>

        <div className="mt-5 grid gap-8 sm:grid-cols-[1fr_1.1fr]">
          <div className="relative aspect-square w-full overflow-hidden rounded-md border border-line shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
            <div className="absolute left-3 top-3">
              <StampBadge confidence={item.confidence} />
            </div>
          </div>

          <div>
            <span className="rounded-full bg-paperDim px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-inkSoft">
              {sourceLabel[doc.sourceKind]}
            </span>
            <h1 className="mt-3 font-display text-2xl font-semibold leading-snug text-ink sm:text-3xl">
              {item.title}
            </h1>
            <p className="mt-2 text-[0.9rem] text-inkSoft">Found on {item.source}</p>
            <p className="mt-4 font-display text-3xl font-semibold text-ink">{item.price}</p>

            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex w-fit items-center gap-1.5 rounded-full bg-brick px-5 py-2.5 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-brick/85"
            >
              View on {item.source} <ArrowUpRight size={13} />
            </a>

            <div className="mt-8 rounded-md border border-dashed border-line bg-card p-5">
              <p className="flex items-center gap-2 font-display text-[0.98rem] font-semibold text-ink">
                <Camera size={15} /> Trying to find something like this?
              </p>
              <p className="mt-1.5 text-[0.85rem] text-inkSoft">
                This match came from a real photo search. Drop in your own photo and Tholafind
                searches retail, resale, and vintage sources at once.
              </p>
              <Link
                href="/"
                className="mt-3 inline-block rounded-full bg-pine px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-paper transition-colors hover:bg-pineDeep"
              >
                Start a hunt
              </Link>
            </div>
          </div>
        </div>
      </section>

      {relatedItems.length > 0 && (
        <section className="mx-auto max-w-4xl px-5 py-14 sm:px-8">
          <h2 className="font-display text-xl font-semibold text-ink">
            More {sourceLabel[doc.sourceKind].toLowerCase()} finds
          </h2>
          <div className="masonry mt-5">
            {relatedItems.map((r) => (
              <ResultCard key={r.id} item={r} />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}