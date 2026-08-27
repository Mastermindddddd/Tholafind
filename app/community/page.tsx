import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { connectToDatabase } from '@/lib/db';
import { CommunityRequest, Search } from '@/lib/models';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import { Users } from 'lucide-react';

// No Clerk auth call on this page (browsing is intentionally public), so
// there's no implicit signal telling Next not to statically prerender it.
// Without this, a build-time render would either fail outright (no DB
// reachable at build time) or, worse, succeed and bake in whatever open
// requests existed at that moment as a permanently stale cached page.
export const dynamic = 'force-dynamic';

const FEED_LIMIT = 30;

export default async function CommunityFeedPage() {
  await connectToDatabase();

  const openRequests = await CommunityRequest.find({ status: 'open' })
    .sort({ createdAt: -1 })
    .limit(FEED_LIMIT)
    .lean();

  const searches = await Search.find({
    _id: { $in: openRequests.map((r) => r.searchId) },
  })
    .select('reference images hint')
    .lean();
  const searchById = new Map(searches.map((s) => [String(s._id), s]));

  const feed = openRequests
    .map((r) => {
      const search = searchById.get(String(r.searchId));
      if (!search) return null;
      return {
        id: String(r._id),
        reference: search.reference,
        photo: search.images[0],
        hint: search.hint,
        answerCount: r.answers.length,
        createdAt: r.createdAt,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <div className="min-h-screen bg-paper paper-texture">
      <Navbar />

      <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-brick">
          The finders
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Someone else&rsquo;s hunt might be one you can crack.
        </h1>
        <p className="mt-2 max-w-xl text-[0.9rem] text-inkSoft">
          These are searches the algorithm couldn&rsquo;t confidently place. A tag close-up, a
          fabric guess, a &ldquo;that&rsquo;s from an old IKEA line&rdquo; &mdash; that&rsquo;s usually all it takes.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        {feed.length === 0 ? (
          <p className="text-[0.88rem] text-inkSoft">
            No open requests right now &mdash; check back soon.
          </p>
        ) : (
          <div className="masonry">
            {feed.map((r) => (
              <Link
                key={r.id}
                href={`/community/${r.id}`}
                className="group relative block overflow-hidden rounded-[6px] border border-line/70 bg-card shadow-card transition-shadow duration-300 hover:shadow-cardHover"
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.photo}
                    alt={`Hunt ${r.reference}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-3.5">
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.08em] text-brick">
                    #{r.reference}
                  </p>
                  {r.hint && (
                    <p className="mt-1 font-display text-[0.95rem] leading-snug text-ink">
                      {r.hint}
                    </p>
                  )}
                  <div className="mt-2.5 flex items-center justify-between border-t border-dashed border-line pt-2.5 text-[0.75rem] text-inkSoft">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {r.answerCount} {r.answerCount === 1 ? 'answer' : 'answers'}
                    </span>
                    <span>{formatRelativeTime(r.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}