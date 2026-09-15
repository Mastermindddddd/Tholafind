import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HuntCard, { type HuntCardData } from '@/components/HuntCard';
import CollectionCard, { type CollectionCardData } from '@/components/CollectionCard';
import NewCollectionButton from '@/components/NewCollectionButton';
import { getOrCreateUser, needsOnboarding } from '@/lib/getOrCreateUser';
import { Search, SearchResult, Collection, CollectionItem, Alert } from '@/lib/models';
import type { AlertNotificationData } from '@/components/AlertToggle';
import { Bell } from 'lucide-react';

// Explicit rather than relying on getOrCreateUser's implicit dynamic
// trigger — same reasoning as the results page.
export const dynamic = 'force-dynamic';

const RECENT_HUNTS_LIMIT = 8;

export default async function CollectionsPage() {
  const user = await getOrCreateUser();

  // Middleware already requires sign-in for this route; this redirect only
  // covers the edge case of the Clerk session existing but the sync failing.
  if (!user) redirect('/sign-in');
  if (needsOnboarding(user)) redirect('/onboarding');

  // "Your hunts" — every search this account has ever run. This needed no
  // new modeling: Search documents already carry userId from Phase 2, so
  // "nothing gets lost" is just a matter of querying them, not a separate
  // auto-save mechanism.
  const recentSearches = await Search.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(RECENT_HUNTS_LIMIT)
    .lean();

  const alerts = await Alert.find({
    userId: user._id,
    searchId: { $in: recentSearches.map((s) => s._id) },
  }).lean();
  const alertBySearchId = new Map(alerts.map((a) => [String(a.searchId), a]));

  const hunts: HuntCardData[] = await Promise.all(
    recentSearches.map(async (s) => {
      const alert = alertBySearchId.get(String(s._id));
      const unreadNotifications = alert
        ? alert.notifications.filter((n) => n.createdAt > alert.seenAt)
        : [];
      const recentNotifications: AlertNotificationData[] = (alert?.notifications ?? [])
        .slice(-5)
        .reverse()
        .map((n) => ({ message: n.message, createdAt: n.createdAt.toISOString() }));

      return {
        searchId: String(s._id),
        reference: s.reference,
        photo: s.images[0],
        status: s.status,
        resultCount: await SearchResult.countDocuments({ searchId: s._id }),
        updatedAt: s.updatedAt,
        isWatched: alert?.active ?? false,
        unreadCount: unreadNotifications.length,
        recentNotifications,
      };
    })
  );

  // "Saved finds" — curated folders of individually hearted results
  // (ResultCard's save button), distinct from the hunt history above.
  const rawCollections = await Collection.find({ userId: user._id })
    .sort({ isDefault: -1, createdAt: 1 })
    .lean();

  const collections: CollectionCardData[] = await Promise.all(
    rawCollections.map(async (c) => {
      const itemCount = await CollectionItem.countDocuments({ collectionId: c._id });
      const firstItem = await CollectionItem.findOne({ collectionId: c._id }).sort({ createdAt: -1 });
      const cover = firstItem
        ? (await SearchResult.findById(firstItem.searchResultId).select('image').lean())?.image ?? null
        : null;

      return {
        id: String(c._id),
        name: c.name,
        isDefault: c.isDefault,
        itemCount,
        cover,
      };
    })
  );

  return (
    <div className="min-h-screen bg-paper paper-texture">
      <Navbar />

      <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
  <div className="flex items-center gap-2">
    <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-brick">
      {user.name ? `${user.name}\u2019s hunts` : 'Your hunts'}
    </p>
  </div>

  <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
    Nothing here{' '}
    <span className="relative italic text-pine">
      gets lost.
      <span className="absolute -right-5 -top-3 text-base text-brass">✦</span>
    </span>
  </h1>

  <p className="mt-2 max-w-xl text-[0.9rem] text-inkSoft">
    Every search you start is saved automatically. Anything you save from a results page
    lands in a collection below - walk away for a month, and pick up exactly where you
    left off.
  </p>
</section>

      {/* Your hunts — real search history, no manual saving required. */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
  <div className="flex items-center gap-2">
    <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-brass">
      Specimen log
    </span>
    <span className="h-px flex-1 bg-line" />
  </div>
  <h2 className="mt-1.5 font-display text-xl font-semibold text-ink">Recent hunts</h2>

  {hunts.length === 0 ? (
    <p className="mt-3 rounded-md border border-dashed border-line bg-paperDim/50 p-5 text-[0.88rem] text-inkSoft">
      No hunts yet - head to the home page and drop in a photo to start your first one.
    </p>
  ) : (
    <>
      <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {hunts.map((h, i) => (
          <div
            key={h.searchId}
            className={`transition-transform hover:rotate-0 ${
              i % 2 === 0 ? 'rotate-[-0.5deg]' : 'rotate-[0.5deg]'
            }`}
          >
            <HuntCard hunt={h} />
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-start gap-3 rounded-md border border-dashed border-line bg-paperDim/50 p-5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine text-brassLight">
          <Bell size={14} />
        </span>
        <p className="text-[0.85rem] text-inkSoft">
          Tap the bell on any hunt above to watch it - Tholafind checks daily for new
          listings or a price drop, so you don&rsquo;t have to keep coming back to look.
        </p>
      </div>
    </>
  )}
</section>

      {/* Saved finds — curated folders of individually hearted results. */}
      <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-brass">
          Curated
        </span>
        <span className="h-px w-8 bg-line" />
      </div>
      <h2 className="mt-1.5 font-display text-xl font-semibold text-ink">Saved finds</h2>
    </div>
    <NewCollectionButton />
  </div>

  <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
    {collections.map((c, i) => (
      <div
        key={c.id}
        className={`transition-transform hover:rotate-0 ${
          i % 2 === 0 ? 'rotate-[0.5deg]' : 'rotate-[-0.5deg]'
        }`}
      >
        <CollectionCard collection={c} />
      </div>
    ))}
  </div>
</section>

      <Footer />
    </div>
  );
}